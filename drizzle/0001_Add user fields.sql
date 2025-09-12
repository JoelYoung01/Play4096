ALTER TABLE `user` ADD `admin` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `level` integer DEFAULT 10 NOT NULL;