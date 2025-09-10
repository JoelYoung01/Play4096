PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text,
	`avatar_url` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_profile`("id", "user_id", "display_name", "avatar_url") SELECT "id", "user_id", "display_name", "avatar_url" FROM `user_profile`;--> statement-breakpoint
DROP TABLE `user_profile`;--> statement-breakpoint
ALTER TABLE `__new_user_profile` RENAME TO `user_profile`;--> statement-breakpoint
PRAGMA foreign_keys=ON;