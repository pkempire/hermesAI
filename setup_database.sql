-- HermesAI Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Create chats table for storing conversations
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    path TEXT NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create campaigns table for cold email campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    prospect_query JSONB NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'person' CHECK (entity_type IN ('company', 'person', 'mixed')),
    target_count INTEGER DEFAULT 10,
    email_sequence JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    total_prospects INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create prospects table for storing found prospects
CREATE TABLE IF NOT EXISTS prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    exa_item_id TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    company TEXT,
    job_title TEXT,
    linkedin_url TEXT,
    website TEXT,
    location TEXT,
    industry TEXT,
    enrichments JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'replied', 'interested', 'not_interested', 'bounced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Users can manage their own chats" ON chats FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own campaigns" ON campaigns FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view prospects in their campaigns" ON prospects FOR ALL USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = prospects.campaign_id AND campaigns.user_id = auth.uid())
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_campaign_id ON prospects(campaign_id);

-- Done! Your HermesAI database is ready. 