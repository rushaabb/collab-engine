# Mobile App Setup Instructions

## ✅ What's Been Built

A complete React Native + Expo mobile app with all MVP features:

### 1. Splash + Onboarding ✅
- Splash screen with automatic routing
- Platform selection (Instagram, YouTube, TikTok)
- Manual tags option (skip import)
- Collab goal selection
- Preferences (radius, niche, collab type)

### 2. Creator Profile ✅
- Photo upload functionality
- Niche/style tags
- Platform links with handles
- Follower bucket selection
- Reliability score display

### 3. Discovery ✅
- Recommended feed with rule-based ranking
- Collabs near you feed
- Tab navigation between feeds

### 4. Detailed Profile View ✅
- Engagement tier (Beginner/Rising/Pro/Elite)
- Growth trend display
- Consistency score
- Vibe match highlights
- "Let's Collab" CTA button

### 5. Chat ✅
- Text messaging
- Message templates (auto-generated)
- Quick link send functionality
- Real-time message updates

### 6. Collab Card ✅
- Objective field
- Deliverables list
- Who posts selection
- Deadline picker
- Confirm buttons (Accept/Complete/Cancel)

### 7. Proof-of-Collab ✅
- Link submission form
- Basic timestamp check (platform URL validation)
- Verification status

### 8. Reliability Score ✅
- Response time calculation
- Completion rate tracking
- Abandoned collaborations tracking
- Automatic score calculation

## 🚀 Next Steps

### 1. Configure Git (Required for Commit)
```bash
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

### 2. Commit and Push
```bash
git commit -m "Add complete React Native + Expo mobile app with all MVP features"
git push origin main
```

### 3. Set Up Supabase
1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `mobile/supabase-schema.sql` in your Supabase SQL editor
3. Create a `.env` file in the `mobile` directory:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 4. Install Dependencies
```bash
cd mobile
npm install
```

### 5. Start the App
```bash
npm start
```

## 📁 Project Structure

```
mobile/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── onboarding.tsx      # Multi-step onboarding
│   ├── splash.tsx         # Splash screen
│   └── ...                # Other screens
├── components/            # Reusable components
├── context/               # React context providers
├── hooks/                # Custom React hooks
├── lib/                   # Utilities and services
│   ├── supabase.ts       # Supabase client
│   └── reliability.ts    # Reliability score calculator
├── supabase-schema.sql   # Database schema
└── package.json          # Dependencies
```

## 🎨 Features Implemented

- ✅ Complete authentication flow
- ✅ Onboarding with platform selection
- ✅ Profile management with photo upload
- ✅ Discovery feed with ranking algorithm
- ✅ Detailed profile views with metrics
- ✅ Real-time chat with templates
- ✅ Collaboration card creation and management
- ✅ Proof submission system
- ✅ Reliability scoring system

## 📝 Notes

- The app uses Expo Router for file-based routing
- Supabase is used for backend (auth, database, real-time)
- All screens are built with TypeScript
- The reliability score is calculated based on:
  - Response time (< 24h = bonus)
  - Completion rate (80%+ = bonus)
  - Abandoned collabs (penalty)

## 🔧 Customization

You can customize:
- Colors in individual screen StyleSheets
- Platform options in onboarding
- Niche tags in profile screens
- Message templates in chat
- Reliability score calculation algorithm

