-- Persist move history on checkpoints so restore keeps the run replayable
-- (and eligible for permanent classic ranking after the game finishes).
ALTER TABLE `game_checkpoint` ADD `moves` text;
