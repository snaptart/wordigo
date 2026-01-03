# Database Migration Guide - Local to Render

This guide explains how to migrate your local PostgreSQL database to Render's PostgreSQL.

## Prerequisites

- PostgreSQL client tools installed (`pg_dump`, `psql`)
- Your local database populated with data
- Render PostgreSQL database created

## Method 1: Using pg_dump (Recommended)

### Step 1: Get Render Database URLs

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your `wordigo-db` database
3. Copy these connection strings:
   - **Internal Database URL** (for backend app)
   - **External Database URL** (for your local machine)

The External URL looks like:
```
postgresql://wordigo_user:LONG_PASSWORD@dpg-xxxxx.oregon-postgres.render.com/wordigo_db
```

### Step 2: Export Local Database

**On Windows:**
```bash
# Update the LOCAL_DB_URL in the script first
.\scripts\export-database.bat
```

**On Mac/Linux:**
```bash
# Make script executable
chmod +x scripts/export-database.sh

# Update the LOCAL_DB_URL in the script first
./scripts/export-database.sh
```

**Or manually:**
```bash
# Replace with your local DATABASE_URL from .env
pg_dump "postgresql://postgres:password@localhost:5432/wordigo" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > wordigo-backup.sql
```

### Step 3: Import to Render

```bash
# Use the EXTERNAL Database URL from Render
psql "postgresql://wordigo_user:PASSWORD@dpg-xxxxx.oregon-postgres.render.com/wordigo_db" \
  < wordigo-backup.sql
```

### Step 4: Verify

```bash
# Check if data is there
psql "YOUR_RENDER_EXTERNAL_URL" -c "SELECT COUNT(*) FROM words;"
psql "YOUR_RENDER_EXTERNAL_URL" -c "SELECT COUNT(*) FROM senses;"
```

---

## Method 2: Using Prisma (For Testing Data)

If you have Prisma seed scripts or want to recreate the schema:

### Step 1: Update DATABASE_URL

Temporarily update `wordigo-backend/.env`:
```env
DATABASE_URL="postgresql://wordigo_user:PASSWORD@dpg-xxxxx.oregon-postgres.render.com/wordigo_db"
```

### Step 2: Run Migrations

```bash
cd wordigo-backend
npx prisma migrate deploy
```

### Step 3: Seed/Import Data

If you have seed scripts:
```bash
npm run import:wordnet
npm run compute:difficulty
```

Or manually copy specific tables (see Method 3 below).

---

## Method 3: Copy Specific Tables

If you only need certain tables or want selective data:

```bash
# Export specific tables
pg_dump "LOCAL_DB_URL" \
  --table=words \
  --table=senses \
  --table=synsets \
  --table=lexdomains \
  --data-only \
  > wordnet-data.sql

# Import to Render
psql "RENDER_EXTERNAL_URL" < wordnet-data.sql
```

---

## Method 4: Using GUI Tools

### Using pgAdmin

1. **Export:**
   - Connect to local database
   - Right-click database → Backup
   - Format: Plain
   - Save file

2. **Import:**
   - Connect to Render database (use External URL)
   - Right-click database → Restore
   - Select your backup file

### Using DBeaver / TablePlus

1. Connect to both databases
2. Use export/import wizards
3. Select tables to copy

---

## Method 5: Direct Database-to-Database Copy

For large databases, copy directly without intermediate files:

```bash
# Create a pipe between databases
pg_dump "LOCAL_DB_URL" \
  --no-owner \
  --no-privileges \
  | psql "RENDER_EXTERNAL_URL"
```

---

## Important Notes

### Before Migration

1. **Backup Render Database** (just in case):
   ```bash
   pg_dump "RENDER_EXTERNAL_URL" > render-backup-before-migration.sql
   ```

2. **Check Schema Compatibility:**
   - Ensure local schema matches Prisma schema
   - Run migrations on Render first if needed

### Data Considerations

**Large WordNet Database:**
- Your WordNet data is quite large
- Consider compression for faster transfer:
  ```bash
  pg_dump "LOCAL_DB_URL" | gzip > wordigo-backup.sql.gz
  gunzip -c wordigo-backup.sql.gz | psql "RENDER_EXTERNAL_URL"
  ```

**User Data:**
- If you have test user accounts, consider excluding them
- Or reset passwords for security

### Potential Issues

#### Connection Timeout
If the import times out:
```bash
# Increase statement timeout
psql "RENDER_EXTERNAL_URL" -c "SET statement_timeout = 0;"
```

#### SSL Required Error
Render requires SSL. Add to connection string:
```
?sslmode=require
```

#### Permission Errors
Use `--no-owner --no-privileges` flags to avoid ownership issues.

---

## After Migration Checklist

- [ ] Verify table row counts match
- [ ] Test a few queries
- [ ] Check indexes were created
- [ ] Test your app with Render database
- [ ] Run backend health check: `https://your-backend.onrender.com/health`

---

## Quick Reference Commands

### Count Rows in All Tables
```bash
# Local
psql "LOCAL_DB_URL" -c "SELECT schemaname,relname,n_live_tup FROM pg_stat_user_tables;"

# Render
psql "RENDER_EXTERNAL_URL" -c "SELECT schemaname,relname,n_live_tup FROM pg_stat_user_tables;"
```

### Check Database Size
```bash
psql "RENDER_EXTERNAL_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

### Drop All Tables (if you need to start over)
```bash
# BE CAREFUL - this deletes everything!
npx prisma migrate reset --skip-seed
```

---

## Recommended Workflow

For your WordNet-based app, I recommend:

1. **Deploy backend to Render first** (let it create schema)
2. **Export only data** from local database
3. **Import data** to Render
4. **Test** thoroughly before sharing with users

Example:
```bash
# 1. Deploy backend (creates schema via migrations)
# (Done through Render dashboard)

# 2. Export data only
pg_dump "LOCAL_DB_URL" --data-only > data-only.sql

# 3. Import to Render
psql "RENDER_EXTERNAL_URL" < data-only.sql

# 4. Verify
psql "RENDER_EXTERNAL_URL" -c "SELECT COUNT(*) FROM words;"
```

---

## Need Help?

Common issues:
- **pg_dump not found:** Install PostgreSQL client tools
- **Connection refused:** Use External URL, not Internal
- **Timeout:** Your database might be large, use compression
- **SSL error:** Add `?sslmode=require` to URL

If you're stuck, Render support is very responsive!
