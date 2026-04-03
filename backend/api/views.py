from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Transaction, Budget
from .serializers import CategorySerializer, TransactionSerializer, BudgetSerializer
from datetime import datetime

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def summary_view(request):
    user = request.user
    income = Transaction.objects.filter(user=user, type='income').aggregate(total=Sum('amount'))['total'] or 0
    expense = Transaction.objects.filter(user=user, type='expense').aggregate(total=Sum('amount'))['total'] or 0
    
    return Response({
        "total_income": float(income),
        "total_expenses": float(expense),
        "balance": float(income - expense)
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def budget_summary(request):
    user = request.user
    now = datetime.now()
    try:
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
    except (ValueError, TypeError):
        month = now.month
        year = now.year
    
    budget = Budget.objects.filter(user=user, month=month, year=year).first()
    
    total_spent = Transaction.objects.filter(
        user=user, 
        type='expense', 
        date__month=month, 
        date__year=year
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    budget_amount = float(budget.amount) if budget else 0
    spent_amount = float(total_spent)
    
    return Response({
        "budget_amount": budget_amount,
        "total_spent": spent_amount,
        "remaining": budget_amount - spent_amount,
        "month": month,
        "year": year
    })

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'type']

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user).order_by('-date')
        
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
            
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')
        if min_amount:
            qs = qs.filter(amount__gte=min_amount)
        if max_amount:
            qs = qs.filter(amount__lte=max_amount)
            
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        month = serializer.validated_data.get('month')
        year = serializer.validated_data.get('year')
        Budget.objects.filter(user=self.request.user, month=month, year=year).delete()
        serializer.save(user=self.request.user)