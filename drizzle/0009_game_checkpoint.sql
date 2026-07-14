CREATE TABLE `game_checkpoint` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`game_id` text NOT NULL,
	`created_on` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`board` text NOT NULL,
	`score` integer NOT NULL,
	`seed` integer,
	`rng_state` integer,
	`move_count` integer DEFAULT 0 NOT NULL,
	`undo_cooldown_remaining` integer DEFAULT 0 NOT NULL,
	`won` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
