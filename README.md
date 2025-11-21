# collab-engine

An app that helps creators find collaborators.

## Overview

Collab Engine is a mobile application that connects content creators across platforms (Instagram, YouTube, TikTok) to facilitate collaborations. The app uses intelligent matching algorithms to help creators find the perfect collaboration partners based on niche, follower tier, activity, and reliability scores.

## Tech Stack

### Mobile App
- **Framework**: React Native 0.76.9 with Expo ~52.0.0
- **Language**: TypeScript 5.1.3
- **Runtime**: React 18.3.1
- **Navigation**: 
  - Expo Router ~4.0.0 (file-based routing)
  - React Navigation 7.x (native stack & bottom tabs)
- **UI Components**: 
  - React Native core components
  - Expo Vector Icons ~14.0.4
  - React Native Vector Icons 10.0.3
  - Expo Linear Gradient ~14.0.2
- **State Management**: React Context API
- **Storage**: 
  - AsyncStorage 1.23.1 (local storage)
  - Supabase Storage (cloud storage for images)
- **Image Handling**: Expo Image Picker ~16.0.6
- **Animations**: React Native Reanimated ~3.16.1
- **Gestures**: React Native Gesture Handler ~2.20.2
- **Linking**: Expo Linking ~7.0.5 (deep linking & URL handling)

### Backend & Database
- **Backend**: Supabase (Backend-as-a-Service)
- **Database**: PostgreSQL (via Supabase)
- **Client Library**: @supabase/supabase-js ^2.38.4
- **Authentication**: Supabase Auth (email/password)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (for profile images and media)

### Development Tools
- **Bundler**: Metro ^0.81.0
- **Build Tool**: Expo CLI
- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Code Transpilation**: Babel 7.23.0

## Basic Functionality

### 1. Authentication & Onboarding
- **User Authentication**: Secure sign up and login using Supabase Auth
- **Multi-step Onboarding Flow**:
  - **Platform Selection**: Choose primary content platforms (Instagram, YouTube, TikTok)
  - **Tag Management**: Manual tag input or skip platform import
  - **Collaboration Goals**: Define what type of collaborations you're seeking
  - **Preferences Setup**: Configure search radius, niche interests, and collaboration types
  - **Profile Initialization**: Set up initial profile with basic information

### 2. Creator Profiles
- **Profile Management**:
  - Profile photo upload with image picker
  - Niche and style tags for discoverability
  - Platform links with social media handles
  - Follower bucket selection (0-1k, 1k-10k, 10k-50k, 50k-100k, 100k+)
  - Bio and description fields
- **Metrics Display**:
  - Reliability score (0-100) prominently displayed
  - Engagement tier classification (Beginner/Rising/Pro/Elite)
  - Growth trends and consistency scores
  - Vibe match indicators

### 3. Discovery Feed
- **Recommended Feed**: 
  - Intelligent rule-based ranking algorithm that matches users with relevant collaborations
  - Scoring weights:
    - Tag overlap (40% weight) - matches based on shared interests
    - Follower tier compatibility (30% weight) - pairs creators with similar audience sizes
    - Recent activity (20% weight) - prioritizes active users
    - Reliability score (10% weight) - ensures quality connections
  - Swipeable card interface for easy browsing
- **Near You Feed**: 
  - Location-based collaboration discovery
  - Shows creators within specified radius
  - Geographic proximity matching
- **Profile Views**: 
  - Detailed creator profiles with comprehensive metrics
  - Growth trend visualization
  - Consistency score display
  - Vibe match highlights
  - Direct collaboration initiation

### 4. Collaboration Management
- **Create Collaboration Posts**:
  - Title and objective description
  - Deliverables list (checklist format)
  - Required skills and expertise
  - Collaboration type selection (Shoutout, Content Swap, Joint Project, Brand Partnership, etc.)
  - Posting responsibility (creator posts, collaborator posts, or both)
  - Deadline selection with date picker
  - Flexible JSONB card data structure
- **Collaboration Lifecycle**:
  - Status tracking: `pending`, `in_progress`, `completed`, `cancelled`
  - Accept/Decline collaboration requests
  - Mark collaborations as complete
  - Cancel ongoing collaborations
  - View collaboration history

### 5. Real-time Chat
- **Messaging Features**:
  - Text messaging between collaborators
  - Real-time message updates via Supabase Realtime subscriptions
  - Message history persistence
  - Read receipts and delivery status
- **Productivity Tools**:
  - Auto-generated message templates for common scenarios
  - Quick link sharing functionality
  - Thread-based conversation organization
  - Chat notifications

### 6. Proof-of-Collaboration
- **Submission System**:
  - Link submission for completed collaborations
  - Support for multiple platform URLs (Instagram, YouTube, TikTok)
  - Basic timestamp validation
  - URL format verification
- **Verification**:
  - Verification status tracking (pending, verified, rejected)
  - Proof history per collaboration
  - Integration with reliability scoring

### 7. Reliability Scoring System
- **Automatic Calculation**:
  - **Response Time**: Bonus points for responding to messages within 24 hours
  - **Completion Rate**: Bonus for maintaining 80%+ collaboration completion rate
  - **Abandoned Collaborations**: Penalty for cancelling or abandoning active collaborations
  - **Weighted Formula**: Combines multiple factors for fair scoring
- **Score Range**: 0-100 scale
- **Impact**: 
  - Used in matching algorithm to prioritize reliable creators
  - Displayed on profiles to build trust
  - Influences feed ranking and recommendations

## Project Structure

```
collab-engine/
├── mobile/              # React Native + Expo mobile app
│   ├── app/            # Expo Router app directory
│   │   ├── (auth)/     # Authentication screens
│   │   ├── (tabs)/     # Main tab navigation
│   │   └── ...         # Other screens
│   ├── components/     # Reusable components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and services
│   │   ├── supabase.ts        # Supabase client
│   │   ├── ranking.ts         # Matching algorithm
│   │   └── reliability.ts     # Reliability calculator
│   └── supabase-schema.sql    # Database schema
├── backend/            # (Future: Express API)
└── frontend/           # (Future: Next.js web app)
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account

### Setup Instructions

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure Supabase:**
   - Create a Supabase project at https://supabase.com
   - Run the SQL schema from `mobile/supabase-schema.sql` in your Supabase SQL editor
   - Create a `.env` file in the `mobile` directory:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Start the app:**
   ```bash
   npm start
   ```

For detailed setup instructions, see `mobile/SETUP.md` and `mobile/SUPABASE_SETUP.md`.

## Database Schema

The app uses the following main tables:
- `profiles` - User profiles with tags, follower buckets, and reliability scores
- `collabs` - Collaboration posts with flexible JSONB card data
- `messages` - Chat messages between collaborators
- `proofs` - Proof of collaboration submissions

See `mobile/supabase-schema.sql` for the complete schema.

## Features Status

✅ Complete authentication flow  
✅ Onboarding with platform selection  
✅ Profile management with photo upload  
✅ Discovery feed with intelligent ranking algorithm  
✅ Detailed profile views with metrics  
✅ Real-time chat with templates  
✅ Collaboration card creation and management  
✅ Proof submission system  
✅ Reliability scoring system
