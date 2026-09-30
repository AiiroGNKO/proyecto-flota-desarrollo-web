from django.urls import path
from . import views

urlpatterns = [
    path("vehiculos/", views.vehiculo_list, name="vehiculo-list"),
]