-- Allow polls to support multiple votes per member.

-- Flag on the event to enable multi-select voting.
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_multiple_votes boolean NOT NULL DEFAULT false;

-- Change the primary key so a member can vote for more than one option.
ALTER TABLE poll_votes DROP CONSTRAINT poll_votes_pkey;
ALTER TABLE poll_votes ADD PRIMARY KEY (event_id, member_id, option_id);

-- Members need to delete their own votes (changing / toggling a vote).
DROP POLICY IF EXISTS poll_votes_delete_self ON poll_votes;
CREATE POLICY poll_votes_delete_self ON poll_votes
  FOR DELETE USING (auth.uid() = member_id);
