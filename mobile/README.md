# Collab Engine Mobile App

A React Native + Expo mobile app for creators to find and collaborate with each other.

## Features

### 1. Splash + Onboarding
- Platform selection (Instagram, YouTube, TikTok)
- Manual tags if skipping import
- Collab goal selection
- Preferences (radius, niche, collab type)

### 2. Creator Profile
- Photo upload
- Niche/style tags
- Platform links
- Follower bucket
- Reliability score

### 3. Discovery
- Recommended feed with rule-based ranking
- Collabs near you feed

### 4. Detailed Profile View
- Engagement tier
- Growth trend
- Consistency score
- Vibe match highlights
- CTA: Let's Collab

### 5. Chat
- Text messaging
- Templates (auto-generated)
- Quick link send

### 6. Collab Card
- Objective
- Deliverables
- Who posts
- Deadline
- Confirm buttons

### 7. Proof-of-Collab
- Link submission
- Timestamp check (basic)

### 8. Reliability Score
- Response time
- Completion rate
- Abandoned collaborations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Supabase:
   - Create a `.env` file in the `mobile` directory
   - Add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Start the app:
```bash
npm start
```

## Database Schema

The app requires the following Supabase tables:

- `profiles` - User profiles
- `collabs` - Collaboration posts
- `messages` - Chat messages
- `proofs` - Proof of collaboration submissions

See `supabase-schema.sql` for the complete schema.

## Tech Stack

- React Native
- Expo
- TypeScript
- Supabase (Backend)
- React Navigation
- Expo Router

