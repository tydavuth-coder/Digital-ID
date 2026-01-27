CREATE TABLE `reportSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`reportType` enum('monthly','quarterly','weekly','custom') NOT NULL,
	`frequency` enum('daily','weekly','monthly','quarterly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`timeOfDay` varchar(5) DEFAULT '09:00',
	`recipientEmails` text NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`lastStatus` enum('success','failed','pending') DEFAULT 'pending',
	`lastError` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reportSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `smtpHost` varchar(255);--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `smtpPort` int DEFAULT 587;--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `smtpSecure` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `smtpUsername` varchar(255);--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `smtpPassword` text;--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `smtpFromEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `smtpFromName` varchar(255);--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `smtpEnabled` boolean DEFAULT false;