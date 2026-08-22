CREATE TABLE `refresh_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `refresh_token_user_id_idx` ON `refresh_token` (`user_id`);
--> statement-breakpoint
CREATE INDEX `refresh_token_session_id_idx` ON `refresh_token` (`session_id`);
