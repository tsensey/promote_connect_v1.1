-- Add category to support tickets

ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Add an index on category to improve filtering performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
