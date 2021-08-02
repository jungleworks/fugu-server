create table users_backup like users;
insert into users_backup SELECT * from users;

create table password_reset_request_backup like password_reset_request;
insert into password_reset_request_backup SELECT * from password_reset_request;



CREATE TABLE `user_details`(
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(255) NOT NULL,
    `business_id` INT(11) NOT NULL,
    `full_name` VARCHAR(255) DEFAULT '',
    `user_image` VARCHAR(255) NOT NULL DEFAULT '',
    `department` VARCHAR(80) DEFAULT '',
    `designation` VARCHAR(80) DEFAULT '',
    `manager` VARCHAR(80) DEFAULT '',
    `contact_number` VARCHAR(80) DEFAULT '',
    `location` VARCHAR(80) DEFAULT '',
    `status` ENUM('ENABLED', 'DISABLED') DEFAULT 'ENABLED',
    `online_status` ENUM('ONLINE', 'OFFLINE', 'AWAY') ,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id), UNIQUE KEY unique_key (user_id,business_id)
);

insert into user_details (user_id, business_id, full_name, user_image, department, designation, manager, location, contact_number, status, created_at) select  user_id, business_id, full_name, user_image, department, designation, manager, location, contact_number, status, created_at from users_backup;


alter table password_reset_request_backup drop column business_id;

delete from users_backup where business_id != 9;



ALTER TABLE `users_backup` DROP INDEX `business_id`;
alter table users_backup drop business_id, drop location, drop designation, drop department, drop manager, drop status;

delete from users_backup where  > "2018-02-06 00:00:00";

ALTER TABLE `users_backup` ADD UNIQUE `uniqueEmail` (`email`);

delete from business_details where created_at > "2018-02-06 00:00:00"

DELETE FROM `user_details` where business_id != 9







alter table users rename to users_old;
alter table users_backup rename to users;
alter table users_old rename to users_backup;




// revert
alter table users rename to users_revert;
alter table users_backup rename to users;
alter table users_revert rename to users_backup;

