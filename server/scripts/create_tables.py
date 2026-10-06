"""
Script khởi tạo bảng dữ liệu trong CSDL MySQL (vttu_attendance).
Tạo 2 bảng:
  1. `data_queue`: Hàng đợi các ảnh cần quét và xử lý AI.
  2. `room_number`: Lưu thông tin sĩ số sinh viên theo phòng sau khi AI xử lý thành công.
"""

import sys
import os

# Thiet lap UTF-8 cho console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Import database module tu server/config
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if SERVER_DIR not in sys.path:
    sys.path.insert(0, SERVER_DIR)

from config.database import get_db_connection, DB_CONFIG


SQL_CREATE_DATA_QUEUE = """
CREATE TABLE IF NOT EXISTS `data_queue` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh tu tang',
    `image_name` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Ten file anh (khong trung lap)',
    `status` INT NOT NULL DEFAULT 0 COMMENT '0: Cho xu ly, 1: Thanh cong, 2: Dang xu ly, -1: Loi',
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thoi gian tao',
    `update_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thoi gian cap nhat',
    INDEX `idx_data_queue_status` (`status`),
    INDEX `idx_data_queue_create_at` (`create_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hang doi anh cho AI xu ly';
"""

SQL_CREATE_ROOM_NUMBER = """
CREATE TABLE IF NOT EXISTS `room_number` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh tu tang',
    `room_code` VARCHAR(100) NOT NULL COMMENT 'Ma phong hoc (vi du: P.202-01, P.202)',
    `number_student` INT NOT NULL DEFAULT 0 COMMENT 'So luong sinh vien AI dem duoc',
    `image_time` DATETIME DEFAULT NULL COMMENT 'Thoi gian chup anh trich xuat tu ten file',
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thoi gian tao',
    `update_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thoi gian cap nhat',
    INDEX `idx_room_code` (`room_code`),
    INDEX `idx_image_time` (`image_time`),
    INDEX `idx_room_number_create_at` (`create_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Du lieu si so sinh vien theo phong';
"""


def init_database_tables():
    print("=" * 60)
    print("  KHOI TAO BANG CSDL CHO HE THONG AI ATTENDANCE")
    print("=" * 60)
    print(f"[*] Ket noi toi DB: {DB_CONFIG['database']} tai {DB_CONFIG['host']}:{DB_CONFIG['port']}")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Tao bang data_queue
            print("[*] Dang tao bang `data_queue`...")
            cursor.execute(SQL_CREATE_DATA_QUEUE)
            print("[+] Bang `data_queue` da san sang! (id, image_name, status, create_at, update_at)")

            # 2. Tao bang room_number
            print("[*] Dang tao bang `room_number`...")
            cursor.execute(SQL_CREATE_ROOM_NUMBER)
            
            # Kiem tra neu cot image_time chua co (truong hop bang da tao tu truoc)
            cursor.execute("""
                SELECT COUNT(*) as cnt 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'room_number' AND COLUMN_NAME = 'image_time'
            """, (DB_CONFIG['database'],))
            row = cursor.fetchone()
            if row and row.get('cnt', 0) == 0:
                print("[*] Dang them cot `image_time` vao bang `room_number`...")
                cursor.execute("""
                    ALTER TABLE `room_number` 
                    ADD COLUMN `image_time` DATETIME DEFAULT NULL COMMENT 'Thoi gian chup anh trich xuat tu ten file' 
                    AFTER `number_student`
                """)
                cursor.execute("ALTER TABLE `room_number` ADD INDEX `idx_image_time` (`image_time`)")
                print("[+] Da them cot `image_time` thanh cong!")

            print("[+] Bang `room_number` da san sang! (id, room_code, number_student, image_time, create_at, update_at)")

        print("-" * 60)
        print("[THÀNH CÔNG] Tất cả các bảng đã được khởi tạo hoàn tất!")
        print("=" * 60)
    except Exception as e:
        print(f"[-] LOI KHOI TAO BANG: {e}", file=sys.stderr)
        raise e
    finally:
        conn.close()


if __name__ == '__main__':
    init_database_tables()
