ALTER TABLE `user_invitations` CHANGE `email` `email` VARCHAR(80) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;


// add column


ALTER TABLE `user_invitations` ADD `contact_number` VARCHAR(255) NULL DEFAULT NULL AFTER `email`;

ALTER TABLE `password_reset_request` ADD `user_id` VARCHAR(255) NULL DEFAULT NULL AFTER `email`;





// update user user_id

UPDATE password_reset_request
        JOIN users ON users.email = password_reset_request.email
SET
password_reset_request.user_id = users.user_id;




// not null column



// constraint

ALTER TABLE `password_reset_request` CHANGE `user_id` `user_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;


ALTER TABLE `fugu_chat_test`.`password_reset_request` DROP INDEX `businessIdUserEmailEmailTokenIndex`, ADD INDEX `businessIdUserEmailEmailTokenIndex` (`user_id`, `expired`) USING BTREE;

update users set contact_number = null where contact_number = '';



ALTER TABLE `users` CHANGE `contact_number` `contact_number` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL;


// make constraint on db



signup with contact_number



ALTER TABLE `signup_requests` ADD `contact_number` VARCHAR(32) NULL DEFAULT NULL AFTER `email`;



