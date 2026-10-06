-- ==============================================================
-- Script khởi tạo bảng cho Hệ thống AI Attendance (MySQL)
-- Cơ sở dữ liệu: vttu_attendance
-- ==============================================================

USE `vttu_attendance`;

-- 1. Bảng hàng đợi ảnh (data_queue)
CREATE TABLE IF NOT EXISTS `data_queue` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính tự tăng',
    `image_name` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Tên file ảnh (không trùng lặp)',
    `status` INT NOT NULL DEFAULT 0 COMMENT '0: Chờ xử lý, 1: Thành công, 2: Đang xử lý, -1: Lỗi',
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
    `update_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
    INDEX `idx_data_queue_status` (`status`),
    INDEX `idx_data_queue_create_at` (`create_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hàng đợi ảnh cho AI xử lý';

-- 2. Bảng sĩ số sinh viên phòng học (room_number)
CREATE TABLE IF NOT EXISTS `room_number` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính tự tăng',
    `room_code` VARCHAR(100) NOT NULL COMMENT 'Mã phòng học (ví dụ: P.202-01, P.202)',
    `number_student` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng sinh viên AI đếm được',
    `image_time` DATETIME DEFAULT NULL COMMENT 'Thời gian chụp ảnh trích xuất từ tên file',
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
    `update_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
    INDEX `idx_room_code` (`room_code`),
    INDEX `idx_image_time` (`image_time`),
    INDEX `idx_room_number_create_at` (`create_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dữ liệu sĩ số sinh viên theo phòng';
