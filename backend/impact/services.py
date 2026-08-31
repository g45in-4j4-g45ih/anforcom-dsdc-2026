from collections import defaultdict
from decimal import Decimal

from django.db.models import Q

from items.models import Item, Klaim


TRACKED_UNITS = ("kg", "liter")
RESCUE_PATHS = (
    "jual_diskon",
    "donasi",
    "byproduct",
)

RESCUE_PATH_ALIASES = {
    "material_exchange": "byproduct",
}


def completed_claims():
    return (
        Klaim.objects.filter(status=Klaim.StatusKlaim.SELESAI)
        .select_related(
            "item",
            "item__store",
            "item__store__owner",
            "peminat",
        )
        .order_by("-completed_at", "-id")
    )


def user_completed_claims(user):
    return completed_claims().filter(
        Q(peminat=user) | Q(item__store__owner=user)
    ).distinct()


def filter_history_claims(claims, filters):
    path = filters.get("path")
    category = filters.get("category")
    start_date = filters.get("start_date")
    end_date = filters.get("end_date")

    if path == "byproduct":
        claims = claims.filter(
            item__condition=Item.Condition.BYPRODUCT,
        )
    elif path == "jual_diskon":
        claims = claims.filter(
            item__listing_type=Item.ListingType.DISKON,
        ).exclude(
            item__condition=Item.Condition.BYPRODUCT,
        )
    elif path == "donasi":
        claims = claims.filter(
            item__listing_type=Item.ListingType.DONASI,
        ).exclude(
            item__condition=Item.Condition.BYPRODUCT,
        )

    if category:
        claims = claims.filter(item__category__iexact=category)

    if start_date:
        claims = claims.filter(completed_at__date__gte=start_date)

    if end_date:
        claims = claims.filter(completed_at__date__lte=end_date)

    return claims


def rescue_path(item):
    if item.condition == Item.Condition.BYPRODUCT:
        return "byproduct"
    if item.listing_type == Item.ListingType.DISKON:
        return "jual_diskon"
    if item.listing_type == Item.ListingType.DONASI:
        return "donasi"
    return None


def empty_measurement():
    return {
        "total_kg": Decimal("0"),
        "total_liter": Decimal("0"),
        "total_transactions": 0,
    }


def add_claim(measurement, claim):
    measurement["total_transactions"] += 1

    if claim.item.unit in TRACKED_UNITS:
        key = f"total_{claim.item.unit}"
        measurement[key] += claim.jumlah_diklaim


def build_impact_summary(claims):
    totals = empty_measurement()
    by_path = {
        path: empty_measurement()
        for path in RESCUE_PATHS
    }
    by_category = defaultdict(empty_measurement)

    for claim in claims:
        add_claim(totals, claim)

        path = rescue_path(claim.item)
        if path:
            add_claim(by_path[path], claim)

        category = claim.item.category.strip() or "Tanpa Kategori"
        add_claim(by_category[category], claim)

    categories = [
        {
            "category": category,
            **measurement,
        }
        for category, measurement in sorted(by_category.items())
    ]

    return {
        "totals": totals,
        "by_path": by_path,
        "by_category": categories,
    }


def build_role_summary(claims, user):
    by_role = {
        "poster": empty_measurement(),
        "claimer": empty_measurement(),
    }

    for claim in claims:
        if claim.item.store.owner_id == user.id:
            add_claim(by_role["poster"], claim)

        if claim.peminat_id == user.id:
            add_claim(by_role["claimer"], claim)

    return by_role


def claim_roles(claim, user):
    roles = []

    if claim.item.store.owner_id == user.id:
        roles.append("poster")

    if claim.peminat_id == user.id:
        roles.append("claimer")

    return roles


def build_impact_history(claims, user):
    return [
        {
            "id": claim.id,
            "item": {
                "id": claim.item_id,
                "name": claim.item.name,
            },
            "path": rescue_path(claim.item),
            "category": (
                claim.item.category.strip()
                or "Tanpa Kategori"
            ),
            "quantity": claim.jumlah_diklaim,
            "unit": claim.item.unit,
            "roles": claim_roles(claim, user),
            "completed_at": claim.completed_at,
        }
        for claim in claims
    ]
