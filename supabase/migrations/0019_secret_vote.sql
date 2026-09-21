ALTER TABLE events ADD COLUMN IF NOT EXISTS secret_vote boolean NOT NULL DEFAULT false;
