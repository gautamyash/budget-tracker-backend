# Budget Tracker Backend - PostgreSQL Setup

## 🗄️ Database: PostgreSQL Only

This backend uses **PostgreSQL exclusively** - no SQLite fallback.

### Requirements

- Python 3.8+
- PostgreSQL 12+ (for local development)
- pip

### ⚙️ Setup Instructions

#### 1. **Create PostgreSQL database locally (Optional for development)**

```bash
# Using PostgreSQL CLI
createdb budget_tracker
createuser budget_tracker_user -P  # Enter password: admin123
psql -U postgres -d budget_tracker -c "ALTER USER budget_tracker_user WITH PASSWORD 'admin123';"
```

#### 2. **Set environment variable**

Create `.env` file in `budget-tracker-backend/`:

```env
DATABASE_URL=postgresql://budget_tracker_user:admin123@localhost:5432/budget_tracker
```

#### 3. **Install dependencies**

```bash
cd budget-tracker-backend
pip install -r requirements.txt
```

#### 4. **Run migrations**

```bash
cd backend
python manage.py migrate
```

#### 5. **Create superuser (optional)**

```bash
python manage.py create_superuser
```

#### 6. **Seed default categories**

```bash
python manage.py seed_categories
```

#### 7. **Start server**

```bash
python manage.py runserver
```

---

## 🚀 Render.com Deployment (Production)

### Step 1: Create PostgreSQL on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. **New** → **PostgreSQL**
3. Name: `budget-tracker-db`
4. Region: Same as your backend
5. Click **Create Database**

### Step 2: Add Environment Variable

1. Go to your **backend service**
2. **Settings** → **Environment**
3. Add:
   ```
   DATABASE_URL = [Copy from PostgreSQL External URL]
   ```

### Step 3: Update Build Command

In **Settings → Build & Deploy → Build Command:**

```bash
pip install -r requirements.txt && cd backend && python manage.py migrate && python manage.py create_superuser && python manage.py seed_categories
```

### Step 4: Deploy

Click **Manual Deploy** or push to GitHub for auto-deploy.

---

## 📋 Database Structure

| Table | Purpose |
|-------|---------|
| `auth_user` | User accounts (Django built-in) |
| `api_category` | Income/Expense categories |
| `api_transaction` | Income and expense records |
| `api_budget` | Monthly budget limits |

---

## ✅ Verification Checklist

- [x] No SQLite files committed
- [x] `DATABASE_URL` required in production
- [x] PostgreSQL used for both local & production
- [x] Migrations run automatically on deploy
- [x] Default admin user created on deploy
- [x] Default categories seeded on deploy
