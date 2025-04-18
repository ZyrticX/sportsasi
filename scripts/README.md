# Essential Database Scripts

This directory contains the essential SQL scripts for the Fantasy Prediction application:

## Table Creation Scripts
- `create_tables.sql` - Creates all main application tables
- `create_weekly_games_table.sql` - Creates the weekly_games table
- `create_settings_table.sql` - Creates the application settings table
- `create_point_history_table.sql` - Creates the point history tracking table

## RPC Functions
- `create_game_rpc.sql` - Game management functions
- `create_rpc_function.sql` - General RPC utility functions
- `create_update_game_result_function.sql` - Game result management
- `create_settings_functions.sql` - System settings functions
- `create_check_table_exists.sql` - Utility to check if tables exist

## Database Initialization
- `create_tables_and_functions.sql` - Combined script to initialize the database

## Prerequisites
- psql (PostgreSQL client) installed
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local` or environment

## Applying the Scripts Manually

1. **Create Tables**  
   \`\`\`bash
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_tables.sql
   \`\`\`

2. **Create weekly_games table**
   \`\`\`bash
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_weekly_games_table.sql
   \`\`\`

3. **Create Settings & Point History**
   \`\`\`bash
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_settings_table.sql
   
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_point_history_table.sql
   \`\`\`

4. **RPC Functions**
   \`\`\`bash
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_rpc_function.sql
   
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_game_rpc.sql
   
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_update_game_result_function.sql
   
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_settings_functions.sql
   
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_check_table_exists.sql
   \`\`\`

5. **Full Initialization (optional)**
   If you want to run everything in one go:
   \`\`\`bash
   psql \
     -h $SUPABASE_URL \
     -U postgres \
     -d postgres \
     -f scripts/create_tables_and_functions.sql
   \`\`\`

## Seeding Initial Data

\`\`\`bash
npm run seed
# or
node scripts/seed-database.js
\`\`\`

## CI/CD Integration

Here's a sample GitHub Actions job to run the scripts automatically:

\`\`\`yaml
name: DB Init

on: [push]

jobs:
  init-db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup psql
        run: sudo apt-get install -y postgresql-client
      - name: Apply DB scripts
        run: |
          for f in scripts/*.sql; do
            psql -h ${{ secrets.SUPABASE_URL }} \
                 -U ${{ secrets.SUPABASE_DB_USER }} \
                 -d ${{ secrets.SUPABASE_DB_NAME }} \
                 -f "$f"
          done
