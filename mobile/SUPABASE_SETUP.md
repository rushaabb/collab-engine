# Supabase Setup Guide

## Database Schema

The app uses a simplified schema with three main tables:

### 1. `users` Table
- `id` (UUID, Primary Key)
- `name` (TEXT)
- `niche_tags` (TEXT[])
- `follower_bucket` (TEXT)
- `style_tags` (TEXT[])
- `reliability_score` (INTEGER, default: 50)
- `completed_collabs` (INTEGER, default: 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2. `collabs` Table
- `id` (UUID, Primary Key)
- `creator1` (UUID, Foreign Key → users.id)
- `creator2` (UUID, Foreign Key → users.id, nullable)
- `card_data` (JSONB) - Stores flexible collab card information
- `status` (TEXT: 'pending', 'in_progress', 'completed', 'cancelled')
- `proof_link` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 3. `messages` Table
- `id` (UUID, Primary Key)
- `collabId` (UUID, Foreign Key → collabs.id)
- `sender` (UUID, Foreign Key → users.id)
- `text` (TEXT)
- `created_at` (TIMESTAMP)

## Setup Instructions

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Note your project URL and anon key

### Step 2: Run SQL Schema
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `mobile/supabase-schema.sql`
4. Run the SQL script

### Step 3: Configure Environment Variables
Create a `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Set Up Authentication (Optional)
If you want to use Supabase Auth instead of the current auth system:

1. Enable Email Auth in Supabase Dashboard → Authentication → Providers
2. Update the auth context to use Supabase Auth

## Card Data Structure

The `card_data` JSONB field in the `collabs` table can store:

```json
{
  "title": "Collaboration Title",
  "objective": "What we want to achieve",
  "description": "Detailed description",
  "deliverables": ["Deliverable 1", "Deliverable 2"],
  "required_skills": ["Skill 1", "Skill 2"],
  "tags": ["tag1", "tag2"],
  "collab_type": "Shoutout",
  "who_posts": "both",
  "deadline": "2024-12-31"
}
```

## Row Level Security (RLS)

The schema includes RLS policies:
- **Users**: Can view all profiles, insert/update their own
- **Collabs**: Can view all, create any, update if they're creator1 or creator2
- **Messages**: Can view/send messages only for collabs they're part of

## Helper Functions

The schema includes:
- `update_updated_at_column()` - Auto-updates `updated_at` timestamps
- `increment_completed_collabs(user_id)` - Increments completed collabs count

## Testing the Setup

After running the schema, test with:

```sql
-- Insert a test user
INSERT INTO users (name, niche_tags, style_tags) 
VALUES ('Test User', ARRAY['Tech', 'Art'], ARRAY['Minimalist']);

-- Insert a test collab
INSERT INTO collabs (creator1, card_data, status)
VALUES (
  (SELECT id FROM users LIMIT 1),
  '{"title": "Test Collab", "objective": "Test objective"}'::jsonb,
  'pending'
);
```

## Migration Notes

If you're migrating from the previous schema:
1. Export existing data
2. Transform data to match new schema
3. Import into new tables
4. Update application code to use new field names

