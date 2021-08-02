-- phpMyAdmin SQL Dump
-- version 4.0.10.20
-- https://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 04, 2021 at 02:38 PM
-- Server version: 8.0.26
-- PHP Version: 5.3.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `office_chat_prod`
--

-- --------------------------------------------------------

--
-- Table structure for table `apps`
--

CREATE TABLE IF NOT EXISTS `apps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `tag_line` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `page_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `categories` json DEFAULT NULL,
  `workspace_id` bigint NOT NULL DEFAULT '0',
  `user_id` bigint DEFAULT '0' COMMENT 'creating by me test db',
  `app_credentials` json DEFAULT NULL,
  `oauth_credentials` json DEFAULT NULL,
  `bot_user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `bot_user_type` int DEFAULT NULL,
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `type` enum('APP','WEBHOOK','CUSTOM') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'APP',
  `created_by` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `bot_user_id` (`bot_user_id`),
  KEY `bot_user_id_2` (`bot_user_id`),
  KEY `type` (`type`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=15 ;

--
-- Dumping data for table `apps`
--

INSERT INTO `apps` (`id`, `name`, `description`, `tag_line`, `page_url`, `categories`, `workspace_id`, `user_id`, `app_credentials`, `oauth_credentials`, `bot_user_id`, `bot_user_type`, `icon`, `type`, `created_by`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'Tookan Bot', 'Tookan Bot can be summed up as the one bot to receive messages from Tookan webhooks.\r\nFor most enterprises, efficient field force management is the most complex task as \r\nit involves various dependent and independent variables to measure. Field force\r\nmanagement takes huge time for manual micro-management for to reach maximum efficiency. Furthermore, unpredictable changes make it more difficult to \r\nmanage field force manually. Incorrect and incomplete information along with miscommunication also adds to inefficiency which force push enterprises to shift to \r\nfield force management solutions. \r\nFrom a business perspective, Tookan’s field force management features not only\r\ninclude route optimization and real-time tracking, but business can also assign the \r\ntask to the field force. Field force will get a notification alert in real-time for the next \r\nassigned task. Field force management solution has become must for enterprises \r\nsince instant management of field force to increase efficiency and reduce the time \r\nto complete a particular task is the need of an hour to grow in the tough competitive market.', 'Delivery Management', '/assets/apps-html/tookan-integration.html', '["Webhook", "Bots"]', 0, NULL, NULL, NULL, '', 0, 'https://fchat.s3.ap-south-1.amazonaws.com/default/5OpskyJwEV.1588069877935.png', 'WEBHOOK', 0, '2019-03-06 14:08:47', '2021-08-02 12:55:07', 0),
(5, 'Jira', 'Get notified when any issue is created or updated in JIRA directly on {{app_name}}. You can also get customized notifications for Status changes done on JIRA instantly. (Notifications can be set up by the Admin of the JIRA account)', 'Project Management', '/assets/apps-html/jira-integration.html', '["Project Management"]', 0, NULL, NULL, NULL, 'dc', 0, 'https://fuguchat.s3.ap-south-1.amazonaws.com/image/w57kHIGrsB.1552385695516.png', 'WEBHOOK', 0, '2019-03-13 17:33:41', '2021-08-02 12:40:23', 0),
(6, 'Bit Bucket', 'Get notified when any issue is created or updated in Big Bucket directly on {{app_name}}. You can also get customized notifications for Status changes done on JIRA instantly. (Notifications can be set up by the Admin of the JIRA account)', 'Developer Tools', '/assets/apps-html/bit-bucket-integration.html', '["Developer Tools"]', 0, NULL, NULL, NULL, '', 0, 'https://fuguchat.s3.ap-south-1.amazonaws.com/image/efSs9jZM59.1552558814818.png', 'WEBHOOK', 0, '2019-03-17 09:20:59', '2021-08-02 12:40:23', 0),
(7, 'Attendance Bot', 'AttendanceBot can be summed up as the one bot to rule leave management and time tracking.\r\nJust dm @attendancebot messages like ‘leave from 27-03-2019 to 29-03-2019’ and it will send your leave request for approval, notify you on its status and put it on your calendar. \r\n\r\nAdmin and HR managers can create more vacation types, set up accruals and let people query their balances, extract powerful reports, view the absence data on the beautiful external dashboard, ingest local holidays. \r\n\r\nTime tracking with AttendanceBot is a breeze. With simple ''in'' and ''out'' messages, clock in and out and keep a track of your work hours and export accurate timesheets right inside {{app_name}}. You can set your team Punch In or Punch Out with powerful features like Face recognition and geo location.', 'Office Management', NULL, '["HR", "Team Culture", "Office Management"]', 0, NULL, NULL, NULL, 'im4EinKp13', 4, 'https://fuguchat.s3.ap-south-1.amazonaws.com/image/3A2WWS5Ht9.1540999624660.png', 'APP', 0, '2019-03-26 17:01:45', '2021-08-02 12:40:23', 0),
(8, 'Conference Bot', 'Conference Bot provides one-click video conferences right in your browser without requiring PIN codes or additional software.  This integration lets your team use click video icon showing in the group to start a video conference in your channel, making it easy for others to join the call.  You can just copy and send the conference link to the non-{{app_name}} users also.', 'Communication', NULL, '["Voice & Video", "Communication"]', 0, NULL, NULL, NULL, 'im4fcyak513', 9, 'https://fchat.s3.ap-south-1.amazonaws.com/default/0azZ0mpjed.1574435010178.png', 'APP', 0, '2019-03-26 17:01:45', '2021-08-02 12:40:23', 0),
(9, 'Trello', 'Installing the Trello app allows you to get real-time updates from a Trello board, into a {{app_name}} channel. Trello is the visual collaboration tool that creates a shared perspective on any project. Link your Trello and Fugu teams to harness the power of productivity with the Trello app for Fugu, and create a seamless and collaborative workflow between your favorite apps.', 'Project Management', '/assets/apps-html/trello-integration.html', '["Project Management", "Productivity"]', 0, NULL, NULL, NULL, '', NULL, 'https://s3.ap-south-1.amazonaws.com/fuguchat/images/Trello.svg', 'WEBHOOK', 0, '2019-04-08 20:51:29', '2021-08-02 12:40:23', 0),
(10, 'Alert Bot', 'Get {{app_name}} Notifications when something interesting happens on your product. \r\nEasy to integrate webhook which can be triggered by HTTP POST request with a message parameter.', 'Developer Tools', '/assets/apps-html/alert-bot-integration.html', '["Alerts"]', 0, NULL, NULL, NULL, '', 0, 'https://fchat.s3.ap-south-1.amazonaws.com/image/zqtiqYQW8n.1560323356843.png', 'WEBHOOK', 0, '2019-03-06 14:08:47', '2021-08-02 12:40:23', 0),
(11, 'Scrum Bot', 'Go agile with Scrum Bot and manage your work efficiently! ... Scrum Bot helps teams manage their works through Sprints and Stand-up meetings, and having them on {{app_name}}—where your team communicates, brings together every detail and discussion under one roof. Automate status meetings , Track work progress, business metrics, obstacles and team happiness 24x7 and get summary reports in {{app_name}} (DM/channel).', 'Scrum', NULL, '["Scrum"]', 0, NULL, NULL, NULL, 'im4EinKp23', 7, 'https://fchat.s3.ap-south-1.amazonaws.com/test/image/FkNQ7byT0a.1561119029912.png', 'APP', 0, '2019-08-28 06:43:49', '2021-08-02 12:40:23', 0),
(14, 'Secret Santa', 'Secret Santa is a Western Christmas tradition in which members of a group or community are randomly assigned a person to whom they anonymously give a gift.\r\nWith this application, just select the people you want to do a Secret Santa with, and let our secret algorithm select and notify, by private message, each user.\r\nNo account and no personal information required.', 'Secret Santa', NULL, '["Secret Santa"]', 0, NULL, NULL, NULL, 'im4fcyak5', 3, 'https://fchat.s3.ap-south-1.amazonaws.com/default/KbQQEszN4x.1575441149906.png', 'APP', 0, '2019-12-05 12:16:30', '2021-08-02 12:40:23', 0);

-- --------------------------------------------------------

--
-- Table structure for table `auth_logs`
--

CREATE TABLE IF NOT EXISTS `auth_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request` json NOT NULL,
  `response` json NOT NULL,
  `signup_login_source` varchar(255) DEFAULT NULL,
  `type` varchar(80) NOT NULL,
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `billing_plans`
--

CREATE TABLE IF NOT EXISTS `billing_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workspace_id` int DEFAULT NULL,
  `price` float NOT NULL,
  `period` enum('MONTHLY','QUATERLY','HALF_YEARLY','ANNUALY') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `app_id` int DEFAULT NULL,
  `plan_type` enum('PER_USER','SUBSCRIPTION') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `billing_type` enum('APP','FUGU') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `trial_expire_on` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `billing_transactions`
--

CREATE TABLE IF NOT EXISTS `billing_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workspace_id` int NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `plan_id` int DEFAULT NULL,
  `paid_for_users` int NOT NULL,
  `current_users` int NOT NULL,
  `amount` float(65,2) NOT NULL,
  `balance` float(65,2) NOT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `payment_intent_id` varchar(255) DEFAULT NULL,
  `invoice` varchar(255) DEFAULT NULL,
  `transaction_status` tinyint(1) NOT NULL,
  `plan_state` enum('TRIAL_EXPIRED','ACTIVE','EXPIRED','MANUALLY') NOT NULL DEFAULT 'ACTIVE',
  `expire_on` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `bots_metrics`
--

CREATE TABLE IF NOT EXISTS `bots_metrics` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `har` json DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `metric` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `metric` (`metric`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `business_installed_apps`
--

CREATE TABLE IF NOT EXISTS `business_installed_apps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workspace_id` int NOT NULL,
  `app_id` int NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `app_state` enum('ACTIVE','TRIAL','EXPIRED') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`workspace_id`,`app_id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `business_to_space`
--

CREATE TABLE IF NOT EXISTS `business_to_space` (
  `business_id` int NOT NULL,
  `workspace_id` int NOT NULL,
  PRIMARY KEY (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `calling_details`
--

CREATE TABLE IF NOT EXISTS `calling_details` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `device_details` json DEFAULT NULL,
  `calling_link` varchar(255) DEFAULT NULL,
  `user_ids_in_call` json DEFAULT NULL,
  `user_count` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `link` (`calling_link`),
  KEY `user id` (`user_id`),
  KEY `status` (`user_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `change_contact_number`
--

CREATE TABLE IF NOT EXISTS `change_contact_number` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `contact_number` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `otp` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `expired` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Unique request` (`user_id`,`contact_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `change_contact_number_backup`
--

CREATE TABLE IF NOT EXISTS `change_contact_number_backup` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `contact_number` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `otp` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `expired` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `channels`
--

CREATE TABLE IF NOT EXISTS `channels` (
  `channel_id` int NOT NULL AUTO_INCREMENT,
  `workspace_id` int NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Whether channel is active or not',
  `owner_id` int NOT NULL DEFAULT '0' COMMENT 'Person who created this channel',
  `chat_type` tinyint(1) DEFAULT '0',
  `custom_label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Name of the channel',
  `channel_image` varchar(255) DEFAULT NULL,
  `channel_properties` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`channel_id`,`workspace_id`),
  KEY `workspace_label index` (`custom_label`) USING BTREE,
  KEY `workspace_id_index` (`workspace_id`),
  KEY `chat_type` (`chat_type`,`workspace_id`,`status`),
  KEY `channel_image` (`channel_image`),
  KEY `channels_idx_workspace_status_channel_id` (`workspace_id`,`status`,`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `channel_latest_message`
--

CREATE TABLE IF NOT EXISTS `channel_latest_message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `channel_id` int NOT NULL,
  `message_id` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `channel_idx` (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `domain_credentials`
--

CREATE TABLE IF NOT EXISTS `domain_credentials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `domain` varchar(255) NOT NULL,
  `full_domain` varchar(255) DEFAULT NULL,
  `cloudflare_credentials` json DEFAULT NULL,
  `email_credentials` json DEFAULT NULL,
  `google_creds` json DEFAULT NULL,
  `hippo_recipient_key` varchar(255) DEFAULT NULL,
  `android_app_link` varchar(255) NOT NULL,
  `ios_app_link` varchar(255) NOT NULL,
  `api_key` varchar(255) DEFAULT NULL,
  `secret_open_api_key` varchar(255) DEFAULT NULL,
  `certificate` varchar(255) DEFAULT NULL,
  `voip_certificate` varchar(255) DEFAULT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `android_latest_version` int NOT NULL,
  `android_critical_version` int NOT NULL,
  `ios_latest_version` int NOT NULL,
  `ios_critical_version` int NOT NULL,
  `push_icon` varchar(255) DEFAULT NULL,
  `properties` json DEFAULT NULL,
  `live_stream_url` varchar(100) DEFAULT NULL,
  `is_invite_email_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `show_meet_tab` tinyint(1) NOT NULL DEFAULT '0',
  `payment_gateway_creds` json DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `domain_name_idx` (`domain`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `domain_credentials`
--

INSERT INTO `domain_credentials` (`id`, `domain`, `full_domain`, `cloudflare_credentials`, `email_credentials`, `google_creds`, `hippo_recipient_key`, `android_app_link`, `ios_app_link`, `api_key`, `secret_open_api_key`, `certificate`, `voip_certificate`, `topic`, `android_latest_version`, `android_critical_version`, `ios_latest_version`, `ios_critical_version`, `push_icon`, `properties`, `live_stream_url`, `is_invite_email_enabled`, `show_meet_tab`, `payment_gateway_creds`, `status`) VALUES
(1, 'fuguchat.com', 'open.fuguchat.com', NULL, NULL, NULL, NULL, 'https://play.google.com/store/apps/details?id=com.officechat', 'https://itunes.apple.com/us/app/fugu-simple-work-chat/id1336986136?ls=1&mt=8', NULL, '', NULL, NULL, 'com.product.officeChat', 305, 210, 220, 182, 'https://fchat.s3.ap-south-1.amazonaws.com/default/mLXvYVFbPM.1586775925636.png', '{"is_old_flow": true, "signup_mode": 1, "conference_link": "https://meet.jit.si", "is_white_labelled": false, "is_self_chat_enabled": true, "is_create_workspace_enabled": true}', 'live.fugu.chat', 1, 1, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `export_data`
--

CREATE TABLE IF NOT EXISTS `export_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `request_count` int DEFAULT '0',
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `status` enum('PENDING','ERRORED','DELEIVERED','') NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `fugu_bot`
--

CREATE TABLE IF NOT EXISTS `fugu_bot` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `workspace_id` int NOT NULL,
  `full_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `fugu_user_id` int DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `contact_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `employee_id` varchar(255) DEFAULT '0',
  `salary` varchar(255) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fugu id` (`fugu_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `fugu_bot_responses`
--

CREATE TABLE IF NOT EXISTS `fugu_bot_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `keywords` json NOT NULL,
  `response` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

--
-- Dumping data for table `fugu_bot_responses`
--

INSERT INTO `fugu_bot_responses` (`keywords`, `response`) VALUES
('[\"hy\"]', '{\"is_web\": true, \"message\": \" hey! 😀 Welcome to Fugu Bot.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"hi\"]', '{\"is_web\": true, \"message\": \" hello! 😃  Welcome to app_name Bot. How are you? \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"hie\"]', '{\"is_web\": true, \"message\": \" hello! 😃 there! \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"hello\"]', '{\"is_web\": true, \"message\": \" Hey! 😃  Welcome to Fugu Bot. How may I help you? \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"am\", \"good\"]', '{\"is_web\": true, \"message\": \"Have a nice day.😃.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"am\", \"well\"]', '{\"is_web\": true, \"message\": \"Great 😀. Have a nice day! 😄\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"hey\"]', '{\"is_web\": true, \"message\": \" Hey! 😃 Welcome to Fugu Bot. How may I help you?\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"am\", \"sad\"]', '{\"is_web\": true, \"message\": \"Don\'t be sad everything will be fine 😀\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"am\", \"bad\"]', '{\"is_web\": true, \"message\": \"You are not bad! You are a nice person 😀\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"feel\", \"bad\"]', '{\"is_web\": true, \"message\": \"Don\'t feel bad! Life is too short for Grief or regret😊\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"you\", \"doing\"]', '{\"is_web\": true, \"message\": \"I am waiting for your messages😊\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"love\", \"you\"]', '{\"is_web\": true, \"message\": \"Fugu Bot loves you  😘\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"create\"]', '{\"is_web\": true, \"message\": \"What would you like to create ? \\n 1.Type -  \'create group\' to create any public or private group. \\n 2. Type - \'create workspace\' to create new workspace \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"create\", \"group\"]', '{\"is_web\": true, \"message\": \"Working in group makes task easier.😊 \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"CREATE_GROUP\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"group\"]', '{\"is_web\": true, \"message\": \"Working in group makes task easier.😊\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"CREATE_GROUP\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"createGroup\"}], \"is_thread_message\": false}'),
('[\"workspace\"]', '{\"is_web\": true, \"message\": \"Workspace is an instance of the chatting application.\\n You can create mutiple workspaces for your different purposes.\\n Only members present within a workspace can interact with one another. \\n You can invite members on your workspace\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"create\", \"workspace\"]', '{\"is_web\": true, \"message\": \"Workspace is an instance of the chatting application.\\n You can create mutiple workspaces for your different purposes.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a new workspace for you ? \", \"buttons\": [{\"label\": \"CREATE WORKSPACE\", \"style\": \"success\", \"action\": \"CREATE_WORKSPACE\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"create\", \"workspaces\"]', '{\"is_web\": true, \"message\": \"Click on the down arrow icon present on the top left corner of the screen.\\n Select the \'Add Workspace\' button to create a new workspae.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a new workspace for you ? \", \"buttons\": [{\"label\": \"CREATE WORKSPACE\", \"style\": \"success\", \"action\": \"CREATE_WORKSPACE\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"createWorkspace\"}], \"is_thread_message\": false}'),
('[\"workspaces\"]', '{\"is_web\": true, \"message\": \"Workspace is an instance of the chatting application.\\n You can create mutiple workspaces for your different purposes.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a new workspace for you ? \", \"buttons\": [{\"label\": \"CREATE WORKSPACE\", \"style\": \"success\", \"action\": \"createWorkspace\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"groups\"]', '{\"is_web\": true, \"message\": \"Working in group makes task easier.😊\\n You can create public as well as private groups in Fugu\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"CREATE_GROUP\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"help\"]', '{\"is_web\": true, \"message\": \"Hey! Welcome to app_name Bot 😊 \\n -Type \'create group\' to create any  public or private group. \\n -Type \'create workspace\' to create any new workspace \\n -Type \'screen sharing\' to know how to screen share in app_name. \\n - Type \'Browse Group\' to browse groups. \\n - Type \'Invite members\' to invite members in app_name\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"default\"]', '{\"is_web\": true, \"message\": \"My Brain does not have a response for that.😑\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"ok\"]', '{\"is_web\": true, \"message\": \"😊\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"done\"]', '{\"is_web\": true, \"message\": \"👍\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"screen\", \"sharing\"]', '{\"is_web\": true, \"message\": \"You can share your screen with your colleagues with screen sharing feature in app_name.💻 \\n Firstly you need to video call the person with whom you want to screen share📞 \\n Then just click on the icon that appears on the right corner📎.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"screen\", \"share\"]', '{\"is_web\": true, \"message\": \"You can share your screen with your colleagues with screen sharing feature in app_name.💻 \\n Firstly you need to video call the person with whom you want to screen share📞 \\n Then just click on the icon that appears on the right corner📎.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"How\", \"are\", \"you\"]', '{\"is_web\": true, \"message\": \"I am fine😊\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"hey\", \"create\", \"group\"]', '{\"is_web\": true, \"message\": \"Working in group makes task easier.😊 \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"CREATE_GROUP\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hey\", \"create\", \"workspace\"]', '{\"is_web\": true, \"message\": \"Workspace is an instance of the chatting application.\\n You can create mutiple workspaces for your different purposes.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a new workspace for you ? \", \"buttons\": [{\"label\": \"CREATE WORKSPACE\", \"style\": \"success\", \"action\": \"CREATE_WORKSPACE\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"browse\", \"group\"]', '{\"is_web\": true, \"message\": \" By browsing groups you can see all the public groups and your private groups.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Do you want to browse group?\", \"buttons\": [{\"label\": \"BROWSE GROUP\", \"style\": \"success\", \"action\": \"BROWSE_GROUP\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"approve\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"invite\"]', '{\"is_web\": true, \"message\": \"Let\'s make our circle Big!\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Invite members in app_name.\", \"buttons\": [{\"label\": \"INVITE MEMBER\", \"style\": \"success\", \"action\": \"INVITE_MEMBER\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"approve\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hi\", \"create\", \"group\"]', '{\"is_web\": true, \"message\": \"Working in group makes task easier.😊 \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"createGroup\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hie\", \"create\", \"group\"]', '{\"is_web\": true, \"message\": \"Working in group makes task easier.😊  \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"createGroup\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hy\", \"create\", \"group\"]', '{\"is_web\": true, \"message\": \"Working in group makes task easier.😊 \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"approve\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hello\", \"create\", \"group\"]', '{\"is_web\": true, \"message\": \"Working in group makes task easier.😊  \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"createGroup\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hi\", \"create\", \"workspace\"]', '{\"is_web\": true, \"message\": \"Workspace is an instance of the chatting application.\\n You can create mutiple workspaces for your different purposes.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a new workspace for you ? \", \"buttons\": [{\"label\": \"CREATE WORKSPACE\", \"style\": \"success\", \"action\": \"createWorkspace\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hy\", \"create\", \"workspace\"]', '{\"is_web\": true, \"message\": \"Workspace is an instance of the chatting application.\\n You can create mutiple workspaces for your different purposes.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a new workspace for you ? \", \"buttons\": [{\"label\": \"CREATE WORKSPACE\", \"style\": \"success\", \"action\": \"createWorkspace\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hie\", \"create\", \"workspace\"]', '{\"is_web\": true, \"message\": \"Workspace is an instance of the chatting application.\\n You can create mutiple workspaces for your different purposes.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a new workspace for you ? \", \"buttons\": [{\"label\": \"CREATE WORKSPACE\", \"style\": \"success\", \"action\": \"createWorkspace\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hello\", \"create\", \"workspace\"]', '{\"is_web\": true, \"message\": \"Workspace is an instance of the chatting application.\\n You can create mutiple workspaces for your different purposes.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a new workspace for you ? \", \"buttons\": [{\"label\": \"CREATE WORKSPACE\", \"style\": \"success\", \"action\": \"createWorkspace\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"invite\", \"member\"]', '{\"is_web\": true, \"message\": \"Let\'s make your circle Big!\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Invite members in app_name.\", \"buttons\": [{\"label\": \"INVITE MEMBER\", \"style\": \"success\", \"action\": \"INVITE_MEMBER\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"approve\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"wtf\"]', '{\"is_web\": true, \"message\": \"Please be polite! 😡\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"browse\", \"groups\"]', '{\"is_web\": true, \"message\": \" By browsing groups you can see all the public groups and your private groups.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Do you want to browse group?\", \"buttons\": [{\"label\": \"BROWSE GROUP\", \"style\": \"success\", \"action\": \"BROWSE_GROUP\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"approve\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"fuck\", \"off\"]', '{\"is_web\": true, \"message\": \"Kirpya Tameez se baat kare!😡\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"create\", \"workspace\", \"group\"]', '{\"is_web\": true, \"message\": \" - Type \'create group\'  to create any public or private group \\n - Type \'create workspace\' to create any new  workspace \\n Happy Chatting😄 \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"joke\"]', '{\"is_web\": true, \"message\": \"I\'m a chatterbot not a comedy bot 🙄\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"fuck\"]', '{\"is_web\": true, \"message\": \"Kripya tameez se baat kare! 😡\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"gussa\"]', '{\"is_web\": true, \"message\": \"I don\'t have such low frequency emotions.I am always Happy😀\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"bura\"]', '{\"is_web\": true, \"message\": \"Bura nahi 🤑 , sab acha hai👍  \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"voice\"]', '{\"is_web\": true, \"message\": \"Open the chat with whom you want to voice chat and press on the 📞 icon.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"video\"]', '{\"is_web\": true, \"message\": \"Open the chat with whom you want to video chat.\\n Press on the video calling icon present on the top right corner😊.\\n Happy Chatting\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"comedy\"]', '{\"is_web\": true, \"message\": \"I\'m a chatterbot not a comedy bot 🙄\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"kaisi\", \"ho\"]', '{\"is_web\": true, \"message\": \"I am good.How are you?\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"kaam\"]', '{\"is_web\": true, \"message\": \"Kaam Karlo😀!Sab moh maya hai☺\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"work\"]', '{\"is_web\": true, \"message\": \"Work is all you need to do!🤣\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"home\"]', '{\"is_web\": true, \"message\": \"Let\'s go home.home sweet home🏠 \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"weekend\"]', '{\"is_web\": true, \"message\": \"Just have patience😄.Weekend is not so far🤗✨\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"weekends\"]', '{\"is_web\": true, \"message\": \"🤓🤩🤩🤩🤓\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"chalna\"]', '{\"is_web\": true, \"message\": \"kahan chalun?\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"invite\", \"members\"]', '{\"is_web\": true, \"message\": \"Let\'s make our circle Big!\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Invite members in app_name.\", \"buttons\": [{\"label\": \"INVITE MEMBER\", \"style\": \"success\", \"action\": \"INVITE_MEMBER\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"approve\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"hello\", \"create\", \"group\"]', '{\"is_web\": true, \"message\": \"Working in group makes task easier.😊  \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"createGroup\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"bye\"]', '{\"is_web\": true, \"message\": \"See you later!🤗\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"fugu\"]', '{\"is_web\": true, \"message\": \"Hey! app_name is an all-purpose  Team Chat app. \\n The Best Business Chat Software that includes real-time messaging. \\n Communication, Collaboration, Empowerment, Engagement All On One-Single Chat Platform \\n We have different app integrations in app_name. \\n 1. Tookan \\n 2. Jira \\n 3. Bit Bucket \\n 4. Trello  \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"fugu\", \"bot\"]', '{\"is_web\": true, \"message\": \"Hey! Fugu Bot loves chatting with you😘\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"take\", \"care\"]', '{\"is_web\": true, \"message\": \"You too take care.😊\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"thank\", \"you\"]', '{\"is_web\": true, \"message\": \"Don\'t mention it\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"cron\"]', '{\"is_web\": true, \"message\": \" Hi! 😃  Welcome to Fugu Bot. I am your personal bot. \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"invite\", \"friends\"]', '{\"is_web\": true, \"message\": \"I don\'t have such low frequency emotions.I am always Happy😀\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"create\", \"group\", \"new\"]', '{\"is_web\": true, \"message\": \"Let\'s create a group with your co-members.\\n Working in group makes task easier.😊 \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"CREATE_GROUP\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"fugu\", \"cron\"]', '{\"is_web\": true, \"message\": \"Hey! app_name is an all-purpose  Team Chat app and Collaboration tool. \\n The Best Business Chat Software that includes real-time messaging. \\n Communication, Collaboration, Empowerment, Engagement All On One-Single Chat Platform \\n We have different app integrations in app_name.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"invite\", \"member\"]', '{\"is_web\": true, \"message\": \"Let\'s make your circle Big!\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Invite members in app_name.\", \"buttons\": [{\"label\": \"INVITE MEMBER\", \"style\": \"success\", \"action\": \"INVITE_MEMBER\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"approve\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"create\", \"group\"]', '{\"is_web\": true, \"message\": \"Let\'s create a group with your co-members.\\n Working in group makes task easier.😊 \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Hey! Do you want me to create a group for you ? \", \"buttons\": [{\"label\": \"CREATE GROUP\", \"style\": \"success\", \"action\": \"CREATE_GROUP\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"Deny\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}'),
('[\"screen\", \"sharing\"]', '{\"is_web\": true, \"message\": \"You can share your screen with your colleagues. 💻 \\n Firstly you need to video call the person with whom you want to screen share📞 \\n Then just click on the icon that appears on the right corner📎.\", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 1, \"is_thread_message\": false}'),
('[\"integrate\", \"apps\"]', '{\"is_web\": true, \"message\": \"Now you can integrate app_name with some apps like Trello, Jira, Bit Bucket etc. \", \"is_typing\": 0, \"server_push\": 0, \"message_type\": 14, \"custom_actions\": [{\"title\": \"Choose apps, with which you would like to integrate app_name.\", \"buttons\": [{\"label\": \"APPS\", \"style\": \"success\", \"action\": \"APPS\", \"action_type\": \"ACTION_PUBLISH\"}, {\"label\": \"NO\", \"style\": \"danger\", \"action\": \"approve\", \"action_type\": \"ACTION_PUBLISH\"}], \"is_action_taken\": false, \"confirmation_type\": \"default\"}], \"is_thread_message\": false}');


-- --------------------------------------------------------

--
-- Table structure for table `fugu_bot_search`
--

CREATE TABLE IF NOT EXISTS `fugu_bot_search` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `full_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `searched_content` json NOT NULL,
  `result` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `fugu_keywords`
--

CREATE TABLE IF NOT EXISTS `fugu_keywords` (
  `id` int NOT NULL AUTO_INCREMENT,
  `keyword` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `fugu_keywords`
--

INSERT INTO `fugu_keywords` (`id`, `keyword`) VALUES
(1, 'hy'),
(2, 'hi'),
(3, 'hie'),
(4, 'hello'),
(5, 'good'),
(8, 'sad'),
(9, 'bad'),
(10, 'feel'),
(11, 'create'),
(12, 'group'),
(13, 'groups'),
(14, 'workspaces'),
(15, 'workspace'),
(16, 'help'),
(17, 'screen'),
(18, 'share'),
(19, 'sharing'),
(20, 'ok'),
(21, 'done'),
(22, 'hey'),
(23, 'love'),
(24, 'you'),
(26, 'doing'),
(27, 'browse'),
(28, 'join'),
(29, 'member'),
(30, 'members'),
(31, 'invite'),
(32, 'wtf'),
(33, 'joke'),
(35, 'gussa'),
(36, 'bura\r\n'),
(37, 'voice'),
(38, 'video'),
(39, 'comedy'),
(40, 'kaisi'),
(41, 'ho'),
(42, 'home'),
(43, 'work\r\n'),
(46, 'chalna'),
(47, 'bura'),
(48, 'am'),
(49, 'work'),
(50, 'weekend'),
(51, 'weekends'),
(52, 'bye'),
(53, 'fugu'),
(54, 'kaam'),
(55, 'kaam'),
(56, 'bot'),
(57, 'bored'),
(58, 'yo'),
(72, 'are'),
(73, 'sindle');

-- --------------------------------------------------------

--
-- Table structure for table `gdpr_queries`
--

CREATE TABLE IF NOT EXISTS `gdpr_queries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `workspace_id` int NOT NULL,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `query` enum('FORGOTTEN','PORTABILITY','RECTIFICATION','RESTRICTION') NOT NULL,
  `status` enum('PROCEED','NOT PROCEED') NOT NULL DEFAULT 'NOT PROCEED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `google_access_token`
--

CREATE TABLE IF NOT EXISTS `google_access_token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) NOT NULL,
  `token` json NOT NULL,
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `google_calendar_meetings`
--

CREATE TABLE IF NOT EXISTS `google_calendar_meetings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(80) NOT NULL,
  `event_id` varchar(80) NOT NULL,
  `start_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `end_datetime` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `attendees` json NOT NULL,
  `is_scheduled` tinyint NOT NULL DEFAULT '0',
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `google_calender_logs`
--

CREATE TABLE IF NOT EXISTS `google_calender_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) NOT NULL,
  `request` json NOT NULL,
  `response` json NOT NULL,
  `event` varchar(80) NOT NULL,
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `google_users`
--

CREATE TABLE IF NOT EXISTS `google_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'varchar because of security reasons',
  `email` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `user_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `user_thumbnail_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '',
  `full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `onboard_source` enum('FUGU','GOOGLE') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'FUGU',
  `access_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `google_refresh_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `attributes` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `accessTokenIndex` (`access_token`),
  KEY `userIdIndex` (`user_id`(10)),
  KEY `emailIndex` (`email`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Table structure for table `guest_interaction`
--

CREATE TABLE IF NOT EXISTS `guest_interaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guest_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `workspace_id` int NOT NULL,
  `user_ids_to_connect` json DEFAULT NULL,
  `channel_ids_to_connect` json DEFAULT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique guest` (`guest_id`),
  KEY `user_id_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `live_stream_details`
--

CREATE TABLE IF NOT EXISTS `live_stream_details` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stream_id` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `channel_id` bigint NOT NULL,
  `workspace_id` bigint NOT NULL,
  `is_select_all` tinyint(1) NOT NULL,
  `invite_user_ids` json DEFAULT NULL,
  `stream_link` varchar(255) DEFAULT NULL,
  `recording_url` varchar(255) DEFAULT NULL,
  `messages` json DEFAULT NULL,
  `start_time` varchar(100) DEFAULT NULL,
  `end_time` varchar(100) DEFAULT NULL,
  `status` tinyint(1) NOT NULL,
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stream_id` (`stream_id`),
  KEY `stream_id_2` (`stream_id`,`is_select_all`),
  KEY `channel_id` (`channel_id`),
  KEY `workspace_id` (`workspace_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `live_stream_logs`
--

CREATE TABLE IF NOT EXISTS `live_stream_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `channel_id` bigint NOT NULL,
  `request` json NOT NULL,
  `response` json NOT NULL,
  `stream_type` varchar(10) NOT NULL,
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `live_stream_webhook_logs`
--

CREATE TABLE IF NOT EXISTS `live_stream_webhook_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stream_id` varchar(255) NOT NULL,
  `data` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `login_details`
--

CREATE TABLE IF NOT EXISTS `login_details` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `contact_number` varchar(255) DEFAULT NULL,
  `sent_count` int NOT NULL DEFAULT '1',
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `email_token` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `login_logs`
--

CREATE TABLE IF NOT EXISTS `login_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `login_by` tinyint(1) NOT NULL COMMENT '1-FUGU,2-LPU',
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `login_by` (`login_by`),
  KEY `c_1` (`creation_datetime`),
  KEY `username` (`username`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=120 ;

-- --------------------------------------------------------

--
-- Table structure for table `log_exception`
--

CREATE TABLE IF NOT EXISTS `log_exception` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_details` json NOT NULL,
  `device_type` int NOT NULL,
  `error` json NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `updated` (`updated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Table structure for table `meet_call_logs`
--

CREATE TABLE IF NOT EXISTS `meet_call_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `domain` varchar(100) NOT NULL,
  `room_name` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_name` (`room_name`),
  KEY `domain` (`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `message_history`
--

CREATE TABLE IF NOT EXISTS `message_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `muid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `message` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `encrypted_message` varbinary(21000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `muid` (`muid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `message_journey`
--

CREATE TABLE IF NOT EXISTS `message_journey` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_journey` int NOT NULL,
  `role` enum('ADMIN','USER','BOTH') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'BOTH',
  `time_period` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Table structure for table `message_poll_options`
--

CREATE TABLE IF NOT EXISTS `message_poll_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `puid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `message_id` int NOT NULL,
  `poll_option` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `puid_message_id index` (`puid`,`message_id`),
  KEY `message_poll_optio_idx_message_id` (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `message_seen`
--

CREATE TABLE IF NOT EXISTS `message_seen` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `channel_id` int NOT NULL,
  `message_id` bigint DEFAULT NULL,
  `thread_message_id` int DEFAULT NULL,
  `channel_status` enum('JOIN','DEFAULT','LEFT') NOT NULL DEFAULT 'DEFAULT',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'used as message seen at',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user and thread message id` (`user_id`,`thread_message_id`),
  UNIQUE KEY `user and message id` (`user_id`,`message_id`,`channel_status`) USING BTREE,
  KEY `user message` (`user_id`,`channel_id`,`message_id`),
  KEY `user thread message` (`user_id`,`channel_id`,`thread_message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `user_unique_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `action_by_user_id` int NOT NULL,
  `action_by_user_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `action_by_user_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `channel_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `channel_id` int DEFAULT NULL,
  `chat_type` int DEFAULT NULL,
  `muid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `thread_muid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `notification_title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `app_secret_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `business_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `is_tagged` tinyint(1) DEFAULT '0',
  `notification_type` int NOT NULL DEFAULT '1',
  `counted` tinyint NOT NULL DEFAULT '1',
  `status` int NOT NULL DEFAULT '1',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `user unique key and channel id` (`user_unique_key`,`channel_id`),
  KEY `muid` (`muid`),
  KEY `for unique message in business` (`user_id`,`notification_type`,`is_tagged`,`app_secret_key`),
  KEY `thread_muid` (`thread_muid`),
  KEY `uq_us_rd_idx` (`user_unique_key`,`user_id`,`read_at`) USING BTREE,
  KEY `channel_id` (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `otp_steps`
--

CREATE TABLE IF NOT EXISTS `otp_steps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contact_number` varchar(100) NOT NULL,
  `step` tinyint(1) NOT NULL,
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `step` (`step`),
  KEY `creation_datetime` (`creation_datetime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_request`
--

CREATE TABLE IF NOT EXISTS `password_reset_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `expired` enum('YES','NO') NOT NULL DEFAULT 'NO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniqueResetToken` (`reset_token`),
  KEY `businessIdUserEmailEmailToken` (`user_id`,`expired`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `push_notifications`
--

CREATE TABLE IF NOT EXISTS `push_notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `domain_id` int DEFAULT NULL,
  `message_id` bigint DEFAULT NULL,
  `user_unique_key` varchar(255) DEFAULT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `device id index` (`device_id`),
  KEY `domain id` (`domain_id`),
  KEY `user unique key` (`user_unique_key`),
  KEY `dev,uniq,dom_idx` (`device_id`,`user_unique_key`,`domain_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `push_notification_logs`
--

CREATE TABLE IF NOT EXISTS `push_notification_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `channel_id` bigint DEFAULT NULL,
  `message_id` bigint DEFAULT NULL,
  `skipped` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ios_failed` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ios_success` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `android_failed` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `android_success` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  KEY `message_id` (`message_id`),
  KEY `channel_id` (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `razorpay_logs`
--

CREATE TABLE IF NOT EXISTS `razorpay_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `workspace_id` bigint NOT NULL,
  `amount` double NOT NULL,
  `user_count` bigint NOT NULL,
  `request` json DEFAULT NULL,
  `response` json NOT NULL,
  `event` varchar(20) NOT NULL,
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `razorpay_transactions`
--

CREATE TABLE IF NOT EXISTS `razorpay_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `domain_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `workspace_id` bigint NOT NULL,
  `order_id` varchar(100) NOT NULL,
  `user_count` int NOT NULL,
  `amount` double NOT NULL,
  `url` varchar(100) NOT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `secret_santa_messages`
--

CREATE TABLE IF NOT EXISTS `secret_santa_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `workspace_id` int DEFAULT NULL,
  `message` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `send_email`
--

CREATE TABLE IF NOT EXISTS `send_email` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message_id` int DEFAULT NULL,
  `thread_message_id` int DEFAULT NULL,
  `send_email_to_user_id` int NOT NULL,
  `send_message_email_count` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique` (`user_id`,`send_email_to_user_id`,`message_id`) USING BTREE,
  UNIQUE KEY `unique thread message send` (`user_id`,`thread_message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `signup_requests`
--

CREATE TABLE IF NOT EXISTS `signup_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `email` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `contact_number` varchar(32) DEFAULT NULL,
  `otp` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `is_expired` enum('YES','NO') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'NO',
  `sent_count` int DEFAULT '1',
  `is_otp_verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `tb_change_email_logs`
--

CREATE TABLE IF NOT EXISTS `tb_change_email_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `old_email` varchar(80) NOT NULL,
  `new_email` varchar(80) NOT NULL,
  `authentication` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `old_email` (`old_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `tb_custom_bot_events`
--

CREATE TABLE IF NOT EXISTS `tb_custom_bot_events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `event_name` varchar(155) NOT NULL,
  `level` tinyint NOT NULL COMMENT '0 - workspace, 1 - group, 3 - inbox',
  `level_name` varchar(155) NOT NULL,
  `description` varchar(155) NOT NULL,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `tb_custom_bot_tags`
--

CREATE TABLE IF NOT EXISTS `tb_custom_bot_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_id` int DEFAULT NULL,
  `workspace_id` int DEFAULT NULL,
  `tag` text,
  `input_parameter` text,
  `description` text,
  `redirect_url` text,
  `is_deleted` int DEFAULT '0',
  `chat_type` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tb_custom_bot_webhooks`
--

CREATE TABLE IF NOT EXISTS `tb_custom_bot_webhooks` (
  `webhook_id` int NOT NULL AUTO_INCREMENT,
  `app_id` int NOT NULL,
  `user_id` int NOT NULL,
  `channel_id` int NOT NULL,
  `workspace_id` int NOT NULL,
  `token` text NOT NULL,
  `webhook_url` varchar(225) DEFAULT NULL,
  `is_active` int NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`webhook_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `tb_domain_workspace_property`
--

CREATE TABLE IF NOT EXISTS `tb_domain_workspace_property` (
  `id` int NOT NULL AUTO_INCREMENT,
  `domain_id` int NOT NULL,
  `property` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tb_domain_workspace_property_ibfk_1` (`domain_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `tb_installed_custom_apps`
--

CREATE TABLE IF NOT EXISTS `tb_installed_custom_apps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bot_user_id` varchar(155) NOT NULL,
  `app_id` int NOT NULL,
  `workspace_id` int NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `app_state` enum('ACTIVE','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `subscribed_events` json DEFAULT NULL,
  `request_url` varchar(155) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  `interactive_url` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_key` (`bot_user_id`,`workspace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `tb_schedule_meetings`
--

CREATE TABLE IF NOT EXISTS `tb_schedule_meetings` (
  `meet_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `workspace_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `room_id` varchar(50) NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `reminder_time` int DEFAULT NULL,
  `reminder_datetime` timestamp NULL DEFAULT NULL,
  `meet_type` enum('JITSI','GOOGLE') NOT NULL DEFAULT 'JITSI',
  `frequency` tinyint NOT NULL COMMENT '1=Daily, 2=Weekly, 3=WeekDays, 4=Monthly',
  `active_days` json NOT NULL,
  `attendees` json NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '1 - deleted, 0 - not deleted',
  PRIMARY KEY (`meet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `tb_task_details`
--

CREATE TABLE IF NOT EXISTS `tb_task_details` (
  `task_id` bigint NOT NULL AUTO_INCREMENT,
  `workspace_id` int NOT NULL,
  `channel_id` bigint NOT NULL,
  `assigner_user_id` bigint NOT NULL,
  `title` text NOT NULL,
  `description` longtext NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `reminder` int DEFAULT NULL,
  `reminder_datetime` timestamp NULL DEFAULT NULL,
  `is_selected_all` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1: ALL 2: PARTIAL',
  `tagged_user` json DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`),
  KEY `workspace_id` (`workspace_id`),
  KEY `channel_id` (`channel_id`),
  KEY `assigner_user_id` (`assigner_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `tb_task_mapping`
--

CREATE TABLE IF NOT EXISTS `tb_task_mapping` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `task_id` bigint NOT NULL,
  `student_user_id` bigint NOT NULL,
  `content` longtext,
  `task_work` json DEFAULT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0: PENDING 1:DONE',
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `student_user_id` (`student_user_id`),
  KEY `is_completed` (`is_completed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `thread_user_messages`
--

CREATE TABLE IF NOT EXISTS `thread_user_messages` (
  `thread_message_id` bigint NOT NULL AUTO_INCREMENT,
  `message_id` bigint NOT NULL,
  `thread_muid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` int NOT NULL,
  `channel_id` int NOT NULL,
  `message` json NOT NULL,
  `encrypted_message` varbinary(31000) DEFAULT NULL,
  `searchable_encrypted_message` varbinary(31000) DEFAULT NULL,
  `message_type` tinyint NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '0-Deleted, 1-Not Deleted, 2-Missed Call, 3-Completed Call, 4-Message Edited',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `extra_varchar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `extra_int` int DEFAULT NULL COMMENT 'used as a extra column',
  PRIMARY KEY (`thread_message_id`),
  UNIQUE KEY `thread_muid` (`thread_muid`),
  KEY `created_at` (`created_at`),
  KEY `message_id` (`message_id`),
  KEY `channel_id,message_type` (`channel_id`,`message_type`) USING BTREE,
  KEY `thread_user_messag_idx_message_id_created_at` (`message_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `turn_configuration`
--

CREATE TABLE IF NOT EXISTS `turn_configuration` (
  `id` int NOT NULL AUTO_INCREMENT,
  `turn_api_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ice_servers` json NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `credential` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `turn_api_key` (`turn_api_key`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Dumping data for table `turn_configuration`
--

INSERT INTO `turn_configuration` (`id`, `turn_api_key`, `ice_servers`, `username`, `credential`) VALUES
(1, 'SameKeyInConfigAndDB', '{"stun": ["stun:turnserver.yourdomain.com:19305"], "turn": ["turn:turnserver.yourdomain.com:19305?transport=UDP", "turn:turnserver.yourdomain.com:19305?transport=TCP", "turns:turnserver.yourdomain.com:5349?transport=UDP", "turns:turnserver.yourdomain.com:5349?transport=TCP"]}', 'admin', 'credential');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL COMMENT 'varchar because of security reasons',
  `auth_user_id` int DEFAULT NULL,
  `full_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '',
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `email` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `contact_number` varchar(32) DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `user_image` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `user_thumbnail_image` varchar(255) NOT NULL DEFAULT '',
  `access_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `google_refresh_token` varchar(255) DEFAULT NULL,
  `notification_snooze_time` timestamp NULL DEFAULT NULL,
  `onboard_source` enum('FUGU','GOOGLE','APPLE') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'FUGU',
  `user_status` enum('INVITED','REGISTERED') DEFAULT NULL,
  `unread_notification_count` int NOT NULL DEFAULT '0',
  `attributes` json DEFAULT NULL,
  `user_properties` json DEFAULT NULL,
  `apple_user_identifier` varchar(255) DEFAULT NULL,
  `business_usecase` longtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `timezone` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email_temp` (`email`),
  UNIQUE KEY `contact_number` (`contact_number`),
  UNIQUE KEY `username unique` (`username`),
  KEY `accessTokenIndex` (`access_token`),
  KEY `notification index` (`notification_snooze_time`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `users_conversation`
--

CREATE TABLE IF NOT EXISTS `users_conversation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `muid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `workspace_id` int NOT NULL,
  `user_id` int NOT NULL,
  `channel_id` int DEFAULT NULL,
  `message` json NOT NULL,
  `encrypted_message` varbinary(31000) DEFAULT NULL,
  `searchable_encrypted_message` varbinary(31000) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '0-Deleted, 1-Not Deleted, 2-Missed Call, 3-Completed Call, 4-Message Edited',
  `user_type` tinyint DEFAULT NULL,
  `message_type` tinyint DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `extra_varchar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `extra_int` int DEFAULT NULL COMMENT 'used as a extra column',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_user_id` (`id`,`user_id`),
  UNIQUE KEY `muid` (`muid`),
  KEY `created_at` (`created_at`),
  KEY `user_id` (`user_id`),
  KEY `workspace_id_channel_id` (`workspace_id`,`channel_id`),
  KEY `ch,w_id` (`channel_id`,`workspace_id`),
  KEY `w_id,ch_id,m_type` (`workspace_id`,`channel_id`,`message_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

--
-- Triggers `users_conversation`
--
DROP TRIGGER IF EXISTS `latest_channel_message_id`;
DELIMITER //
CREATE TRIGGER `latest_channel_message_id` AFTER INSERT ON `users_conversation`
 FOR EACH ROW INSERT INTO channel_latest_message(channel_id,message_id) 
VALUES 
   (NEW.channel_id,NEW.id) 
ON DUPLICATE KEY UPDATE message_id = NEW.id
//
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user_devices`
--

CREATE TABLE IF NOT EXISTS `user_devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workspace_id` int NOT NULL,
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `device_type` enum('ANDROID','IOS','WEB') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'WEB',
  `device_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `online_status` enum('ONLINE','OFFLINE','AWAY') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'ONLINE',
  `device_details` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `business_id` (`workspace_id`,`device_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_device_details`
--

CREATE TABLE IF NOT EXISTS `user_device_details` (
  `user_id` int NOT NULL COMMENT 'User id of fugu user',
  `device_details` json DEFAULT NULL,
  `device_id` varchar(255) NOT NULL DEFAULT '0',
  `token` varchar(255) DEFAULT NULL,
  `voip_token` varchar(255) DEFAULT NULL,
  `web_token_status` tinyint DEFAULT '0',
  `device_type` enum('ANDROID','IOS','WEB') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user_disable_logs`
--

CREATE TABLE IF NOT EXISTS `user_disable_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_unique_key` varchar(20) NOT NULL,
  `disabled_in_workspaces` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user_feedback`
--

CREATE TABLE IF NOT EXISTS `user_feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `feedback` text,
  `extra_details` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `workspace_id` int DEFAULT NULL,
  `type` enum('HELP','VIDEO_CONFERENCE','VIDEO_CALL','AUDIO_CALL') NOT NULL DEFAULT 'HELP',
  `rating` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `user_invitations`
--

CREATE TABLE IF NOT EXISTS `user_invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workspace_id` int NOT NULL,
  `invited_by` int DEFAULT NULL,
  `email` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `contact_number` varchar(255) DEFAULT NULL,
  `invitation_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('EXPIRED','NOT_EXPIRED','RE_INVITED','REVOKED') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'NOT_EXPIRED',
  `type` enum('USER','GUEST') NOT NULL DEFAULT 'USER',
  `sent_count` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at_backup` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expired_backup` enum('YES','NO') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'NO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `business_id` (`workspace_id`,`email`),
  UNIQUE KEY `UNIQUE INVIATION CONTACT NUMBER` (`workspace_id`,`contact_number`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_message_poll`
--

CREATE TABLE IF NOT EXISTS `user_message_poll` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message_id` int NOT NULL,
  `puid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`,`puid`,`user_id`),
  UNIQUE KEY `id` (`id`),
  KEY `user_message_poll_idx_status_puid` (`status`,`puid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_message_reaction`
--

CREATE TABLE IF NOT EXISTS `user_message_reaction` (
  `user_reaction_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message_id` int NOT NULL,
  `user_reaction` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`,`user_id`),
  UNIQUE KEY `reaction_id` (`user_reaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_present_day_status`
--

CREATE TABLE IF NOT EXISTS `user_present_day_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leave_id` int NOT NULL,
  `fugu_user_id` int NOT NULL,
  `start_date` date NOT NULL,
  `days` int NOT NULL,
  `leave_type` enum('ABSENT','WORK_FROM_HOME') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fugu_user_id` (`fugu_user_id`),
  KEY `user_present_day_s_idx_fugu_id_days` (`fugu_user_id`,`days`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_status`
--

CREATE TABLE IF NOT EXISTS `user_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fugu_user_id` int NOT NULL,
  `days` int DEFAULT NULL,
  `status` enum('ENABLED','DISABLED','LEFT') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_thread_message_reaction`
--

CREATE TABLE IF NOT EXISTS `user_thread_message_reaction` (
  `user_reaction_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `thread_message_id` int NOT NULL,
  `user_reaction` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`thread_message_id`,`user_id`),
  UNIQUE KEY `reaction_id` (`user_reaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_to_channel`
--

CREATE TABLE IF NOT EXISTS `user_to_channel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `channel_id` int DEFAULT NULL,
  `role` enum('ADMIN','USER') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'USER',
  `last_message_id` int NOT NULL DEFAULT '0' COMMENT 'last message id of chat upto which chat cleared by user',
  `last_read_message_id` int DEFAULT NULL COMMENT 'last message read id',
  `last_message_read_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'last message read time',
  `is_pinned` tinyint NOT NULL DEFAULT '0',
  `is_unread` int NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '0-In Active, 1-Active, 2-Blocked',
  `last_activity` timestamp NULL DEFAULT NULL,
  `notification` enum('MUTED','UNMUTED','DIRECT_MENTIONS') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'UNMUTED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`channel_id`) USING BTREE,
  KEY `channel_id` (`channel_id`),
  KEY `last_read_message_id` (`last_read_message_id`),
  KEY `user_id_index` (`user_id`),
  KEY `last_activity` (`last_activity`),
  KEY `pin chat` (`is_pinned`),
  KEY `user_to_channel_idx_user_id_status` (`user_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_to_message`
--

CREATE TABLE IF NOT EXISTS `user_to_message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message_id` bigint DEFAULT NULL,
  `thread_message_id` bigint DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `is_starred` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`message_id`),
  UNIQUE KEY `Unique for user to thread message` (`user_id`,`thread_message_id`),
  KEY `status` (`status`),
  KEY `message_id` (`message_id`),
  KEY `userId and Starred message` (`user_id`,`is_starred`),
  KEY `tmuid_idx` (`thread_message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_to_workspace`
--

CREATE TABLE IF NOT EXISTS `user_to_workspace` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `workspace_id` int NOT NULL DEFAULT '0',
  `business_id` int DEFAULT NULL,
  `user_unique_key` varchar(30) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `full_name` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT '',
  `user_image` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT '',
  `user_thumbnail_image` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT '',
  `image_set` json DEFAULT NULL,
  `department` varchar(40) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT '',
  `designation` varchar(40) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT '',
  `manager` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT '',
  `user_type` int DEFAULT NULL,
  `manager_fugu_user_id` int DEFAULT NULL,
  `unread_notification_count` int NOT NULL DEFAULT '0',
  `last_seen` bigint DEFAULT NULL,
  `whats_new_status` int NOT NULL DEFAULT '0',
  `emails` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `contact_number` varchar(25) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT '',
  `location` varchar(80) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT '',
  `user_properties` json DEFAULT NULL,
  `auto_download_level` enum('NONE','WIFI','MOBILE_NETWORK','BOTH') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'WIFI',
  `notification_level` enum('ALL_CHATS','DIRECT_MESSAGES','NONE') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'ALL_CHATS',
  `gallery_media_visibility` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('ENABLED','DISABLED','LEFT','INVITED') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'ENABLED',
  `role` enum('OWNER','ADMIN','USER','GUEST') CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT 'USER',
  `message_journey_status` int NOT NULL DEFAULT '0',
  `accepted_policies` enum('YES','NO') CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT 'NO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `unique_key` (`user_unique_key`,`workspace_id`),
  KEY `full_name_index` (`full_name`),
  KEY `workspace_id_index` (`workspace_id`),
  KEY `user_to_workspace_idx_workspace_id_user_id` (`workspace_id`,`user_id`),
  KEY `role_wid_status_idx` (`role`,`workspace_id`,`status`) USING BTREE,
  KEY `user_to_workspace_idx_workspace_id_role` (`workspace_id`,`role`),
  KEY `workspace_id_user_type` (`workspace_id`,`user_type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `webhooks`
--

CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `channel_id` int NOT NULL,
  `installed_app_id` int NOT NULL,
  `webhook_link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_by_user_id` int DEFAULT NULL,
  `hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `token` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `model_id` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `webhook_id` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `whats_new_feature`
--

CREATE TABLE IF NOT EXISTS `whats_new_feature` (
  `id` int NOT NULL AUTO_INCREMENT,
  `heading` varchar(255) NOT NULL,
  `description` varchar(10000) NOT NULL,
  `role` int DEFAULT NULL,
  `status` int NOT NULL DEFAULT '0',
  `date` date NOT NULL,
  `link_text` varchar(255) NOT NULL,
  `link` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `workspace_details`
--

CREATE TABLE IF NOT EXISTS `workspace_details` (
  `workspace_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `workspace_name` varchar(255) NOT NULL,
  `workspace` varchar(255) NOT NULL,
  `image` json DEFAULT NULL,
  `app_name` varchar(255) DEFAULT NULL,
  `status` enum('ENABLED','DISABLED','EXPIRED','USER_BASED_TRIAL','PERIOD_BASED_TRIAL') NOT NULL DEFAULT 'USER_BASED_TRIAL',
  `fugu_secret_key` varchar(255) DEFAULT ' ',
  `attendance_token` varchar(255) DEFAULT NULL,
  `scrum_token` varchar(255) DEFAULT NULL,
  `tookan_user_id` int DEFAULT NULL,
  `int_bus` enum('OUT','INS','CLIENT') NOT NULL DEFAULT 'OUT',
  `hrm_api_key` varchar(255) DEFAULT NULL,
  `hrm_configuration` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `logo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `fav_icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `colors` json DEFAULT NULL,
  `domain_id` int DEFAULT NULL,
  `default_manager_fugu_user_id` int DEFAULT NULL,
  PRIMARY KEY (`workspace_id`),
  UNIQUE KEY `uniquedomain` (`workspace`,`domain_id`) USING BTREE,
  KEY `int_bus` (`int_bus`),
  KEY `fugu_secret_key` (`fugu_secret_key`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 ROW_FORMAT=COMPACT AUTO_INCREMENT=1 ;

--
-- Dumping data for table `workspace_details`
--

INSERT INTO `workspace_details` (`workspace_id`, `email`, `workspace_name`, `workspace`, `image`, `app_name`, `status`, `fugu_secret_key`, `attendance_token`, `scrum_token`, `tookan_user_id`, `int_bus`, `hrm_api_key`, `hrm_configuration`, `logo`, `fav_icon`, `colors`, `domain_id`, `default_manager_fugu_user_id`) VALUES
(1, 'Spaces', 'Spaces', 'spaces', NULL, 'FuguChat', 'ENABLED', 'f68a8ab14a5sddfead61819712efcs', NULL, NULL, NULL, 'OUT', NULL, NULL, 'https://s3.fugu.chat/default/sZvTOV2eV2.1587384673069.png', 'https://fuguchat.s3.ap-south-1.amazonaws.com/image/W0CNR0d3ar.1549345286736.png', '{"icon_color": "#BF1A8D", "theme_color": "#BF1A8D", "header_color": "#BF1A8D", "loader_color": "#BF1A8D", "scroll_color": "#BF1A8D", "theme_color_light": "#e6f0f9", "date_divider_color": "#e1f5fe", "app_color_highlight": "#e6f0f9", "sender_chat_bubble_color": "#ECF4FB"}', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `workspace_invite_allowed`
--

CREATE TABLE IF NOT EXISTS `workspace_invite_allowed` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `workspace_id` bigint NOT NULL,
  `invite_allowed` bigint NOT NULL,
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `workspace_id` (`workspace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `workspace_open_invites`
--

CREATE TABLE IF NOT EXISTS `workspace_open_invites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workspace_id` int NOT NULL,
  `email_domain` varchar(255) NOT NULL,
  `status` enum('ENABLED','DISABLED') NOT NULL DEFAULT 'ENABLED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `workspace_id` (`workspace_id`,`email_domain`),
  KEY `allowed_workspace` (`email_domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `workspace_property`
--

CREATE TABLE IF NOT EXISTS `workspace_property` (
  `workspace_id` int NOT NULL COMMENT ' -1 public accessible , 0 business accessible ',
  `property` varchar(100) NOT NULL,
  `value` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`workspace_id`,`property`),
  KEY `business_id` (`workspace_id`),
  KEY `property` (`property`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `workspace_property`
--

INSERT INTO `workspace_property` (`workspace_id`, `property`, `value`, `updated_at`) VALUES
(0, 'any_user_can_invite', '1', '2021-08-02 12:40:24'),
(0, 'audio_call_enabled', '1', '2021-08-02 12:40:24'),
(0, 'clear_chat_history', '1', '2021-08-02 12:40:24'),
(0, 'create_conference_roles', '["ADMIN", "OWNER"]', '2021-08-02 12:40:24'),
(0, 'create_meet_permission', '["ADMIN","OWNER","USER","GUEST","PAYING_GUEST"]', '2021-08-02 12:40:24'),
(0, 'create_workspace_permission', '["ADMIN","OWNER","USER"]', '2021-08-02 12:40:24'),
(0, 'delete_message', '1', '2021-08-02 12:40:24'),
(0, 'delete_message_duration', '900', '2021-08-02 12:40:24'),
(0, 'delete_message_role', '["ADMIN","OWNER","USER","GUEST","PAYING_GUEST"]', '2021-08-02 12:40:24'),
(0, 'edit_message', '1', '2021-08-02 12:40:24'),
(0, 'edit_message_duration', '900', '2021-08-02 12:40:24'),
(0, 'edit_message_role', '["ADMIN","OWNER","USER","GUEST","PAYING_GUEST"]', '2021-08-02 12:40:24'),
(0, 'enable_create_group', '["ADMIN","OWNER","USER","GUEST","PAYING_GUEST"]', '2021-08-02 12:40:24'),
(0, 'enable_one_to_one_chat', '["ADMIN","OWNER","USER","GUEST","PAYING_GUEST"]', '2021-08-02 12:40:24'),
(0, 'enable_public_invite', '0', '2021-08-02 12:40:24'),
(0, 'free_invite', '2', '2021-08-02 12:40:24'),
(0, 'fugu_bot', '["ADMIN","OWNER","USER"]', '2021-08-02 12:40:24'),
(0, 'hide_contact_number', '0', '2021-08-02 12:40:24'),
(0, 'hide_email', '0', '2021-08-02 12:40:24'),
(0, 'is_google_meet_enabled', 'true', '2021-08-02 12:40:24'),
(0, 'is_guest_allowed', '1', '2021-08-02 12:40:24'),
(0, 'is_secret_santa_enabled', '1', '2021-08-02 12:40:24'),
(0, 'livestream_permission', NULL, '2021-08-02 12:40:24'),
(0, 'max_conference_participants', '20', '2021-08-02 12:40:24'),
(0, 'max_member_in_group', '0', '2021-08-02 12:40:24'),
(0, 'per_user_invite_price', '25', '2021-08-02 12:40:24'),
(0, 'poll_enabled', '1', '2021-08-02 12:40:24'),
(0, 'punch_in_permission', 'NONE', '2021-08-02 12:40:24'),
(0, 'punch_out_permission', 'NONE', '2021-08-02 12:40:24'),
(0, 'search_message', '1', '2021-08-02 12:40:24'),
(0, 'signup_mode', '1', '2021-08-02 12:40:24'),
(0, 'video_call_enabled', '1', '2021-08-02 12:40:24');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tb_domain_workspace_property`
--
ALTER TABLE `tb_domain_workspace_property`
  ADD CONSTRAINT `tb_domain_workspace_property_ibfk_1` FOREIGN KEY (`domain_id`) REFERENCES `domain_credentials` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
