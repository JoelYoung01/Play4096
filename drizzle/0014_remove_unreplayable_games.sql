-- Delete completed classic games that cannot be deterministically replayed
-- (missing seed, null/empty moves, or moves length ≠ move_count). These include
-- legacy saves, cheat/transform-invalidated runs, checkpoint restores, and
-- potentially fabricated scores that never recorded a move history.
--
-- In-progress games are left alone (e.g. an active post-checkpoint run still
-- has moves=null until it finishes). Checkpoints cascade-delete with their game.
DELETE FROM `game`
WHERE `complete` = 1
	AND (
		`seed` IS NULL
		OR `moves` IS NULL
		OR json_array_length(`moves`) IS NULL
		OR json_array_length(`moves`) = 0
		OR json_array_length(`moves`) != `move_count`
	);
--> statement-breakpoint
-- Recompute personal best cache from remaining replayable completed games.
UPDATE `user_profile`
SET `best_score` = (
	SELECT MAX(`g`.`score`)
	FROM `game` AS `g`
	WHERE `g`.`player_id` = `user_profile`.`user_id`
		AND `g`.`complete` = 1
		AND `g`.`score` IS NOT NULL
		AND `g`.`seed` IS NOT NULL
		AND `g`.`moves` IS NOT NULL
		AND json_array_length(`g`.`moves`) > 0
		AND json_array_length(`g`.`moves`) = `g`.`move_count`
);
