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

-- 6. Create Gmail credentials table for OAuth tokens
CREATE TABLE IF NOT EXISTS gmail_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create email tracking table
CREATE TABLE IF NOT EXISTS email_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
    gmail_message_id TEXT,
    subject TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed'))
);

-- 8. Enable RLS on new tables
ALTER TABLE gmail_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies for new tables
CREATE POLICY "Users can manage their own Gmail credentials" ON gmail_credentials FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view email tracking for their campaigns" ON email_tracking FOR ALL USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = email_tracking.campaign_id AND campaigns.user_id = auth.uid())
);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_campaign_id ON prospects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_gmail_credentials_user_id ON gmail_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_campaign_id ON email_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_prospect_id ON email_tracking(prospect_id);

-- Done! Your HermesAI database is ready with Gmail integration. 