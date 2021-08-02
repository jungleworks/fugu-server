
create table signup_requests like business_signup_requests;

insert into signup_requests SELECT * from business_signup_requests;

//ALTER TABLE `signup_requests` DROP INDEX `business_name`;


ALTER TABLE `signup_requests` CHANGE `business_name` `business_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
ALTER TABLE `signup_requests` CHANGE `domain` `domain` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL;

ALTER TABLE `signup_requests` CHANGE `is_created` `is_expired` ENUM('YES','NO') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'NO';

alter table signup_requests add column sent_count INT(11) DEFAULT 1 after is_expired;


alter table business_details rename to workspace_details;

ALTER TABLE `workspace_details` CHANGE `domain` `workspace` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;

ALTER TABLE `workspace_details` CHANGE `business_id` `workspace_id` INT(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `workspace_details` CHANGE `business_name` `workspace_name` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;



ALTER TABLE `user_details` CHANGE `business_id` `workspace_id` INT(11) NOT NULL;

ALTER TABLE `user_devices` CHANGE `business_id` `workspace_id` INT(11) NOT NULL;

ALTER TABLE `user_invitations` CHANGE `business_id` `workspace_id` INT(11) NOT NULL;





ALTER TABLE `business_property` CHANGE `business_id` `workspace_id` INT(10) NOT NULL COMMENT ' -1 public accessible , 0 business accessible ';

alter table business_property rename to workspace_property;



INSERT INTO `workspace_property` (`workspace_id`, `property`, `value`, `updated_at`) VALUES ('0', 'allowed_workspaces', '[]', '2018-02-16 12:24:40');





// revert



alter table `workspace_details`  rename to business_details;

ALTER TABLE `business_details` CHANGE `workspace` `domain`  VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;

ALTER TABLE `business_details` CHANGE  `workspace_name` `business_name` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL

ALTER TABLE `business_details` CHANGE `workspace_id`  `business_id` INT(11) NOT NULL AUTO_INCREMENT;




ALTER TABLE `user_details` CHANGE `workspace_id`  `business_id` INT(11) NOT NULL;

ALTER TABLE `user_devices` CHANGE `workspace_id` `business_id`  INT(11) NOT NULL;

ALTER TABLE `user_invitations` CHANGE `workspace_id` `business_id`  INT(11) NOT NULL;


alter table workspace_property  rename to business_property;

ALTER TABLE `business_property` CHANGE `workspace_id` `business_id`  INT(10) NOT NULL COMMENT ' -1 public accessible , 0 business accessible ';

