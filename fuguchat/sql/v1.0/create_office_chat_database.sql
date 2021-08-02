CREATE TABLE `office_chat_test`.`users` ( `id` int(11)  not null AUTO_INCREMENT ,`user_id` VARCHAR(255) NOT NULL COMMENT 'varchar because of security reasons' , `business_id` INT(11) NOT NULL , `full_name` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `email` VARCHAR(80) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `password` VARCHAR(255) NOT NULL , `user_image` VARCHAR(255) NOT NULL , `access_token` varchar(255) Null , `status` ENUM("ENABLED","DISABLED") NOT NULL DEFAULT 'ENABLED', `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`id`),UNIQUE KEY `business_id` (`business_id`,`email`),UNIQUE KEY `user_id` (`user_id`),UNIQUE KEY `access_token` (`access_token`),KEY `accessTokenIndex` (`access_token`), KEY `userIdIndex` (`user_id`(10)));


CREATE TABLE `office_chat_test`.`business_details` ( `business_id` int(11) NOT NULL AUTO_INCREMENT,`email` VARCHAR(80) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,`business_name` varchar(255) NOT NULL, `domain` varchar(255) NOT NULL, `status` ENUM("ENABLED","DISABLED") NOT NULL DEFAULT 'ENABLED', `fugu_secret_key` varchar(255) NOT NULL UNIQUE KEY, `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , `updated_at` TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL, PRIMARY KEY (`business_id`),UNIQUE KEY `business_name` (`business_name`,`email`,`domain`),KEY `domainIndex` (`domain`(100)));

create table `office_chat_test`.`business_signup_requests` ( `id` int(11) AUTO_INCREMENT NOT NULL,`business_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,`domain` varchar(255) NOT NULL,`email` VARCHAR(80) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, `otp` int(11) NOT NULL, `is_validated` ENUM("YES","NO") NOT NULL DEFAULT 'NO', `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , `updated_at` TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL, UNIQUE KEY(`domain`,`email`), PRIMARY key(`id`));


create table `office_chat_test`.`user_invitations` (`id` int(11) AUTO_INCREMENT NOT NULL, `business_id` int(11) NOT NULL, `email` VARCHAR(80) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, `invitation_token` varchar(255) NOT NULL, `expired` ENUM("YES","NO") NOT NULL DEFAULT 'NO',  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , `updated_at` TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL,PRIMARY KEY(`id`), UNIQUE KEY(`business_id`,`email`), KEY `emailIndex` (`email`(50)), key `tokenIndex`(`invitation_token`(255)));


CREATE TABLE `user_devices` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `business_id` int(11) NOT NULL,
 `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
 `token` varchar(255) COLLATE utf8mb4_bin NOT NULL,
 `device_type` enum('ANDROID','IOS','WEB') COLLATE utf8mb4_bin NOT NULL DEFAULT 'ANDROID',
 `device_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
 `online_status` enum('ONLINE','OFFLINE','AWAY') COLLATE utf8mb4_bin NOT NULL DEFAULT 'ONLINE',
 `device_details` json NOT NULL,
 `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`id`),
 UNIQUE KEY `business_id` (`business_id`,`device_id`,`user_id`),
 UNIQUE KEY `token`(`token`)
)

alter table business_details add constraint UNIQUE key (domain);
ALTER TABLE `office_chat_test`.`business_details` ADD INDEX `domainIndex` (`domain`(50));

ALTER TABLE `users` CHANGE `password` `password` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL;

alter table users add CONSTRAINT unique key (user_unique_key)

CREATE TABLE `business_private_properties` (
 `business_id` int(11) NOT NULL,
 `property` varchar(100) COLLATE utf8mb4_bin NOT NULL,
 `value` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
 `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY key(`business_id`)
)

ALTER TABLE `office_chat_test`.`business_private_properties` ADD INDEX `property_index` (`property`(100));


alter table business_details add CONSTRAINT UNIQUE key(email);

ALTER TABLE `business_details` CHANGE `fugu_secret_key` `fugu_secret_key` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT ' ';

ALTER TABLE `office_chat_test`.`users` ADD INDEX `emailIndex` (`email`(50));

ALTER TABLE `office_chat_test`.`user_devices` ADD INDEX `compositeIndex` (`device_id`(80));

ALTER TABLE `business_signup_requests` CHANGE `otp` `otp` VARCHAR(80) NOT NULL;