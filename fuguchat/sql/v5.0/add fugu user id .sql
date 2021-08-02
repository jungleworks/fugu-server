ALTER TABLE `user_details`  ADD `fugu_user_id` INT(11) NULL  AFTER `workspace_id`;
ALTER TABLE `user_details` ADD UNIQUE(`fugu_user_id`);