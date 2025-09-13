CREATE TABLE `stripe_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_on` integer NOT NULL,
	`updated_on` integer NOT NULL,
	`status` text NOT NULL,
	`metadata` text NOT NULL,
	`session_json` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
