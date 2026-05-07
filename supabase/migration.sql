-- ============================================================
-- Checklist App — Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Checklists table
CREATE TABLE IF NOT EXISTS checklists (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  prompt     TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own checklists"
  ON checklists FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Checklist items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID        NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text         TEXT        NOT NULL,
  category     TEXT,
  checked      BOOLEAN     NOT NULL DEFAULT FALSE,
  position     INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own checklist items"
  ON checklist_items FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklists_user_id
  ON checklists(user_id);

CREATE INDEX IF NOT EXISTS idx_checklists_user_created
  ON checklists(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id
  ON checklist_items(checklist_id);

CREATE INDEX IF NOT EXISTS idx_checklist_items_user_id
  ON checklist_items(user_id);

CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_position
  ON checklist_items(checklist_id, position);
