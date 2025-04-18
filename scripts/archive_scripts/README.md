# Archive Scripts

This directory contains SQL scripts that:
- Were used for one-time operations
- Are no longer needed for regular operation
- Are kept for historical reference

## Scripts:

- `clear_all_data.sql` - Script for clearing data from all tables
- `clear_all_tables.sql` - Script for truncating all tables
- `clear_users_table.sql` - Script for clearing only user data
- `fix_add_or_update_game.sql` - One-time fix for the add_or_update_game function
- `update_games_table.sql` - One-time update to games table structure
- `update_user_roles.sql` - One-time script to update existing user roles
- `add_role_column.sql` - One-time script to add the role column to users table

## Using Archive Scripts

These scripts should only be used in specific maintenance scenarios. Exercise caution when running them as they may delete data.

### Prerequisites
- psql (PostgreSQL client) installed
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local` or environment
- Admin privileges on the database

### Running an Archive Script

\`\`\`bash
# Example: Running a script to clear all tables (USE WITH EXTREME CAUTION)
psql \
  -h $SUPABASE_URL \
  -U postgres \
  -d postgres \
  -f scripts/archive_scripts/clear_all_tables.sql
\`\`\`

### Development Environment Only

Most of these scripts are intended for development or staging environments only. 
**DO NOT run these scripts in production without a full backup and explicit approval.**
