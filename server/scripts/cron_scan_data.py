"""
Cron Script: Quét thư mục `server/data` và đẩy danh sách ảnh mới vào `data_queue`.
- Được thiết kế để chạy định kỳ từ Cron Job ngoài (Windows Task Scheduler, Linux Crontab, hoặc Cron Runner riêng).
- Tự động bỏ qua các ảnh đã có trong `data_queue`.
"""

import sys
import os
import argparse
from datetime import datetime

# UTF-8 cho console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if SERVER_DIR not in sys.path:
    sys.path.insert(0, SERVER_DIR)

from config.database import get_db_connection

DATA_DIR = os.path.join(SERVER_DIR, 'data')
VALID_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}


def scan_and_enqueue_images(verbose=True):
    """
    Quét toàn bộ thư mục DATA_DIR, nếu có file ảnh mới thì chèn vào bảng data_queue với status = 0.
    Trả về: (total_found, new_enqueued, already_exists)
    """
    # 1. Đảm bảo thư mục data tồn tại
    os.makedirs(DATA_DIR, exist_ok=True)

    if verbose:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [*] Bat dau quét thu muc data: {DATA_DIR}")

    # 2. Lấy danh sách tất cả các file ảnh hợp lệ trong data/
    image_files = []
    try:
        for entry in os.scandir(DATA_DIR):
            if entry.is_file():
                ext = os.path.splitext(entry.name)[1].lower()
                if ext in VALID_EXTENSIONS:
                    image_files.append(entry.name)
    except Exception as e:
        print(f"[-] Loi doc thu muc data: {e}", file=sys.stderr)
        return 0, 0, 0

    total_found = len(image_files)
    if total_found == 0:
        if verbose:
            print(f"[i] Khong co file anh nao trong thu muc: {DATA_DIR}")
        return 0, 0, 0

    if verbose:
        print(f"[+] Tim thay {total_found} file anh trong thu muc data.")

    # 3. Kết nối CSDL và chèn các ảnh chưa có vào data_queue
    conn = get_db_connection()
    new_enqueued = 0
    already_exists = 0

    try:
        with conn.cursor() as cursor:
            # Lấy danh sách các image_name hiện đã có trong data_queue
            cursor.execute("SELECT image_name FROM data_queue")
            existing_rows = cursor.fetchall()
            existing_names = set(r['image_name'] for r in existing_rows)

            sql_insert = """
                INSERT INTO data_queue (image_name, status, create_at, update_at)
                VALUES (%s, 0, NOW(), NOW())
            """

            for img_name in image_files:
                if img_name in existing_names:
                    already_exists += 1
                    continue

                try:
                    cursor.execute(sql_insert, (img_name,))
                    existing_names.add(img_name)
                    new_enqueued += 1
                    if verbose:
                        print(f"    [+] Enqueued: {img_name} (status=0)")
                except Exception as insert_err:
                    print(f"    [-] Loi them file {img_name}: {insert_err}", file=sys.stderr)

        if verbose:
            print(f"[*] Ket qua scan: Tong {total_found} anh | +{new_enqueued} moi dua vao queue | {already_exists} da co tu truoc.")

        return total_found, new_enqueued, already_exists

    finally:
        conn.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Cron Job quét thư mục data và nạp ảnh vào data_queue")
    parser.add_argument('--silent', action='store_true', help="Chạy chế độ im lặng, chỉ in khi có lỗi")
    args = parser.parse_args()

    scan_and_enqueue_images(verbose=not args.silent)
