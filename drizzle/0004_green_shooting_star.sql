ALTER TABLE `game` RENAME COLUMN "board_json" TO "board";--> statement-breakpoint
ALTER TABLE `game` ADD `updated_on` integer NOT NULL;