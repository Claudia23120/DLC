-- Add repte_count to track how many matching bolos each member has attended
ALTER TABLE member_badges ADD COLUMN IF NOT EXISTS repte_count integer;

-- Update award_repte_badges: award as soon as count >= 1 and keep count up to date
CREATE OR REPLACE FUNCTION public.award_repte_badges(p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r          record;
  v_attended int;
BEGIN
  FOR r IN
    SELECT id, repte_pattern
    FROM badge_definitions
    WHERE type = 'repte'
      AND repte_pattern IS NOT NULL
  LOOP
    SELECT count(*) INTO v_attended
    FROM bolo_attendance ba
    JOIN events e ON e.id = ba.event_id
    WHERE ba.member_id = p_member_id
      AND ba.response <> 'no'
      AND e.kind = 'bolo'
      AND lower(e.title) LIKE '%' || lower(r.repte_pattern) || '%';

    IF v_attended > 0 THEN
      INSERT INTO member_badges (member_id, badge_id, repte_count)
      VALUES (p_member_id, r.id, v_attended)
      ON CONFLICT (member_id, badge_id) DO UPDATE SET repte_count = excluded.repte_count;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.award_repte_badges(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.award_repte_badges(uuid) TO authenticated;
