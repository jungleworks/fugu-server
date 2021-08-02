ALTER TABLE `users`  ADD `contact_number` VARCHAR(32) NULL DEFAULT ''  AFTER `email`;
ALTER TABLE `users`  ADD `designation` VARCHAR(80) NULL DEFAULT ''  AFTER `status`;
ALTER TABLE `users`  ADD `location` VARCHAR(80) NOT NULL DEFAULT ''  AFTER `user_image`;
ALTER TABLE `users` ADD `department` VARCHAR(80) NOT NULL DEFAULT '' AFTER `designation`;
ALTER TABLE `users` ADD `manager` VARCHAR(80) NOT NULL DEFAULT '' AFTER `department`;