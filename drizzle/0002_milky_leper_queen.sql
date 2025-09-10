CREATE TABLE `game` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`created_on` integer NOT NULL,
	`completed_on` integer,
	`score` integer,
	`won` integer NOT NULL,
	`complete` integer NOT NULL,
	`board_json` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text,
	`avatar_url` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `age`;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `display_name`;