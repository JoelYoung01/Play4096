CREATE TABLE `oauth_account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`created_on` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_account_provider_uid` ON `oauth_account` (`provider`,`provider_user_id`);
--> statement-breakpoint
CREATE TABLE `apple_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`original_transaction_id` text NOT NULL,
	`product_id` text NOT NULL,
	`bundle_id` text,
	`environment` text,
	`purchased_at` integer NOT NULL,
	`created_on` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
