-- phpMyAdmin SQL Dump
-- version 4.0.10.20
-- https://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 04, 2021 at 02:42 PM
-- Server version: 8.0.26
-- PHP Version: 5.3.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `attendance_prod`
--

-- --------------------------------------------------------

--
-- Table structure for table `business`
--

CREATE TABLE IF NOT EXISTS `business` (
  `business_id` int NOT NULL AUTO_INCREMENT,
  `reseller_id` int DEFAULT '1',
  `business_name` varchar(255) DEFAULT NULL,
  `business_token` varchar(255) NOT NULL,
  `business_area` multipolygon DEFAULT NULL,
  `multi_business_area` multipolygon DEFAULT NULL,
  `business_area_backup` polygon DEFAULT NULL,
  `config` json DEFAULT NULL,
  `time_zone` int NOT NULL DEFAULT '0',
  `session_start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `session_end` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `auto_punch_out` int DEFAULT NULL,
  `admin_roles` json DEFAULT NULL,
  `hr_roles` json DEFAULT NULL,
  `work_days` json DEFAULT NULL,
  `work_start_time` time DEFAULT NULL,
  `work_hours` int DEFAULT '540',
  `lunch_duration` int DEFAULT NULL,
  `punch_in_reminder_time` int DEFAULT NULL,
  `punch_out_reminder_time` int NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`business_id`),
  KEY `punch_in_reminder_time` (`punch_in_reminder_time`),
  KEY `punch_out_reminder_time` (`punch_out_reminder_time`),
  KEY `business_idx_business_id_punch_time` (`business_id`,`punch_in_reminder_time`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `business_leave_properties`
--

CREATE TABLE IF NOT EXISTS `business_leave_properties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `synonyms` json DEFAULT NULL,
  `annual_count` float NOT NULL DEFAULT '-1',
  `accrual_interval` enum('ANNUALLY','HALF_YEARLY','QUARTERLY','MONTHLY') NOT NULL DEFAULT 'ANNUALLY',
  `max_annual_rollover` float NOT NULL DEFAULT '0',
  `is_negative_leave_allowed` int NOT NULL DEFAULT '1',
  `accrual_months` float NOT NULL DEFAULT '12',
  `is_clock_in_allowed` int NOT NULL DEFAULT '0',
  `last_increamented` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `status` int NOT NULL DEFAULT '1',
  `initial_leave_balance` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `business_property`
--

CREATE TABLE IF NOT EXISTS `business_property` (
  `business_id` int NOT NULL COMMENT ' -1 public accessible , 0 business accessible ',
  `property` varchar(100) NOT NULL,
  `value` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`business_id`,`property`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `change_manager_request`
--

CREATE TABLE IF NOT EXISTS `change_manager_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `current_manager_user_id` int DEFAULT NULL,
  `new_manager_user_id` int NOT NULL,
  `status` enum('REQUESTED','APPROVED','REJECTED') NOT NULL DEFAULT 'REQUESTED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `dates`
--

CREATE TABLE IF NOT EXISTS `dates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `date` (`date`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `manager_user_id` int DEFAULT NULL,
  `business_id` int NOT NULL,
  `employee_id` varchar(255) DEFAULT '',
  `user_name` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `password` varchar(255) CHARACTER SET utf16 COLLATE utf16_general_ci NOT NULL DEFAULT '',
  `role` enum('USER','HR','OWNER','ADMIN') NOT NULL DEFAULT 'USER',
  `config` json DEFAULT NULL,
  `auth_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `time_zone` int NOT NULL DEFAULT '300',
  `shift_start_time` time DEFAULT NULL,
  `shift_end_time` time DEFAULT NULL,
  `auth_user_image_url` varchar(255) DEFAULT NULL,
  `work_hours` float DEFAULT NULL,
  `work_days` json DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `status` int NOT NULL DEFAULT '1',
  `leaves` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_name _email` (`user_id`,`email`),
  UNIQUE KEY `user_name` (`user_name`),
  KEY `business id` (`business_id`),
  KEY `users_idx_status_user_id` (`status`,`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_attendance`
--

CREATE TABLE IF NOT EXISTS `user_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `clocked_out` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `created at` (`created_at`),
  KEY `clocked_out_idx` (`clocked_out`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

--
-- Triggers `user_attendance`
--
DROP TRIGGER IF EXISTS `update user latest punchin`;
DELIMITER //
CREATE TRIGGER `update user latest punchin` AFTER INSERT ON `user_attendance`
 FOR EACH ROW INSERT INTO user_last_punchin(user_id, punchin_time) VALUES(NEW.user_id, NEW.created_at)
ON DUPLICATE KEY UPDATE punchin_time = NEW.created_at
//
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user_last_punchin`
--

CREATE TABLE IF NOT EXISTS `user_last_punchin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `punchin_time` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `user_ids_punch` (`user_id`,`punchin_time`),
  KEY `punchin_time` (`punchin_time`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_leaves`
--

CREATE TABLE IF NOT EXISTS `user_leaves` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `count` float NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id type` (`user_id`,`leave_type_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_leave_requests`
--

CREATE TABLE IF NOT EXISTS `user_leave_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `days` float NOT NULL,
  `type` enum('CASUAL','EARNED','SICK') NOT NULL DEFAULT 'CASUAL',
  `leave_type_id` int DEFAULT NULL,
  `leave_phase` enum('FULL_DAY','FIRST_HALF','SECOND_HALF','') NOT NULL DEFAULT 'FULL_DAY',
  `approved_by` int DEFAULT NULL,
  `status` enum('REQUESTED','APPROVED','REJECTED','CANCELLED','DISMISSED') DEFAULT 'REQUESTED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `start date` (`start_date`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user_location`
--

CREATE TABLE IF NOT EXISTS `user_location` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(80) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `webhooks`
--

CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `link` text NOT NULL,
  `type` enum('LEAVE_APPROVED','LEAVE_DISMISSED','LEAVE_REJECTED') NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
