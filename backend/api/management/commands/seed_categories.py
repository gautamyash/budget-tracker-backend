from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Category

class Command(BaseCommand):
    help = 'Create default categories for users'

    def handle(self, *args, **options):
        # Default category templates
        DEFAULT_CATEGORIES = {
            'income': ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other Income'],
            'expense': ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Other'],
        }
        
        # Apply to all users
        for user in User.objects.all():
            for category_type, names in DEFAULT_CATEGORIES.items():
                for name in names:
                    Category.objects.get_or_create(
                        user=user,
                        name=name,
                        type=category_type
                    )
        
        self.stdout.write(self.style.SUCCESS('✅ Default categories created for all users'))
