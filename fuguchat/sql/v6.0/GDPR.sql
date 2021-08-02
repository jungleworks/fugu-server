create table `gdpr_queries` (
`id` int(11) NOT null AUTO_INCREMENT,
 `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOt null,
 `workspace_id` INT(11) NOT NULL,
    `reason` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOt null,
    `query` ENUM('FORGOTTEN', 'PORTABILITY', 'RECTIFICATION', 'RESTRICTION') NOT null,
    `status` ENUM('PROCEED', 'NOT PROCEED') DEFAULT 'NOT PROCEED' NOT null,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
)

ALTER TABLE `user_rights_requests` ADD `workspace_id` INT(11) NOT NULL AFTER `user_id`;