from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, TransactionViewSet, BudgetViewSet, summary_view

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('budgets', BudgetViewSet, basename='budget')

urlpatterns = router.urls

# 👇 IMPORTANT
urlpatterns += [
    path('summary/', summary_view),
]