# Production Migration Guide: Integer IDs to UUIDs

## ⚠️ Critical Production Impact

This migration will have significant impact on your production environment:

### 1. **All Users Will Be Logged Out**

- All existing user sessions will become invalid
- User IDs change from integers to UUIDs
- Sessions store the old integer user IDs, which no longer exist
- **Action Required**: All users must log in again after migration

### 2. **Data Integrity**

- ✅ All existing data is preserved
- ✅ All relationships (foreign keys) are maintained
- ⚠️ All IDs change (users, projects, tasks, files, clients)
- ⚠️ Any external systems referencing old integer IDs will break

### 3. **Migration Characteristics**

- **One-way migration**: Cannot be easily rolled back
- **Downtime**: Brief downtime during migration (typically 1-5 minutes)
- **Transaction safety**: Migration runs in a transaction (rolls back on error)

## 🚀 Deployment Steps for Railway

### Option 1: Using Migrations (Recommended)

```bash
# 1. Deploy your code first (with the new UUID schema)
railway up

# 2. Run the migration
railway run npm run db:migrate
```

**Why `db:migrate` instead of `db:push`?**

- `db:migrate` runs the migration file we created, which safely converts existing data
- `db:push` tries to auto-generate changes and will fail with the same error you saw

### Option 2: Manual Migration (If needed)

If you need more control, you can run the migration SQL directly:

```bash
# Connect to Railway database
railway connect postgres

# Then run the migration file
\i drizzle/0001_convert_ids_to_uuid.sql
```

## 📋 Pre-Migration Checklist

- [ ] **Backup your database** (Railway provides automatic backups, but verify)
- [ ] **Notify users** about planned maintenance and logout
- [ ] **Schedule maintenance window** (recommend low-traffic period)
- [ ] **Test migration on staging** if you have one
- [ ] **Verify environment variables** are set correctly
- [ ] **Check Railway database connection** is working

## 🔄 Post-Migration Steps

1. **Verify migration success**:

   ```bash
   railway run npm run db:push
   # Should show "No changes detected"
   ```

2. **Test the application**:
   - Try logging in
   - Create a new project/task
   - Verify existing data is accessible

3. **Monitor for issues**:
   - Check Railway logs for errors
   - Monitor user login success rate
   - Verify no broken references

## 🛡️ Rollback Plan (If Needed)

**Note**: This migration is difficult to rollback because:

- All IDs have changed
- Foreign keys have been updated
- Sessions are invalidated

If you need to rollback:

1. Restore from database backup (before migration)
2. Revert code deployment to previous version
3. This will lose any data created after migration

## 📊 Migration Performance

- **Small database** (< 1,000 records): ~10-30 seconds
- **Medium database** (1,000-10,000 records): ~1-3 minutes
- **Large database** (10,000+ records): ~5-15 minutes

The migration uses temporary columns and updates, which is safe but can be slow on large datasets.

## 🔍 What Gets Migrated

- ✅ `users.id` (integer → UUID)
- ✅ `projects.id` (integer → UUID)
- ✅ `projects.user_id` (integer → UUID)
- ✅ `tasks.id` (integer → UUID)
- ✅ `tasks.user_id` (integer → UUID)
- ✅ `tasks.project_id` (integer → UUID)
- ✅ `files.id` (integer → UUID)
- ✅ `files.user_id` (integer → UUID)
- ✅ `files.project_id` (integer → UUID)
- ✅ `clients.id` (integer → UUID)
- ✅ `clients.user_id` (integer → UUID)

## ⚡ Quick Reference

```bash
# Deploy code
railway up

# Run migration
railway run npm run db:migrate

# Verify schema
railway run npm run db:push
```

## 🆘 Troubleshooting

### Migration fails with "column cannot be cast"

- **Cause**: Migration file not found or incorrect
- **Solution**: Ensure `drizzle/0001_convert_ids_to_uuid.sql` exists and is committed

### Users can't log in after migration

- **Cause**: Sessions invalidated (expected)
- **Solution**: Users need to log in again (this is normal)

### Foreign key errors

- **Cause**: Migration didn't complete properly
- **Solution**: Check migration logs, may need to restore from backup

### "No changes detected" after migration

- **Cause**: Migration completed successfully
- **Solution**: This is correct! Your schema matches the code now.
