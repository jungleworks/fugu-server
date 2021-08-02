-- phpMyAdmin SQL Dump
-- version 4.0.10.20
-- https://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 04, 2021 at 02:34 PM
-- Server version: 8.0.26
-- PHP Version: 5.3.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `fugu_auth`
--

-- --------------------------------------------------------

--
-- Table structure for table `tb_app_types`
--

CREATE TABLE IF NOT EXISTS `tb_app_types` (
  `app_id` bigint NOT NULL AUTO_INCREMENT,
  `app_type` int NOT NULL,
  `app_name` varchar(255) NOT NULL,
  `is_app` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`app_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=7 ;

--
-- Dumping data for table `tb_app_types`
--

INSERT INTO `tb_app_types` (`app_id`, `app_type`, `app_name`, `is_app`) VALUES
(3, 0, 'agent', 1),
(4, 1, 'customer', 1),
(5, 2, 'manager', 1),
(6, 3, 'dashboard', 0),
(7, 4, 'backend', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tb_continents`
--

CREATE TABLE IF NOT EXISTS `tb_continents` (
  `continent_id` bigint NOT NULL AUTO_INCREMENT,
  `continent_code` varchar(255) NOT NULL,
  PRIMARY KEY (`continent_id`),
  UNIQUE KEY `unique_continent` (`continent_code`(10))
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `tb_continents`
--

INSERT INTO `tb_continents` (`continent_id`, `continent_code`) VALUES
(1, 'AF'),
(2, 'AN'),
(3, 'AS'),
(4, 'EU'),
(5, 'NA'),
(6, 'OC'),
(7, 'SA'),
(8, 'default');

-- --------------------------------------------------------

--
-- Table structure for table `tb_countries`
--

CREATE TABLE IF NOT EXISTS `tb_countries` (
  `country_id` bigint NOT NULL AUTO_INCREMENT,
  `continent_id` bigint NOT NULL,
  `country_code` varchar(255) NOT NULL,
  `country_name` varchar(40) NOT NULL,
  PRIMARY KEY (`country_id`),
  UNIQUE KEY `unique_country_continent` (`continent_id`,`country_code`(10))
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=501 ;

--
-- Dumping data for table `tb_countries`
--

INSERT INTO `tb_countries` (`country_id`, `continent_id`, `country_code`, `country_name`) VALUES
(252, 1, 'AO', 'Angola'),
(253, 1, 'BF', 'Burkina Faso'),
(254, 1, 'BI', 'Burundi'),
(255, 1, 'BJ', 'Benin'),
(256, 1, 'BW', 'Botswana'),
(257, 1, 'CD', 'Congo, the Democratic Republic of the'),
(258, 1, 'CF', 'Central African Republic'),
(259, 1, 'CG', 'Congo'),
(260, 1, 'CI', 'Côte d''Ivoire'),
(261, 1, 'CM', 'Cameroon'),
(262, 1, 'CV', 'Cape Verde'),
(263, 1, 'DJ', 'Djibouti'),
(264, 1, 'DZ', 'Algeria'),
(265, 1, 'EG', 'Egypt'),
(266, 1, 'EH', 'Western Sahara'),
(267, 1, 'ER', 'Eritrea'),
(268, 1, 'ET', 'Ethiopia'),
(269, 1, 'GA', 'Gabon'),
(270, 1, 'GH', 'Ghana'),
(271, 1, 'GM', 'Gambia'),
(272, 1, 'GN', 'Guinea'),
(273, 1, 'GQ', 'Equatorial Guinea'),
(274, 1, 'GW', 'Guinea-Bissau'),
(275, 1, 'KE', 'Kenya'),
(276, 1, 'KM', 'Comoros'),
(277, 1, 'LR', 'Liberia'),
(278, 1, 'LS', 'Lesotho'),
(279, 1, 'LY', 'Libya'),
(280, 1, 'MA', 'Morocco'),
(281, 1, 'MG', 'Madagascar'),
(282, 1, 'ML', 'Mali'),
(283, 1, 'MR', 'Mauritania'),
(284, 1, 'MU', 'Mauritius'),
(285, 1, 'MW', 'Malawi'),
(286, 1, 'MZ', 'Mozambique'),
(287, 1, 'NA', 'Namibia'),
(288, 1, 'NE', 'Niger'),
(289, 1, 'NG', 'Nigeria'),
(290, 1, 'RE', 'Réunion'),
(291, 1, 'RW', 'Rwanda'),
(292, 1, 'SC', 'Seychelles'),
(293, 1, 'SD', 'Sudan'),
(294, 1, 'SH', 'Saint Helena, Ascension and Tristan da C'),
(295, 1, 'SL', 'Sierra Leone'),
(296, 1, 'SN', 'Senegal'),
(297, 1, 'SO', 'Somalia'),
(298, 1, 'ST', 'Sao Tome and Principe'),
(299, 1, 'SZ', 'Swaziland'),
(300, 1, 'TD', 'Chad'),
(301, 1, 'TG', 'Togo'),
(302, 1, 'TN', 'Tunisia'),
(303, 1, 'TZ', 'Tanzania, United Republic of'),
(304, 1, 'UG', 'Uganda'),
(305, 1, 'YT', 'Mayotte'),
(306, 1, 'ZA', 'South Africa'),
(307, 1, 'ZM', 'Zambia'),
(308, 1, 'ZW', 'Zimbabwe'),
(309, 2, 'AQ', 'Antarctica'),
(310, 2, 'BV', 'Bouvet Island'),
(311, 2, 'GS', 'South Georgia and the South Sandwich Isl'),
(312, 2, 'HM', 'Heard Island and McDonald Islands'),
(313, 2, 'TF', 'French Southern Territories'),
(314, 3, 'AE', 'United Arab Emirates'),
(315, 3, 'AF', 'Afghanistan'),
(316, 3, 'AM', 'Armenia'),
(317, 3, 'AP', 'African Region Organization'),
(318, 3, 'AZ', 'Azerbaijan'),
(319, 3, 'BD', 'Bangladesh'),
(320, 3, 'BH', 'Bahrain'),
(321, 3, 'BN', 'Brunei Darussalam'),
(322, 3, 'BT', 'Bhutan'),
(323, 3, 'CC', 'Cocos (Keeling) Islands'),
(324, 3, 'CN', 'China'),
(325, 3, 'CX', 'Christmas Island'),
(326, 3, 'CY', 'Cyprus'),
(327, 3, 'GE', 'Georgia'),
(328, 3, 'HK', 'Hong Kong'),
(329, 3, 'ID', 'Indonesia'),
(330, 3, 'IL', 'Israel'),
(331, 3, 'IN', 'India'),
(332, 3, 'IO', 'British Indian Ocean Territory'),
(333, 3, 'IQ', 'Iraq'),
(334, 3, 'IR', 'Iran, Islamic Republic of'),
(335, 3, 'JO', 'Jordan'),
(336, 3, 'JP', 'Japan'),
(337, 3, 'KG', 'Kyrgyzstan'),
(338, 3, 'KH', 'Cambodia'),
(339, 3, 'KP', 'Korea, Democratic People''s Republic of'),
(340, 3, 'KR', 'Korea, Republic of'),
(341, 3, 'KW', 'Kuwait'),
(342, 3, 'KZ', 'Kazakhstan'),
(343, 3, 'LA', 'Lao People''s Democratic Republic'),
(344, 3, 'LB', 'Lebanon'),
(345, 3, 'LK', 'Sri Lanka'),
(346, 3, 'MM', 'Myanmar'),
(347, 3, 'MN', 'Mongolia'),
(348, 3, 'MO', 'Macao'),
(349, 3, 'MV', 'Maldives'),
(350, 3, 'MY', 'Malaysia'),
(351, 3, 'NP', 'Nepal'),
(352, 3, 'OM', 'Oman'),
(353, 3, 'PH', 'Philippines'),
(354, 3, 'PK', 'Pakistan'),
(355, 3, 'PS', 'Palestine, State of'),
(356, 3, 'QA', 'Qatar'),
(357, 3, 'SA', 'Saudi Arabia'),
(358, 3, 'SG', 'Singapore'),
(359, 3, 'SY', 'Syrian Arab Republic'),
(360, 3, 'TH', 'Thailand'),
(361, 3, 'TJ', 'Tajikistan'),
(362, 3, 'TL', 'Timor-Leste'),
(363, 3, 'TM', 'Turkmenistan'),
(364, 3, 'TW', 'Taiwan, Province of China'),
(365, 3, 'UZ', 'Uzbekistan'),
(366, 3, 'VN', 'Viet Nam'),
(367, 3, 'YE', 'Yemen'),
(368, 4, 'AD', 'Andorra'),
(369, 4, 'AL', 'Albania'),
(370, 4, 'AT', 'Austria'),
(371, 4, 'AX', 'Aland Islands'),
(372, 4, 'BA', 'Bosnia and Herzegovina'),
(373, 4, 'BE', 'Belgium'),
(374, 4, 'BG', 'Bulgaria'),
(375, 4, 'BY', 'Belarus'),
(376, 4, 'CH', 'Switzerland'),
(377, 4, 'CZ', 'Czech Republic'),
(378, 4, 'DE', 'Germany'),
(379, 4, 'DK', 'Denmark'),
(380, 4, 'EE', 'Estonia'),
(381, 4, 'ES', 'Spain'),
(382, 4, 'EU', 'European Union'),
(383, 4, 'FI', 'Finland'),
(384, 4, 'FO', 'Faroe Islands'),
(385, 4, 'FR', 'France'),
(386, 4, 'FX', 'France Metropolitian'),
(387, 4, 'GB', 'United Kingdom'),
(388, 4, 'GG', 'Guernsey'),
(389, 4, 'GI', 'Gibraltar'),
(390, 4, 'GR', 'Greece'),
(391, 4, 'HR', 'Croatia'),
(392, 4, 'HU', 'Hungary'),
(393, 4, 'IE', 'Ireland'),
(394, 4, 'IM', 'Isle of Man'),
(395, 4, 'IS', 'Iceland'),
(396, 4, 'IT', 'Italy'),
(397, 4, 'JE', 'Jersey'),
(398, 4, 'LI', 'Liechtenstein'),
(399, 4, 'LT', 'Lithuania'),
(400, 4, 'LU', 'Luxembourg'),
(401, 4, 'LV', 'Latvia'),
(402, 4, 'MC', 'Monaco'),
(403, 4, 'MD', 'Moldova, Republic of'),
(404, 4, 'ME', 'Montenegro'),
(405, 4, 'MK', 'Macedonia, the Former Yugoslav Republic '),
(406, 4, 'MT', 'Malta'),
(407, 4, 'NL', 'Netherlands'),
(408, 4, 'NO', 'Norway'),
(409, 4, 'PL', 'Poland'),
(410, 4, 'PT', 'Portugal'),
(411, 4, 'RO', 'Romania'),
(412, 4, 'RS', 'Serbia'),
(413, 4, 'RU', 'Russian Federation'),
(414, 4, 'SE', 'Sweden'),
(415, 4, 'SI', 'Slovenia'),
(416, 4, 'SJ', 'Svalbard and Jan Mayen'),
(417, 4, 'SK', 'Slovakia'),
(418, 4, 'SM', 'San Marino'),
(419, 4, 'TR', 'Turkey'),
(420, 4, 'UA', 'Ukraine'),
(421, 4, 'VA', 'Holy See (Vatican City State)'),
(422, 5, 'AG', 'Antigua and Barbuda'),
(423, 5, 'AI', 'Anguilla'),
(424, 5, 'AN', 'Netherlands Antilles'),
(425, 5, 'AW', 'Aruba'),
(426, 5, 'BB', 'Barbados'),
(427, 5, 'BL', 'Saint Barthélemy'),
(428, 5, 'BM', 'Bermuda'),
(429, 5, 'BS', 'Bahamas'),
(430, 5, 'BZ', 'Belize'),
(431, 5, 'CA', 'Canada'),
(432, 5, 'CR', 'Costa Rica'),
(433, 5, 'CU', 'Cuba'),
(434, 5, 'DM', 'Dominica'),
(435, 5, 'DO', 'Dominican Republic'),
(436, 5, 'GD', 'Grenada'),
(437, 5, 'GL', 'Greenland'),
(438, 5, 'GP', 'Guadeloupe'),
(439, 5, 'GT', 'Guatemala'),
(440, 5, 'HN', 'Honduras'),
(441, 5, 'HT', 'Haiti'),
(442, 5, 'JM', 'Jamaica'),
(443, 5, 'KN', 'Saint Kitts and Nevis'),
(444, 5, 'KY', 'Cayman Islands'),
(445, 5, 'LC', 'Saint Lucia'),
(446, 5, 'MF', 'Saint Martin (French part)'),
(447, 5, 'MQ', 'Martinique'),
(448, 5, 'MS', 'Montserrat'),
(449, 5, 'MX', 'Mexico'),
(450, 5, 'NI', 'Nicaragua'),
(451, 5, 'PA', 'Panama'),
(452, 5, 'PM', 'Saint Pierre and Miquelon'),
(453, 5, 'PR', 'Puerto Rico'),
(454, 5, 'SV', 'El Salvador'),
(455, 5, 'TC', 'Turks and Caicos Islands'),
(456, 5, 'TT', 'Trinidad and Tobago'),
(457, 5, 'US', 'United States'),
(458, 5, 'VC', 'Saint Vincent and the Grenadines'),
(459, 5, 'VG', 'Virgin Islands, British'),
(460, 5, 'VI', 'Virgin Islands, U.S.'),
(461, 6, 'AS', 'American Samoa'),
(462, 6, 'AU', 'Australia'),
(463, 6, 'CK', 'Cook Islands'),
(464, 6, 'FJ', 'Fiji'),
(465, 6, 'FM', 'Micronesia, Federated States of'),
(466, 6, 'GU', 'Guam'),
(467, 6, 'KI', 'Kiribati'),
(468, 6, 'MH', 'Marshall Islands'),
(469, 6, 'MP', 'Northern Mariana Islands'),
(470, 6, 'NC', 'New Caledonia'),
(471, 6, 'NF', 'Norfolk Island'),
(472, 6, 'NR', 'Nauru'),
(473, 6, 'NU', 'Niue'),
(474, 6, 'NZ', 'New Zealand'),
(475, 6, 'PF', 'French Polynesia'),
(476, 6, 'PG', 'Papua New Guinea'),
(477, 6, 'PN', 'Pitcairn'),
(478, 6, 'PW', 'Palau'),
(479, 6, 'SB', 'Solomon Islands'),
(480, 6, 'TK', 'Tokelau'),
(481, 6, 'TO', 'Tonga'),
(482, 6, 'TV', 'Tuvalu'),
(483, 6, 'UM', 'United States Minor Outlying Islands'),
(484, 6, 'VU', 'Vanuatu'),
(485, 6, 'WF', 'Wallis and Futuna'),
(486, 6, 'WS', 'Samoa'),
(487, 7, 'AR', 'Argentina'),
(488, 7, 'BO', 'Bolivia, Plurinational State of'),
(489, 7, 'BR', 'Brazil'),
(490, 7, 'CL', 'Chile'),
(491, 7, 'CO', 'Colombia'),
(492, 7, 'EC', 'Ecuador'),
(493, 7, 'FK', 'Falkland Islands (Malvinas)'),
(494, 7, 'GF', 'French Guiana'),
(495, 7, 'GY', 'Guyana'),
(496, 7, 'PE', 'Peru'),
(497, 7, 'PY', 'Paraguay'),
(498, 7, 'SR', 'Suriname'),
(499, 7, 'UY', 'Uruguay'),
(500, 7, 'VE', 'Venezuela, Bolivarian Republic of'),
(501, 3, '91', 'dshsdf');

-- --------------------------------------------------------

--
-- Table structure for table `tb_currencies`
--

CREATE TABLE IF NOT EXISTS `tb_currencies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `symbol` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `minimum_amount` double NOT NULL DEFAULT '0.5',
  `is_zero_decimal_currency` tinyint NOT NULL DEFAULT '0',
  `conversion_factor` decimal(10,4) NOT NULL DEFAULT '1.0000',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=14 ;

--
-- Dumping data for table `tb_currencies`
--

INSERT INTO `tb_currencies` (`id`, `symbol`, `name`, `minimum_amount`, `is_zero_decimal_currency`, `conversion_factor`, `is_active`, `creation_datetime`, `updation_datetime`) VALUES
(1, '$', 'USD', 50, 0, 1.0000, 1, '2019-08-22 08:51:50', '2019-08-27 09:13:02'),
(2, '₹', 'INR', 3500, 0, 0.0143, 1, '2019-08-23 04:20:55', '2019-08-23 04:20:55'),
(3, 'A$', 'AUD', 50, 0, 0.6900, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(4, 'C$', 'CAD', 50, 0, 0.7600, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(5, 'Fr', 'CHF', 50, 0, 1.0200, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(6, 'Kr.', 'DKK', 250, 0, 0.1500, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(7, '€', 'EUR', 50, 0, 1.1300, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(8, '£', 'GBP', 30, 0, 1.2700, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(9, 'HK$', 'HKD', 400, 0, 0.1300, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(10, '¥', 'JPY', 50, 1, 0.0093, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(11, 'kr', 'NOK', 300, 0, 0.1200, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(12, 'NZ$', 'NZD', 50, 0, 0.6600, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(13, 'Kr', 'SEK', 300, 0, 0.1100, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58'),
(14, 'S$', 'SGD', 50, 0, 0.7400, 1, '2019-09-13 12:57:58', '2019-09-13 12:57:58');

-- --------------------------------------------------------

--
-- Table structure for table `tb_jungleworks_payment_links`
--

CREATE TABLE IF NOT EXISTS `tb_jungleworks_payment_links` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `jwp_invoice_id` mediumtext,
  `jwp_short_url` mediumtext,
  `user_id` bigint DEFAULT NULL,
  `amount` decimal(65,3) DEFAULT NULL,
  `currency_id` int DEFAULT NULL,
  `offering` int DEFAULT NULL,
  `description` mediumtext,
  `jwp_request` json DEFAULT NULL,
  `jwp_response` json DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rzp_invoice_id` (`jwp_invoice_id`(100))
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tb_languages`
--

CREATE TABLE IF NOT EXISTS `tb_languages` (
  `lang_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `local_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`lang_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=56 ;

--
-- Dumping data for table `tb_languages`
--

INSERT INTO `tb_languages` (`lang_id`, `code`, `name`, `local_name`) VALUES
(11, 'en', 'english', 'English'),
(12, 'hi', 'hindi', 'हिंदी'),
(13, 'ar', 'arabic', 'عربى'),
(14, 'el', 'Greek', 'Greek'),
(36, 'es', 'Spanish', 'Español'),
(37, 'zh', 'Chinese', NULL),
(38, 'cs', 'Czech', NULL),
(39, 'da', 'Danish', NULL),
(40, 'fil', 'Filipino', NULL),
(41, 'nl', 'Dutch', NULL),
(42, 'fr', 'French', NULL),
(43, 'pl', 'Polish', NULL),
(44, 'ka', 'Georgian', NULL),
(45, 'de', 'German', NULL),
(46, 'hu', 'Hungarian', NULL),
(47, 'id', 'Indonesian', NULL),
(48, 'it', 'Italian', NULL),
(49, 'ja', 'Japanese', NULL),
(50, 'ms', 'Malaysian', NULL),
(51, 'pt', 'Portuguese', NULL),
(52, 'ru', 'Russian', NULL),
(53, 'vi', 'Vietnamese', NULL),
(54, 'sw', 'Swahili', NULL),
(55, 'th', 'Thai', NULL),
(56, 'tr', 'Turkish', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tb_marketing_users`
--

CREATE TABLE IF NOT EXISTS `tb_marketing_users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `reseller_id` int DEFAULT NULL,
  `is_whitelabel` tinyint(1) NOT NULL DEFAULT '0',
  `brand_image` mediumtext,
  `logo` mediumtext,
  `fav_icon` mediumtext,
  `domain` mediumtext,
  `map_theme` tinyint(1) NOT NULL DEFAULT '0',
  `has_traffic_layer` tinyint(1) NOT NULL DEFAULT '0',
  `has_completed_tasks` tinyint(1) NOT NULL DEFAULT '0',
  `internal_user` tinyint(1) NOT NULL DEFAULT '0',
  `show_billing_popup` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0=no,1-Yes',
  `send_expiry_reminder` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0=notsend,1=firstremindersend,2-secondremindersend',
  `billing_plan` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0-trial,1-free_forever,2-driver_plan,3-task_plan',
  `sms_plan` tinyint(1) DEFAULT '4',
  `call_fleet_as` varchar(200) DEFAULT 'Agent',
  `call_dispatcher_as` varchar(200) DEFAULT 'Manager',
  `call_tasks_as` varchar(200) DEFAULT 'Task',
  `layout_type` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0-pickup,1-delivery,2-pickup and delivery,3 - appointment',
  `access_token` text,
  `company_name` text,
  `company_address` text,
  `company_image` text,
  `company_latitude` varchar(100) DEFAULT NULL,
  `company_longitude` varchar(100) DEFAULT NULL,
  `is_company_image_view` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = yes, 0 = no',
  `is_driver_image_view` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = yes, 0 = no',
  `country` text,
  `country_phone_code` varchar(6) DEFAULT 'us',
  `first_name` mediumtext,
  `last_name` mediumtext,
  `username` text,
  `password` text,
  `email` text NOT NULL,
  `phone` text,
  `verification_token` text,
  `verification_status` tinyint(1) DEFAULT NULL COMMENT '0-inactive,0-active',
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deduct_sms_charges` tinyint NOT NULL DEFAULT '0',
  `last_login_datetime` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0-inactive,1-active',
  `timezone` text,
  `first_time_login_keys` varchar(10) NOT NULL DEFAULT '00000000',
  `tab_viewed_keys` varchar(10) NOT NULL DEFAULT '00000000',
  `notification_count` bigint NOT NULL DEFAULT '0',
  `constraint_type` tinyint(1) NOT NULL DEFAULT '2' COMMENT '1 = pickup_hard, 2 = delivery_hard, 3 = pickup_and_delivery_hard',
  `is_dispatcher` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 - Yes, 0 - No',
  `dispatcher_user_id` bigint DEFAULT NULL,
  `is_first_time_login` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 - yes, 0 -no',
  `setup_wizard_step` tinyint(1) NOT NULL DEFAULT '0',
  `info_popup` tinyint(1) NOT NULL DEFAULT '1',
  `shopify_id` text,
  `tookan_shared_secret` text,
  `distance_in` varchar(4) NOT NULL DEFAULT 'KM',
  `source` mediumtext,
  `medium` mediumtext,
  `has_mails_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `language` mediumtext,
  `tracking_language` mediumtext,
  `skip_add_card` tinyint(1) NOT NULL DEFAULT '0',
  `whats_new` tinyint(1) NOT NULL DEFAULT '0',
  `zoho_lead_owner` mediumtext,
  `is_sms_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `agent_workflow` tinyint(1) NOT NULL DEFAULT '0',
  `account_manager` text,
  `dashboard_version` tinyint(1) NOT NULL DEFAULT '1',
  `lead_id` text,
  `is_clustering_enabled` tinyint NOT NULL DEFAULT '1',
  `is_socket_toast_enabled` tinyint NOT NULL DEFAULT '1',
  `default_view` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = map, 1 = list',
  `agent_offline_time` float NOT NULL DEFAULT '2',
  `registration_type` tinyint NOT NULL DEFAULT '1' COMMENT '1 = Tookan, 2 = Yelo, 3 = Yelo Marketplace, 4 = Flightmap, 5 = Bulbul, 6 = Fugu, 7 = Kato',
  `is_delivery_marker_enabled` tinyint NOT NULL DEFAULT '1',
  `business_type` tinyint(1) NOT NULL DEFAULT '1',
  `customer_teams_setting` tinyint(1) NOT NULL DEFAULT '0',
  `message` mediumtext,
  `url` mediumtext,
  `session_ip` mediumtext,
  `utm_source` mediumtext,
  `utm_medium` mediumtext,
  `utm_term` mediumtext,
  `utm_keyword` mediumtext,
  `utm_content` mediumtext,
  `utm_lead` mediumtext,
  `old_source` mediumtext,
  `old_medium` mediumtext,
  `gclid` mediumtext,
  `web_referrer` mediumtext,
  `referrer` mediumtext,
  `previous_page` mediumtext,
  `vertical_page` mediumtext,
  `cta_type` mediumtext,
  `main_user_id` int DEFAULT NULL,
  `country_code` mediumtext,
  `continent_code` mediumtext,
  `region_code` mediumtext,
  `city` mediumtext,
  `marketing_user` tinyint(1) DEFAULT '0',
  `utm_campaign` mediumtext,
  `productname` mediumtext,
  `uber_for` mediumtext,
  `old_utm_campaign` mediumtext,
  `incomplete_signup` tinyint(1) DEFAULT '0',
  `designation` mediumtext,
  `employee_count` bigint DEFAULT NULL,
  `terms_and_conditions` tinyint NOT NULL DEFAULT '0',
  `cookies` tinyint NOT NULL DEFAULT '0',
  `custom_fields` json DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `dispatcher_user_id` (`dispatcher_user_id`),
  KEY `Authentication_INDEX` (`user_id`,`access_token`(200)),
  KEY `ACCESS_INDEX` (`access_token`(200)),
  KEY `email_index` (`email`(200)),
  KEY `domain` (`domain`(15))
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=24617 ;

-- --------------------------------------------------------

--
-- Table structure for table `tb_offering_data`
--

CREATE TABLE IF NOT EXISTS `tb_offering_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` mediumtext NOT NULL,
  `url` varchar(100) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `show_users` tinyint(1) NOT NULL DEFAULT '1',
  `show_lead_management` tinyint(1) NOT NULL DEFAULT '1',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `udpated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=86 ;

--
-- Dumping data for table `tb_offering_data`
--

INSERT INTO `tb_offering_data` (`id`, `name`, `url`, `logo`, `show_users`, `show_lead_management`, `created`, `udpated`) VALUES
(1, 'Tookan', '/tookan', NULL, 1, 1, '2018-01-17 07:10:00', '2021-07-30 15:50:23'),
(2, 'Yelo', '/yelo', NULL, 1, 1, '2018-01-17 07:10:00', '2021-07-30 15:50:25'),
(3, 'FlightMap', '/flightmap', NULL, 1, 1, '2018-01-17 07:11:26', '2021-07-30 15:50:27'),
(5, 'BulBul', '/bulbul', NULL, 1, 1, '2018-01-17 07:11:26', '2021-07-30 15:50:29'),
(6, 'Hippo', '/fugu', NULL, 1, 1, '2018-01-17 07:12:23', '2021-07-30 15:50:32'),
(7, 'Kato', '/kato', NULL, 1, 1, '2018-01-17 07:12:23', '2021-07-30 15:50:34'),
(8, 'Attendance', NULL, NULL, 0, 1, '2018-03-05 12:36:50', '2021-07-30 15:50:44'),
(9, 'Jungle', NULL, NULL, 1, 1, '2018-03-05 12:40:14', '2018-03-05 12:40:14'),
(10, 'Partner', NULL, NULL, 1, 1, '2018-03-05 12:41:32', '2018-03-05 12:41:32'),
(11, 'TaxiHawk', NULL, NULL, 1, 1, '2018-03-05 12:41:32', '2018-03-05 12:41:32'),
(12, 'Solutions', NULL, NULL, 1, 1, '2018-03-05 12:41:32', '2018-03-05 12:41:32'),
(13, 'Nextjuggernaut', NULL, NULL, 1, 1, '2018-03-05 12:41:32', '2018-03-05 14:41:40'),
(14, 'Bumbl', NULL, NULL, 1, 1, '2018-03-07 11:44:38', '2018-04-05 13:29:45'),
(15, 'Fugu', NULL, NULL, 1, 1, '2018-03-09 06:03:18', '2018-03-09 06:03:18'),
(16, 'Jugnoo Operators', NULL, NULL, 1, 1, '2018-03-26 08:36:43', '2018-03-26 08:36:43'),
(17, 'JugnooAds', NULL, NULL, 1, 1, '2018-04-10 12:10:20', '2018-04-10 12:10:20'),
(18, 'JugnooTaxi', NULL, NULL, 1, 1, '2018-04-23 10:33:46', '2018-04-23 10:33:54'),
(19, 'Cannabis', NULL, NULL, 1, 1, '2018-05-03 14:04:30', '2018-05-03 14:04:30'),
(20, 'Delivery', NULL, NULL, 1, 1, '2018-05-03 14:05:05', '2018-05-03 14:05:05'),
(21, 'Enterprise', NULL, NULL, 1, 1, '2018-05-03 14:05:29', '2018-05-03 14:05:29'),
(22, 'Food', NULL, NULL, 1, 1, '2018-05-03 14:05:52', '2018-05-03 14:05:52'),
(23, 'General', NULL, NULL, 1, 1, '2018-05-03 14:06:15', '2018-05-03 14:06:15'),
(24, 'Other Verticals', NULL, NULL, 1, 1, '2018-05-03 14:06:44', '2018-05-03 14:06:44'),
(25, 'Services', NULL, NULL, 1, 1, '2018-05-03 14:08:25', '2018-05-03 14:08:25'),
(26, 'JW Taxi', NULL, NULL, 1, 1, '2018-05-03 14:09:58', '2018-05-03 14:09:58'),
(27, 'Unique Reseller', NULL, NULL, 1, 1, '2018-07-09 06:15:02', '2018-07-09 06:15:02'),
(28, 'reseller australia', NULL, NULL, 1, 1, '2018-07-17 12:57:37', '2018-07-17 12:57:37'),
(29, 'Manager', NULL, NULL, 1, 1, '2018-08-09 07:25:25', '2018-08-09 07:25:25'),
(30, 'JugnooTaxi-Custom', NULL, NULL, 1, 1, '2018-08-09 07:25:59', '2018-08-09 07:25:59'),
(31, 'Philippines', NULL, NULL, 1, 1, '2018-08-22 10:31:44', '2018-08-22 10:31:44'),
(32, 'Jini', NULL, NULL, 1, 1, '2018-08-22 10:31:54', '2018-08-22 10:31:54'),
(33, 'HR-Bulbul', NULL, NULL, 1, 1, '2018-09-17 07:08:25', '2018-09-17 07:08:25'),
(34, 'HR-Careers', NULL, NULL, 1, 1, '2018-09-17 07:48:30', '2018-09-17 07:48:30'),
(35, 'Appointment-Booking-Form', NULL, NULL, 1, 1, '2018-09-24 11:49:04', '2018-09-24 11:49:04'),
(36, 'Jugnoo Franchise', NULL, NULL, 1, 1, '2018-10-08 13:32:18', '2018-10-08 13:32:18'),
(37, 'Career JW', NULL, NULL, 1, 1, '2018-10-09 14:39:21', '2018-10-09 14:39:21'),
(38, 'JugnooTaxi-Black-Friday', NULL, NULL, 1, 1, '2018-12-20 11:42:53', '2018-12-20 11:42:53'),
(39, 'Tookan Forms', NULL, NULL, 0, 0, '2018-12-20 11:43:09', '2018-12-20 11:43:09'),
(40, 'Coselling Partner', NULL, NULL, 1, 1, '2018-12-20 11:43:28', '2018-12-20 11:43:28'),
(41, 'France Reseller', NULL, NULL, 1, 1, '2018-12-31 05:35:52', '2018-12-31 05:35:52'),
(42, 'JCurve', NULL, NULL, 1, 1, '2019-02-12 10:53:02', '2019-02-12 10:53:02'),
(43, 'Tookan Taxi', NULL, NULL, 1, 1, '2019-02-12 10:53:12', '2019-02-12 10:53:12'),
(44, 'Bumbl', NULL, NULL, 1, 1, '2019-02-12 10:53:12', '2020-06-17 09:54:56'),
(45, 'CSM', NULL, NULL, 1, 1, '2019-04-12 10:53:12', '2019-04-12 10:53:12'),
(46, 'Webinar', NULL, NULL, 1, 1, '2019-04-23 09:30:55', '2019-04-23 09:30:55'),
(47, 'Domains', NULL, NULL, 1, 1, '2019-05-13 10:15:44', '2019-05-13 10:15:44'),
(48, 'TIDA', NULL, NULL, 1, 1, '2019-05-16 09:40:03', '2019-05-16 09:40:03'),
(49, 'Click Labs Institute', NULL, NULL, 1, 1, '2019-05-20 06:12:50', '2019-05-20 06:12:50'),
(50, 'Tookan-fleet', NULL, NULL, 1, 1, '2019-05-30 07:27:55', '2019-05-30 07:27:55'),
(51, 'Jungle Maps', NULL, NULL, 1, 1, '2019-06-10 10:20:43', '2019-06-10 10:20:51'),
(52, 'Fatafat', NULL, NULL, 1, 1, '2019-06-12 10:22:25', '2019-06-12 10:22:25'),
(53, 'test', NULL, NULL, 1, 1, '2019-06-13 09:05:48', '2019-06-13 09:05:48'),
(54, 'Fatafat Product', NULL, NULL, 1, 1, '2019-07-10 13:51:20', '2019-07-10 13:51:20'),
(55, 'catchup', NULL, NULL, 1, 1, '2019-10-04 09:12:25', '2019-10-04 09:12:25'),
(60, 'tiger', NULL, NULL, 1, 1, '2019-11-20 13:34:04', '2019-11-20 13:34:04'),
(61, 'Husky', NULL, NULL, 1, 1, '2020-03-17 10:27:12', '2020-03-17 10:27:12'),
(62, 'Circle', NULL, NULL, 1, 1, '2020-03-17 10:27:21', '2020-03-17 10:27:21'),
(63, 'Project Grassroot', NULL, NULL, 1, 1, '2020-03-23 13:22:56', '2020-03-23 13:22:56'),
(64, 'Husky Freelancer', NULL, NULL, 1, 1, '2020-03-27 07:16:25', '2020-03-27 07:16:25'),
(65, 'Panther', NULL, NULL, 1, 1, '2020-04-21 11:42:36', '2020-04-21 11:42:36'),
(66, 'GetFlash', NULL, NULL, 1, 1, '2020-04-22 04:26:48', '2020-04-22 04:26:48'),
(67, 'ERP Juggernaut', NULL, NULL, 1, 1, '2020-04-29 10:41:12', '2020-04-29 10:41:12'),
(68, 'Safe Pass', NULL, NULL, 1, 1, '2020-05-11 06:00:04', '2020-05-11 06:00:04'),
(69, 'Jindo', NULL, NULL, 1, 1, '2020-05-19 10:57:30', '2020-05-19 10:57:30'),
(70, 'Ospro', NULL, NULL, 1, 1, '2020-07-20 05:38:31', '2020-07-20 05:38:31'),
(71, 'Yelo-ZeroTouch', NULL, NULL, 1, 1, '2020-08-07 10:24:10', '2020-08-07 10:24:10'),
(72, 'Bumbl-Marketing', NULL, NULL, 1, 1, '2020-09-07 12:52:21', '2020-09-07 12:52:21'),
(73, 'Growth Stack', NULL, NULL, 1, 1, '2021-01-14 05:56:51', '2021-01-14 05:56:51'),
(74, 'TheBuddy', NULL, NULL, 1, 1, '2021-04-29 05:07:39', '2021-04-29 05:07:39'),
(75, 'Tiger Store-old', NULL, NULL, 1, 1, '2021-05-31 12:23:57', '2021-06-24 08:57:29'),
(76, 'Jungleworks Ebooks', NULL, NULL, 1, 1, '2021-03-17 07:17:18', '2021-03-17 07:17:18'),
(77, 'TheBuddy2', NULL, NULL, 1, 1, '2021-04-29 05:05:30', '2021-04-29 05:05:30'),
(78, 'Tookan E-books', NULL, NULL, 1, 1, '2021-05-06 06:54:17', '2021-05-06 06:54:17'),
(79, 'Yelo E-books', NULL, NULL, 1, 1, '2021-05-06 06:54:30', '2021-05-06 06:54:30'),
(80, 'Husky E-books', NULL, NULL, 1, 1, '2021-05-06 06:54:41', '2021-05-06 06:54:41'),
(81, 'Panther E-books', NULL, NULL, 1, 1, '2021-05-06 06:54:53', '2021-05-06 06:54:53'),
(82, 'Flightmap E-books', NULL, NULL, 1, 1, '2021-05-06 06:55:11', '2021-05-06 06:55:11'),
(83, 'Growthstack E-books', NULL, NULL, 1, 1, '2021-05-06 06:55:23', '2021-05-06 06:55:23'),
(84, 'Tiger E-books', NULL, NULL, 1, 1, '2021-05-06 06:55:31', '2021-05-06 06:55:31'),
(85, 'Muzk', NULL, NULL, 1, 1, '2021-05-12 12:15:23', '2021-05-12 12:15:23'),
(86, 'Tiger Store', NULL, NULL, 1, 1, '2021-05-31 12:23:57', '2021-05-31 12:23:57');

-- --------------------------------------------------------

--
-- Table structure for table `tb_otp_verification`
--

CREATE TABLE IF NOT EXISTS `tb_otp_verification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) DEFAULT NULL,
  `otp_count` int DEFAULT NULL,
  `is_verified` int DEFAULT NULL,
  `creation_datetime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_datetime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `type` int DEFAULT NULL,
  `otp` int DEFAULT NULL,
  `attempt` int DEFAULT '0',
  `email` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5811 ;

-- --------------------------------------------------------

--
-- Table structure for table `tb_payment_logs`
--

CREATE TABLE IF NOT EXISTS `tb_payment_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `transaction_id` mediumtext,
  `offering` bigint DEFAULT NULL,
  `amount` double(10,4) NOT NULL DEFAULT '0.0000',
  `currency_id` int NOT NULL DEFAULT '1',
  `payment_gateway` tinyint NOT NULL DEFAULT '1',
  `dollar_amount` decimal(10,3) DEFAULT NULL,
  `conversion_factor` float(65,3) NOT NULL DEFAULT '1.000',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = Succesful, 0 =Fail',
  `description` mediumtext NOT NULL,
  `response` mediumtext,
  `creation_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tb_razorpay_payment_links`
--

CREATE TABLE IF NOT EXISTS `tb_razorpay_payment_links` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `rzp_invoice_id` mediumtext,
  `rzp_customer_id` mediumtext,
  `rzp_short_url` mediumtext,
  `rzp_order_id` mediumtext,
  `user_id` bigint DEFAULT NULL,
  `amount` decimal(65,3) DEFAULT NULL,
  `currency_id` int DEFAULT NULL,
  `offering` int DEFAULT NULL,
  `description` mediumtext,
  `rzp_request` json DEFAULT NULL,
  `rzp_response` json DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rzp_invoice_id` (`rzp_invoice_id`(100))
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tb_stripe_payment_intents`
--

CREATE TABLE IF NOT EXISTS `tb_stripe_payment_intents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `offering` int NOT NULL,
  `payment_intent_id` mediumtext NOT NULL,
  `client_secret` mediumtext NOT NULL,
  `payment_token` mediumtext NOT NULL,
  `amount` float(65,2) NOT NULL,
  `currency_symbol` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` tinyint NOT NULL COMMENT 'unpaid-0,paid-1,disabled-2',
  `is_on_session` tinyint DEFAULT '0',
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_token` (`payment_token`(500)),
  UNIQUE KEY `payment_intent_id` (`payment_intent_id`(200)),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tb_users`
--

CREATE TABLE IF NOT EXISTS `tb_users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `reseller_id` bigint DEFAULT NULL,
  `is_dispatcher` tinyint(1) DEFAULT '0',
  `first_name` mediumtext,
  `last_name` mediumtext,
  `username` mediumtext,
  `email` mediumtext NOT NULL,
  `company_name` mediumtext,
  `billing_plan` tinyint(1) NOT NULL DEFAULT '0',
  `sms_plan` tinyint(1) NOT NULL DEFAULT '4' COMMENT '0 = Old Free, 1 = Tookan Gateway, 2 = External Gateway, 3 = No SMS, 4 = New Free',
  `layout_type` tinyint(1) NOT NULL DEFAULT '1',
  `access_token` mediumtext NOT NULL,
  `fb_id` mediumtext,
  `google_id` mediumtext,
  `apple_user_identifier` mediumtext,
  `company_address` mediumtext,
  `internal_user` tinyint(1) NOT NULL DEFAULT '0',
  `show_billing_popup` tinyint(1) NOT NULL DEFAULT '0',
  `send_expiry_reminder` tinyint(1) NOT NULL DEFAULT '0',
  `per_task_cost` decimal(10,2) NOT NULL DEFAULT '0.10',
  `per_fleet_cost` decimal(10,2) NOT NULL DEFAULT '10.00',
  `num_tasks` bigint NOT NULL DEFAULT '300',
  `num_fleets` bigint NOT NULL DEFAULT '3',
  `call_fleet_as` varchar(200) DEFAULT 'Agent',
  `call_dispatcher_as` varchar(200) DEFAULT 'Manager',
  `call_tasks_as` varchar(200) DEFAULT 'Task',
  `dispatcher_user_id` bigint DEFAULT NULL,
  `company_image` mediumtext,
  `company_latitude` varchar(200) DEFAULT NULL,
  `company_longitude` varchar(200) DEFAULT NULL,
  `is_company_image_view` tinyint(1) NOT NULL DEFAULT '0',
  `is_driver_image_view` tinyint(1) NOT NULL DEFAULT '0',
  `country` mediumtext,
  `password` mediumtext NOT NULL,
  `country_phone_code` varchar(7) DEFAULT 'us',
  `phone` mediumtext,
  `verification_token` mediumtext NOT NULL,
  `verification_status` tinyint(1) NOT NULL,
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_datetime` datetime NOT NULL,
  `updation_datetime` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_blocked` tinyint(1) NOT NULL DEFAULT '0',
  `timezone` mediumtext NOT NULL,
  `first_time_login_keys` varchar(10) NOT NULL DEFAULT '00000000',
  `tab_viewed_keys` varchar(10) NOT NULL DEFAULT '00000000',
  `notification_count` bigint NOT NULL DEFAULT '0',
  `constraint_type` tinyint(1) NOT NULL DEFAULT '2',
  `is_first_time_login` tinyint(1) NOT NULL DEFAULT '1',
  `setup_wizard_step` tinyint(1) DEFAULT '0',
  `map_theme` tinyint(1) NOT NULL DEFAULT '0',
  `skip_add_card` tinyint(1) NOT NULL DEFAULT '1',
  `shopify_id` text,
  `has_traffic_layer` tinyint(1) NOT NULL DEFAULT '0',
  `has_routing` tinyint(1) NOT NULL DEFAULT '0',
  `has_invoicing_module` tinyint(1) NOT NULL DEFAULT '0',
  `has_fleet_create_task` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'create task from agent',
  `distance_in` varchar(4) NOT NULL DEFAULT 'KM',
  `tookan_shared_secret` mediumtext,
  `has_completed_tasks` tinyint(1) NOT NULL DEFAULT '0',
  `source` mediumtext,
  `medium` mediumtext,
  `is_whitelabel` tinyint(1) NOT NULL DEFAULT '0',
  `brand_image` mediumtext,
  `logo` mediumtext,
  `fav_icon` mediumtext,
  `domain` mediumtext,
  `language` mediumtext,
  `tracking_language` mediumtext,
  `has_mails_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `whats_new` tinyint(1) NOT NULL DEFAULT '0',
  `zoho_lead_owner` mediumtext,
  `lead_id` mediumtext,
  `is_sms_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `agent_workflow` tinyint(1) NOT NULL DEFAULT '0',
  `account_manager` mediumtext,
  `dashboard_version` tinyint(1) NOT NULL DEFAULT '1',
  `is_clustering_enabled` tinyint NOT NULL DEFAULT '1',
  `is_socket_toast_enabled` tinyint NOT NULL DEFAULT '1',
  `default_view` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = map, 1 = list',
  `agent_offline_time` decimal(10,2) NOT NULL DEFAULT '24.00',
  `registration_type` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = Tookan, 2 = Yelo, 3 = Yelo Marketplace, 4 = Flightmap, 5 = Bulbul, 6 = Fugu, 7 = Kato, 8 = Attendence, 9 = jungle',
  `business_type` tinyint(1) NOT NULL DEFAULT '1',
  `customer_teams_setting` tinyint(1) NOT NULL DEFAULT '0',
  `template_id` mediumtext,
  `terms_and_conditions` tinyint(1) DEFAULT '0',
  `cookies` tinyint(1) DEFAULT '0',
  `connected_tasks` tinyint(1) NOT NULL DEFAULT '0',
  `custom_fields` json DEFAULT NULL,
  `is_merchant` tinyint(1) DEFAULT '0',
  `refresh_min` float DEFAULT NULL,
  `time_format` varchar(64) NOT NULL DEFAULT 'hh:mm a',
  `date_format` varchar(64) NOT NULL DEFAULT 'DD MMM YYYY',
  `user_view` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 -> Task View, 1 -> Mission View, 2 - > Task & Mission View',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `Access_INDEX` (`access_token`(200)),
  UNIQUE KEY `fb_id` (`fb_id`(200)),
  UNIQUE KEY `google_id` (`google_id`(200)),
  UNIQUE KEY `email` (`email`(100),`dispatcher_user_id`) USING BTREE,
  KEY `Access_Userid_INDEX` (`access_token`(200),`user_id`),
  KEY `dispatcher_user_id` (`dispatcher_user_id`),
  KEY `domain` (`domain`(15)),
  KEY `reseller_id` (`reseller_id`),
  KEY `lead_id` (`lead_id`(100)),
  KEY `lead_owner` (`zoho_lead_owner`(100)),
  KEY `phone` (`phone`(14)),
  KEY `apple_user_identifier` (`apple_user_identifier`(200))
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=10998190 ;

-- --------------------------------------------------------

--
-- Table structure for table `tb_user_api_keys`
--

CREATE TABLE IF NOT EXISTS `tb_user_api_keys` (
  `key_id` bigint NOT NULL AUTO_INCREMENT,
  `name` mediumtext,
  `api_key` mediumtext NOT NULL,
  `user_id` bigint NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `key_type` tinyint(1) NOT NULL DEFAULT '0',
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_id`),
  KEY `tb_user_api_keys_ibfk_1` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `tb_user_credit_card`
--

CREATE TABLE IF NOT EXISTS `tb_user_credit_card` (
  `credit_card_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `card_token` mediumtext,
  `payment_method` mediumtext,
  `last4_digits` mediumtext,
  `brand` mediumtext,
  `funding` mediumtext,
  `source` tinyint NOT NULL DEFAULT '0',
  `expiry_date` mediumtext,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `customer_id` mediumtext NOT NULL,
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_datetime` datetime DEFAULT NULL,
  PRIMARY KEY (`credit_card_id`),
  UNIQUE KEY `user_id_2` (`user_id`),
  KEY `user_id` (`user_id`),
  KEY `user_id_3` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `tb_user_details`
--

CREATE TABLE IF NOT EXISTS `tb_user_details` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `device_type` tinyint DEFAULT NULL,
  `hippo_name` varchar(40) DEFAULT NULL,
  `hippo_domain` varchar(40) DEFAULT NULL,
  `is_rental` tinyint NOT NULL DEFAULT '0',
  `creation_datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `tb_user_offerings`
--

CREATE TABLE IF NOT EXISTS `tb_user_offerings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `offering` bigint NOT NULL,
  `updated_datetime` timestamp NULL DEFAULT NULL,
  `creation_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_offering` (`user_id`,`offering`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb3 AUTO_INCREMENT=6778059 ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tb_user_api_keys`
--
ALTER TABLE `tb_user_api_keys`
  ADD CONSTRAINT `tb_user_api_keys_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tb_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
