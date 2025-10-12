-- Template Marketplace Database Schema
-- Simple template saving and sharing system

CREATE TABLE IF NOT EXISTS prospect_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  message TEXT NOT NULL, -- The template message with placeholders
  category VARCHAR(100), -- e.g., "Partnership", "Sales", "Recruiting"
  params JSONB, -- Array of parameter definitions

  -- Usage stats (fake social proof for now)
  save_count INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,

  -- Creator info
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Visibility
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Tags for categorization
  tags TEXT[] DEFAULT '{}'
);

-- User saved templates (many-to-many)
CREATE TABLE IF NOT EXISTS user_saved_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES prospect_templates(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, template_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_public ON prospect_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_templates_featured ON prospect_templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_templates_category ON prospect_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_use_count ON prospect_templates(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_saved_templates_user ON user_saved_templates(user_id);

-- Helper functions for incrementing/decrementing counters
CREATE OR REPLACE FUNCTION increment_template_saves(template_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE prospect_templates
  SET save_count = save_count + 1
  WHERE id = template_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_template_saves(template_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE prospect_templates
  SET save_count = GREATEST(save_count - 1, 0)
  WHERE id = template_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_template_uses(template_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE prospect_templates
  SET use_count = use_count + 1
  WHERE id = template_id;
END;
$$;

-- Insert some featured templates with fake social proof
INSERT INTO prospect_templates (
  name, description, message, category, params,
  save_count, use_count, is_public, is_featured, tags
) VALUES
(
  'Partnership Finder',
  'Find potential channel partners and directories for your business',
  'Use my website {{url}} to infer our ICP/offer and find channel partners and directories that could list us. Start with top 20 high-fit partners and pull contacts to reach out.',
  'Partnerships',
  '[{"key": "url", "label": "Business URL", "placeholder": "https://your-company.com"}]'::jsonb,
  1247, 3891, true, true,
  ARRAY['partnerships', 'business development', 'channels']
),
(
  'Localized Outreach',
  'Target companies in specific geographic locations',
  'Find {{niche}} companies in {{city}}. Start with 25 and enrich email + LinkedIn.',
  'Sales',
  '[{"key": "niche", "label": "Niche", "placeholder": "real estate brokerages"}, {"key": "city", "label": "City/Region", "placeholder": "Miami, FL"}]'::jsonb,
  987, 2456, true, true,
  ARRAY['local', 'geographic', 'sales']
),
(
  'Tech Recruiting',
  'Find decision-makers for technical recruitment',
  'Find {{role}} at {{company_type}} companies in {{location}} who recently posted about {{topic}} on LinkedIn. Pitch {{your_offer}}.',
  'Recruiting',
  '[{"key": "role", "label": "Role", "placeholder": "VP of Engineering"}, {"key": "company_type", "label": "Company Type", "placeholder": "Series A-B SaaS"}, {"key": "location", "label": "Location", "placeholder": "San Francisco"}, {"key": "topic", "label": "Topic", "placeholder": "hiring challenges"}, {"key": "your_offer", "label": "Your Offer", "placeholder": "AI developer assessment platform"}]'::jsonb,
  756, 1923, true, true,
  ARRAY['recruiting', 'technical', 'hiring']
),
(
  'SaaS Sales',
  'Target companies using specific technology stacks',
  'Find {{role}} at companies using {{tech_stack}} who mentioned {{pain_point}}. Pitch {{solution}}.',
  'Sales',
  '[{"key": "role", "label": "Role", "placeholder": "CTO"}, {"key": "tech_stack", "label": "Tech Stack", "placeholder": "Postgres + Kubernetes"}, {"key": "pain_point", "label": "Pain Point", "placeholder": "database performance issues"}, {"key": "solution", "label": "Your Solution", "placeholder": "automated query optimization tool"}]'::jsonb,
  642, 1567, true, true,
  ARRAY['saas', 'technical sales', 'B2B']
),
(
  'Event Follow-up',
  'Connect with event speakers and sponsors',
  'From {{event}} speakers and sponsors in {{topic}} track, find contacts and draft tailored follow-ups.',
  'Networking',
  '[{"key": "event", "label": "Event Name", "placeholder": "SaaStr Annual 2025"}, {"key": "topic", "label": "Topic/Track", "placeholder": "AI & Automation"}]'::jsonb,
  423, 891, true, true,
  ARRAY['events', 'networking', 'follow-up']
),
(
  'Competitor Research',
  'Find prospects mentioning competitors',
  'Find companies mentioning {{competitor}} on LinkedIn or Twitter who fit {{icp}}. Draft switch pitch emphasizing {{differentiator}}.',
  'Sales',
  '[{"key": "competitor", "label": "Competitor", "placeholder": "HubSpot"}, {"key": "icp", "label": "Target Profile", "placeholder": "B2B SaaS companies 10-50 employees"}, {"key": "differentiator", "label": "Your Edge", "placeholder": "better pricing and native AI features"}]'::jsonb,
  334, 723, true, false,
  ARRAY['competitive', 'research', 'positioning']
);