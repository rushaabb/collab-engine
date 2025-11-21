-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  niche_tags TEXT[] DEFAULT '{}',
  follower_bucket TEXT,
  style_tags TEXT[] DEFAULT '{}',
  reliability_score INTEGER DEFAULT 50,
  completed_collabs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collabs table
CREATE TABLE collabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator1 UUID REFERENCES users(id) ON DELETE CASCADE,
  creator2 UUID REFERENCES users(id) ON DELETE SET NULL,
  card_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  proof_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collabId UUID REFERENCES collabs(id) ON DELETE CASCADE,
  sender UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_collabs_creator1 ON collabs(creator1);
CREATE INDEX idx_collabs_creator2 ON collabs(creator2);
CREATE INDEX idx_collabs_status ON collabs(status);
CREATE INDEX idx_messages_collabId ON messages(collabId);
CREATE INDEX idx_messages_sender ON messages(sender);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collabs_updated_at BEFORE UPDATE ON collabs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment completed_collabs
CREATE OR REPLACE FUNCTION increment_completed_collabs(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET completed_collabs = completed_collabs + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);

-- Collabs policies
CREATE POLICY "Users can view all collabs" ON collabs FOR SELECT USING (true);
CREATE POLICY "Users can create collabs" ON collabs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update collabs they're part of" ON collabs FOR UPDATE 
  USING (auth.uid()::text = creator1::text OR auth.uid()::text = creator2::text);

-- Messages policies
CREATE POLICY "Users can view messages in their collabs" ON messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM collabs 
      WHERE collabs.id = messages."collabId" 
      AND (collabs.creator1::text = auth.uid()::text OR collabs.creator2::text = auth.uid()::text)
    )
  );
CREATE POLICY "Users can send messages" ON messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collabs 
      WHERE collabs.id = messages."collabId" 
      AND (collabs.creator1::text = auth.uid()::text OR collabs.creator2::text = auth.uid()::text)
    )
  );

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
