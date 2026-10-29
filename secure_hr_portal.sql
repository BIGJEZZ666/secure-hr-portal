-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 29, 2026 at 09:24 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `secure_hr_portal`
--

-- --------------------------------------------------------

--
-- Table structure for table `tb_action`
--

CREATE TABLE `tb_action` (
  `action_id` int(11) NOT NULL,
  `action_name` varchar(120) NOT NULL,
  `action_type` enum('POST','PUT','GET','DELETE') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tb_activity_log`
--

CREATE TABLE `tb_activity_log` (
  `log_id` bigint(20) NOT NULL,
  `employee_id` int(11) NOT NULL COMMENT 'fk พนักงาน',
  `action_id` int(11) NOT NULL COMMENT 'fk การกระทำ',
  `timestamp` datetime NOT NULL COMMENT 'เวลาแบบ datetime ไม่ใช่ timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tb_employee`
--

CREATE TABLE `tb_employee` (
  `employee_id` int(4) NOT NULL COMMENT 'id พนักงาน',
  `employee_name` varchar(150) DEFAULT NULL,
  `employee_email` varchar(140) NOT NULL COMMENT 'email พนักงาน',
  `password` varchar(255) NOT NULL COMMENT 'รหัสผ่าน',
  `role_id` int(11) NOT NULL COMMENT 'fk ตำแหน่ง',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tb_role`
--

CREATE TABLE `tb_role` (
  `role_id` tinyint(1) NOT NULL COMMENT '??',
  `role_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อตำแหน่ง'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tb_role`
--

INSERT INTO `tb_role` (`role_id`, `role_name`) VALUES
(1, 'CEO'),
(2, 'Hr'),
(3, 'Employee');

-- --------------------------------------------------------

--
-- Table structure for table `tb_session`
--

CREATE TABLE `tb_session` (
  `session_id` char(36) NOT NULL,
  `employee_id` int(4) NOT NULL,
  `token_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `last_seen_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tb_activity_log`
--
ALTER TABLE `tb_activity_log`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `tb_employee`
--
ALTER TABLE `tb_employee`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `uq_tb_employee_email` (`employee_email`);

--
-- Indexes for table `tb_role`
--
ALTER TABLE `tb_role`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `tb_session`
--
ALTER TABLE `tb_session`
  ADD PRIMARY KEY (`session_id`),
  ADD UNIQUE KEY `uq_tb_session_token_hash` (`token_hash`),
  ADD KEY `idx_tb_session_employee` (`employee_id`),
  ADD KEY `idx_tb_session_expires` (`expires_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tb_activity_log`
--
ALTER TABLE `tb_activity_log`
  MODIFY `log_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tb_employee`
--
ALTER TABLE `tb_employee`
  MODIFY `employee_id` int(4) NOT NULL AUTO_INCREMENT COMMENT 'id พนักงาน';

--
-- AUTO_INCREMENT for table `tb_role`
--
ALTER TABLE `tb_role`
  MODIFY `role_id` tinyint(1) NOT NULL AUTO_INCREMENT COMMENT '??', AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tb_session`
--
ALTER TABLE `tb_session`
  ADD CONSTRAINT `fk_tb_session_employee` FOREIGN KEY (`employee_id`) REFERENCES `tb_employee` (`employee_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
