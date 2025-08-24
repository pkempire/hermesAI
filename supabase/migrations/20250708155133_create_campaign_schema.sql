-- HermesAI Database Schema Migration
-- This creates the core tables for the cold email prospecting platform

-- Table for storing campaign information
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    
    -- Prospect search criteria
    prospect_query JSONB NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'company' CHECK (entity_type IN ('company', 'person', 'mixed')),
    enrichments JSONB DEFAULT '[]'::jsonb,
    filters JSONB DEFAULT '{}'::jsonb,
    target_count INTEGER DEFAULT 100,
    
    -- Email sequence configuration
    email_sequence JSONB DEFAULT '[]'::jsonb,
    
    -- Campaign settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Analytics and tracking
    total_prospects INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    meetings_booked INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing prospect information
CREATE TABLE prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Basic prospect info
    exa_item_id TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    company TEXT,
    job_title TEXT,
    linkedin_url TEXT,
    phone TEXT,
    website TEXT,
    
    -- Location information
    location TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    
    -- Additional profile data
    bio TEXT,
    industry TEXT,
    company_size TEXT,
    revenue_range TEXT,
    technologies JSONB DEFAULT '[]'::jsonb,
    
    -- Contact enrichment
    enrichments JSONB DEFAULT '{}'::jsonb,
    
    -- Campaign status
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'replied', 'interested', 'not_interested', 'bounced')),
    
    -- Email tracking
    emails_sent INTEGER DEFAULT 0,
    last_contacted TIMESTAMP WITH TIME ZONE,
    last_replied TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing individual emails in sequences
CREATE TABLE draft_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
    
    -- Email content
    sequence_id TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    email_type TEXT NOT NULL DEFAULT 'initial' CHECK (email_type IN ('initial', 'follow_up', 'final')),
    
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    personalization_notes TEXT,
    
    -- Scheduling
    scheduled_date TIMESTAMP WITH TIME ZONE,
    delay_days INTEGER DEFAULT 0,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'cancelled')),
    
    -- Email tracking data
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    
    -- External tracking IDs
    email_provider_id TEXT,
    tracking_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing user tokens and integrations
CREATE TABLE user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- API tokens
    exa_api_key TEXT,
    openai_api_key TEXT,
    
    -- Email provider tokens
    gmail_access_token TEXT,
    gmail_refresh_token TEXT,
    gmail_token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Other integrations
    linkedin_token TEXT,
    salesforce_token TEXT,
    hubspot_token TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing email analytics and performance
CREATE TABLE email_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_email_id UUID REFERENCES draft_emails(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
    
    -- Event tracking
    event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed')),
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional data
    user_agent TEXT,
    ip_address INET,
    location_data JSONB,
    click_url TEXT,
    
    -- Email client info
    email_client TEXT,
    device_type TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing email templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    
    -- Template content
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Personalization variables
    variables JSONB DEFAULT '[]'::jsonb,
    
    -- Usage stats
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Template settings
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing webhook events
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_type TEXT NOT NULL,
    provider TEXT NOT NULL, -- gmail, sendgrid, etc.
    external_id TEXT, -- provider's event ID
    
    -- Related entities
    draft_email_id UUID REFERENCES draft_emails(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    
    -- Event data
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing chat conversations
CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    path TEXT NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_prospects_campaign_id ON prospects(campaign_id);
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_draft_emails_campaign_id ON draft_emails(campaign_id);
CREATE INDEX idx_draft_emails_prospect_id ON draft_emails(prospect_id);
CREATE INDEX idx_draft_emails_status ON draft_emails(status);
CREATE INDEX idx_draft_emails_scheduled_date ON draft_emails(scheduled_date);
CREATE INDEX idx_email_analytics_draft_email_id ON email_analytics(draft_email_id);
CREATE INDEX idx_email_analytics_event_type ON email_analytics(event_type);
CREATE INDEX idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_external_id ON webhook_events(external_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at);

-- Row Level Security (RLS) policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Users can view their own campaigns" ON campaigns FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own campaigns" ON campaigns FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own campaigns" ON campaigns FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own campaigns" ON campaigns FOR DELETE USING (user_id = auth.uid());

-- Prospects policies
CREATE POLICY "Users can view prospects in their campaigns" ON prospects FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = prospects.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can create prospects in their campaigns" ON prospects FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = prospects.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can update prospects in their campaigns" ON prospects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = prospects.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can delete prospects in their campaigns" ON prospects FOR DELETE USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = prospects.campaign_id AND campaigns.user_id = auth.uid())
);

-- Draft emails policies
CREATE POLICY "Users can view draft emails in their campaigns" ON draft_emails FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = draft_emails.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can create draft emails in their campaigns" ON draft_emails FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = draft_emails.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can update draft emails in their campaigns" ON draft_emails FOR UPDATE USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = draft_emails.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can delete draft emails in their campaigns" ON draft_emails FOR DELETE USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = draft_emails.campaign_id AND campaigns.user_id = auth.uid())
);

-- User tokens policies
CREATE POLICY "Users can view their own tokens" ON user_tokens FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own tokens" ON user_tokens FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own tokens" ON user_tokens FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own tokens" ON user_tokens FOR DELETE USING (user_id = auth.uid());

-- Email analytics policies
CREATE POLICY "Users can view analytics for their campaigns" ON email_analytics FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = email_analytics.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "System can create analytics entries" ON email_analytics FOR INSERT WITH CHECK (true);

-- Email templates policies
CREATE POLICY "Users can view their own templates" ON email_templates FOR SELECT USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "Users can create their own templates" ON email_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own templates" ON email_templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own templates" ON email_templates FOR DELETE USING (user_id = auth.uid());

-- Webhook events policies
CREATE POLICY "System can manage webhook events" ON webhook_events FOR ALL WITH CHECK (true);

-- Chats policies
CREATE POLICY "Users can view their own chats" ON chats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own chats" ON chats FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own chats" ON chats FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own chats" ON chats FOR DELETE USING (user_id = auth.uid());

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_draft_emails_updated_at BEFORE UPDATE ON draft_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
