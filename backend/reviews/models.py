from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from items.models import Store


class Rating(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="ratings")
    rater = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ratings_given"
    )
    score = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["store", "rater"], name="one_rating_per_rater_per_store"),
        ]

    def __str__(self):
        return f"{self.rater} -> {self.store} ({self.score})"
