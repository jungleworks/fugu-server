ALTER TABLE `user_details`  ADD `role` ENUM('USER','ADMIN','OWNER') NOT NULL DEFAULT 'USER'  AFTER `status`;

update user_details uds join business_details b on uds.business_id = b.business_id JOIN users u on u.user_id = uds.user_id and u.email = b.email  set role='OWNER';

