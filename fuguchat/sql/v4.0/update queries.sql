

// update using join
UPDATE users INNER JOIN (SELECT users.user_id, email, users.contact_number as cn, user_details.contact_number as pn FROM `users` LEFT JOIN user_details on users.user_id = user_details.user_id where workspace_id = 9 and users.contact_number = '' and user_details.contact_number != '' ) as up on users.user_id = up.user_id SET users.contact_number = up.contact_number;


