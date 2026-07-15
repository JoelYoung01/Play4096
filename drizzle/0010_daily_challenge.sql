CREATE TABLE `daily_challenge` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_date` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`difficulty` text NOT NULL,
	`params` text NOT NULL,
	`created_on` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_challenge_date_uidx` ON `daily_challenge` (`challenge_date`);
