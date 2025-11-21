# Quick Start Guide - Supabase Setup

## 1. Create Supabase Project
1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in project details and wait for setup to complete
4. Go to Settings → API to get your credentials

## 2. Run the Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `mobile/supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)

## 3. Set Environment Variables
Create a `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: 
- Get these values from Supabase Dashboard → Settings → API
- Never commit `.env` to git (it's already in `.gitignore`)

## 4. Verify Setup
Run this in Supabase SQL Editor to test:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'collabs', 'messages');
```

You should see all three tables listed.

## 5. Test Data Insert
```sql
-- Insert a test user
INSERT INTO users (name, niche_tags, style_tags, follower_bucket)
VALUES ('Test User', ARRAY['Tech', 'Art'], ARRAY['Minimalist'], '1k-10k');

-- Verify it was created
SELECT * FROM users;
```

## Schema Overview

### `users` Table
Stores user profiles with:
- Basic info (name, follower_bucket)
- Tags (niche_tags, style_tags)
- Stats (reliability_score, completed_collabs)

### `collabs` Table
Stores collaborations with:
- Two creators (creator1, creator2)
- Flexible card data (JSONB)
- Status and proof link

### `messages` Table
Stores chat messages linked to collabs

## Next Steps
1. Install dependencies: `cd mobile && npm install`
2. Start the app: `npm start`
3. The app will automatically use your Supabase project

## Troubleshooting

**"relation does not exist" error:**
- Make sure you ran the SQL schema in the correct project
- Check that you're in the SQL Editor, not the Table Editor

**"permission denied" error:**
- Check RLS policies are enabled
- Verify your anon key is correct

**Connection issues:**
- Verify your Supabase URL and key are correct
- Check that your project is active (not paused)

