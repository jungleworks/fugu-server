CREATE TABLE `office_chat_test`.`password_reset_request` ( `id` INT(11) NOT NULL AUTO_INCREMENT , `business_id` INT(11) NOT NULL , `email` VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL , `reset_token` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL , `expired` ENUM('YES','NO') NOT NULL DEFAULT 'NO' , `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , `updated_at` TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , PRIMARY KEY (`id`));

ALTER TABLE `office_chat_test`.`password_reset_request` ADD INDEX `businessIdUserEmailEmailToken` (`business_id`, `email`, `expired`);


ALTER TABLE `office_chat_test`.`password_reset_request` ADD UNIQUE `uniqueResetToken` (`reset_token`);

