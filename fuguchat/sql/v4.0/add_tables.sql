CREATE TABLE `change_contact_number` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `user_id` varchar(255) NOT NULL,
 `contact_number` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
 `otp` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
 `expired` enum('YES','NO') NOT NULL DEFAULT 'NO',
 `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`id`),
) ENGINE=InnoDB AUTO_INCREMENT=0