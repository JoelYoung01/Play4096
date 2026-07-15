-- Remove legacy clear-board challenges (and their runs). Affected days will be
-- regenerated as time or recovery challenges on next visit.
DELETE FROM `challenge_run`
WHERE `challenge_id` IN (
	SELECT `id` FROM `daily_challenge` WHERE `type` = 'clear'
);
--> statement-breakpoint
DELETE FROM `daily_challenge` WHERE `type` = 'clear';
