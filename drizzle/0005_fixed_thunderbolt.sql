ALTER TABLE `game` ADD `seed` integer;--> statement-breakpoint
ALTER TABLE `game` ADD `rng_state` integer;--> statement-breakpoint
ALTER TABLE `game` ADD `move_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `game` ADD `undo_cooldown_remaining` integer DEFAULT 0 NOT NULL;