CREATE TABLE `activeSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`deviceInfo` text,
	`ipAddress` varchar(45),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activeSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `activeSessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`username` varchar(64),
	`action` varchar(255) NOT NULL,
	`actionType` enum('login','logout','kyc_submit','kyc_approve','kyc_reject','service_connect','service_disconnect','qr_scan','profile_update','admin_action','other') NOT NULL,
	`description` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kycDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nidFrontUrl` text NOT NULL,
	`nidBackUrl` text NOT NULL,
	`selfieUrl` text NOT NULL,
	`verificationStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kycDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`titleKhmer` text,
	`titleEnglish` text,
	`message` text NOT NULL,
	`messageKhmer` text,
	`messageEnglish` text,
	`type` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qrAuthTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serviceId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`isUsed` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` timestamp,
	CONSTRAINT `qrAuthTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `qrAuthTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`nameKhmer` text,
	`nameEnglish` text,
	`description` text,
	`logoUrl` text,
	`token` varchar(255) NOT NULL,
	`secret` varchar(255) NOT NULL,
	`callbackUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`),
	CONSTRAINT `services_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`maintenanceMode` boolean NOT NULL DEFAULT false,
	`allowKycUserCreation` boolean NOT NULL DEFAULT true,
	`telegramBotToken` text,
	`telegramBotId` varchar(64),
	`smsProvider` varchar(64),
	`smsApiKey` text,
	`smsApiSecret` text,
	`smsSenderId` varchar(64),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userServices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serviceId` int NOT NULL,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	CONSTRAINT `userServices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `nameKhmer` text;--> statement-breakpoint
ALTER TABLE `users` ADD `nameEnglish` text;--> statement-breakpoint
ALTER TABLE `users` ADD `nationalId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female','other');--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `photoUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','pending','blocked') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `kycStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `pin` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `biometricEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `telegramChatId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `digitalIdVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `idExpiryDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_nationalId_unique` UNIQUE(`nationalId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);