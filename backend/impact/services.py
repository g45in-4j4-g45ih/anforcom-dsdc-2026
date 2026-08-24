from collections import defaultdict
from decimal import Decimal

from items.models import Item, Klaim


TRACKED_UNITS = ("kg", "liter")
RESCUE_PATHS = (
    "jual_diskon",
    "donasi",
    "material_exchange",
)


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


def rescue_path(item):
    if item.condition == Item.Condition.BYPRODUCT:
        return "material_exchange"
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
