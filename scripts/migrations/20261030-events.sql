CREATE TABLE IF NOT EXISTS `tb_event` (
  `event_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(120) NOT NULL,
  `description` varchar(2000) NOT NULL DEFAULT '',
  `location` varchar(200) NOT NULL,
  `audience` enum('ALL_STAFF','LEADERS','EMPLOYEES') NOT NULL DEFAULT 'ALL_STAFF',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `created_by_employee_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`event_id`),
  KEY `idx_tb_event_starts_at` (`starts_at`),
  KEY `idx_tb_event_creator` (`created_by_employee_id`),
  CONSTRAINT `fk_tb_event_creator` FOREIGN KEY (`created_by_employee_id`) REFERENCES `tb_employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
