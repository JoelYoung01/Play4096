-- Promote abandoned in-progress rows into history, keeping only the latest
-- incomplete game per player as the current run. Fixes games that were won
-- (or otherwise left incomplete) then overwritten via New Game before the
-- client finalized them.
UPDATE game
SET
	complete = 1,
	completed_on = COALESCE(completed_on, updated_on)
WHERE complete = 0
	AND id NOT IN (
		SELECT id FROM (
			SELECT
				id,
				ROW_NUMBER() OVER (
					PARTITION BY player_id
					ORDER BY updated_on DESC
				) AS rn
			FROM game
			WHERE complete = 0
		) AS ranked
		WHERE rn = 1
	);
