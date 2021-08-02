-- phpMyAdmin SQL Dump
-- version 4.0.10.20
-- https://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 04, 2021 at 02:40 PM
-- Server version: 8.0.26
-- PHP Version: 5.3.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `scrum_prod`
--

-- --------------------------------------------------------

--
-- Table structure for table `answer`
--

CREATE TABLE IF NOT EXISTS `answer` (
  `answer_id` int NOT NULL AUTO_INCREMENT,
  `run_now_id` int DEFAULT NULL,
  `scrum_user_id` int NOT NULL,
  `question_id` int NOT NULL,
  `answer` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`answer_id`),
  KEY `FOREIGN KEY2` (`question_id`),
  KEY `foreign key 3` (`scrum_user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `business`
--

CREATE TABLE IF NOT EXISTS `business` (
  `business_id` int NOT NULL AUTO_INCREMENT,
  `reseller_id` int NOT NULL DEFAULT '1',
  `business_token` varchar(255) NOT NULL,
  `time_zone` int NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`business_id`),
  KEY `FOREIGN KEY10` (`reseller_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `question`
--

CREATE TABLE IF NOT EXISTS `question` (
  `question_id` int NOT NULL AUTO_INCREMENT,
  `scrum_id` int NOT NULL,
  `question` text NOT NULL,
  `question_status` int NOT NULL DEFAULT '1',
  `question_position` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`),
  KEY `FOREIGN KEY21` (`scrum_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `run_now_timings`
--

CREATE TABLE IF NOT EXISTS `run_now_timings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `scrum_id` int NOT NULL,
  `run_now_time` time NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `scrum_details`
--

CREATE TABLE IF NOT EXISTS `scrum_details` (
  `business_id` int NOT NULL,
  `scrum_name` varchar(100) NOT NULL,
  `scrum_id` int NOT NULL AUTO_INCREMENT,
  `manager_user_id` int NOT NULL,
  `start_day` date NOT NULL,
  `time_zone` int NOT NULL,
  `start_time` time NOT NULL,
  `active_days` json NOT NULL,
  `frequency` int NOT NULL COMMENT '0-non-recurrent , 1-every-week , 2-every 2 week , 3- every 3 week , 4- every 4 week',
  `next_scrum_date` date NOT NULL,
  `respondants` json NOT NULL,
  `welcome_message` varchar(255) NOT NULL,
  `scrum_time` int NOT NULL,
  `end_time_reminder` int NOT NULL,
  `end_time_text` varchar(150) DEFAULT NULL,
  `delivering_result_to_users` json NOT NULL,
  `delivering_result_to_channels` varchar(150) DEFAULT NULL,
  `scrum_status` enum('ACTIVE','DISABLED','PAUSED','RUNNING') NOT NULL DEFAULT 'ACTIVE',
  `run_now_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`scrum_id`),
  KEY `FOREIGN KEY` (`business_id`),
  KEY `Foreign key 15` (`manager_user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `scrum_user_id` int NOT NULL AUTO_INCREMENT,
  `manager_user_id` int DEFAULT NULL,
  `business_id` int NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `user_id` varchar(11) NOT NULL,
  `availability` int NOT NULL DEFAULT '1',
  `status` int NOT NULL DEFAULT '1',
  `role` enum('ADMIN','OWNER','USER','') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`scrum_user_id`),
  UNIQUE KEY `user_name` (`user_id`) USING BTREE,
  KEY `FOREIGN KEY13` (`business_id`),
  KEY `Foreign key 14` (`manager_user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=1 ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `answer`
--
ALTER TABLE `answer`
  ADD CONSTRAINT `foreign key 3` FOREIGN KEY (`scrum_user_id`) REFERENCES `users` (`scrum_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FOREIGN KEY2` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `question`
--
ALTER TABLE `question`
  ADD CONSTRAINT `FOREIGN KEY21` FOREIGN KEY (`scrum_id`) REFERENCES `scrum_details` (`scrum_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `scrum_details`
--
ALTER TABLE `scrum_details`
  ADD CONSTRAINT `FOREIGN KEY` FOREIGN KEY (`business_id`) REFERENCES `business` (`business_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Foreign key 15` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`scrum_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `Foreign key 14` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`scrum_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FOREIGN KEY13` FOREIGN KEY (`business_id`) REFERENCES `business` (`business_id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
