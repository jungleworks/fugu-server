CREATE TABLE `office_chat_prod`.`fugu_bot_search`(
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
    `full_name` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
    `searched_content` JSON NOT NULL,
    `result` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE = InnoDB;