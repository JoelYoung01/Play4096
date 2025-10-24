CREATE TABLE `email_verification_request` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `password_reset_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `email` text;--> statement-breakpoint
ALTER TABLE `user` ADD `status` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `email_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);