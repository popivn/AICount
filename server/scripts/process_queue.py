"""
Script xử lý hàng đợi AI (`process_queue.py`):
1. Lấy danh sách ảnh có status = 0 (chờ xử lý) từ bảng `data_queue`.
2. Đánh dấu status = 2 (đang xử lý).
3. Chạy Pipeline AI để phát hiện và đếm số lượng sinh viên trong ảnh.
4. Trích xuất mã phòng học (`room_code`) từ tên file ảnh (ví dụ `P.202-01`, `P.202`).
5. Nếu thành công:
   - Lưu kết quả vào bảng `room_number` (id, room_code, number_student, create_at, update_at).
   - Di chuyển file ảnh sang thư mục `server/data_processed` (tự tạo nếu chưa có).
   - Cập nhật bảng `data_queue` với status = 1 (thành công).
6. Nếu thất bại: Cập nhật status = -1 (lỗi).
"""

import sys
import os
import re
import shutil
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
PROCESSED_DIR = os.path.join(SERVER_DIR, 'data_processed')

# Độ tin cậy mặc định cho AI nhận diện khi chạy Cron
DEFAULT_CONF_THRESH = 0.36


def extract_room_code(image_name: str) -> str:
    """
    Trích xuất mã phòng từ tên file ảnh.
    Ví dụ:
      - '2550_0_4. P.202-01_20260923075304.png'  -> 'P.202-01'
      - 'P.301_cam1_2026.jpg'                    -> 'P.301'
      - 'phong_204_02.png'                       -> 'P.204-02'
      - 'A102.png'                               -> 'A102'
    """
    # 1. Định dạng chuẩn: P.xxx-xx hoặc P.xxx (ví dụ: P.202-01, P.202, P.305-A)
    m = re.search(r'(?:^|[\s_\.])(P\.\d+(?:-[A-Za-z0-9]+)?)(?:[_\s\.]|$)', image_name, re.IGNORECASE)
    if m:
        return m.group(1).upper()

    # 2. Định dạng Pxxx hoặc Pxxx-xx (ví dụ: P202, P202-01)
    m = re.search(r'(?:^|[\s_\.])(P\d+(?:-[A-Za-z0-9]+)?)(?:[_\s\.]|$)', image_name, re.IGNORECASE)
    if m:
        return m.group(1).upper()

    # 3. Tiền tố room_xxx hoặc phong_xxx
    m = re.search(r'(?:room|phong)[_\-\s]*([A-Za-z0-9\.\-]+)', image_name, re.IGNORECASE)
    if m:
        return m.group(1).upper()

    # 4. Dự phòng: Lấy phần tên cơ sở (bỏ đuôi mở rộng)
    base_name = os.path.splitext(image_name)[0]
    return base_name[:50]


def extract_image_time(image_name: str):
    """
    Trích xuất ngày giờ chụp ảnh từ tên file ảnh.
    Trả về chuỗi chuẩn 'YYYY-MM-DD HH:MM:SS' phù hợp với cột DATETIME của MySQL.
    Hỗ trợ:
      - '2550_0_4. P.202-01_20260923075304.png' -> '2026-09-23 07:53:04'
      - 'P.202_20260923_075304.jpg'             -> '2026-09-23 07:53:04'
      - '2026-09-23-07-53-04.png'               -> '2026-09-23 07:53:04'
      - Nếu không tìm thấy, trả về None (hoặc NULL trong DB).
    """
    # Định dạng đầy đủ ngày giờ: YYYYMMDDHHmmss hoặc YYYYMMDD_HHmmss
    m = re.search(r'(?:^|[^\d])(20\d{2})[-_]?(0[1-9]|1[0-2])[-_]?(0[1-9]|[12]\d|3[01])[_\-T\s]?([01]\d|2[0-3])[-_:]?([0-5]\d)[-_:]?([0-5]\d)(?:[^\d]|$)', image_name)
    if m:
        y, mo, d, h, mi, s = m.groups()
        return f"{y}-{mo}-{d} {h}:{mi}:{s}"

    # Định dạng chỉ có ngày: YYYYMMDD
    m2 = re.search(r'(?:^|[^\d])(20\d{2})[-_]?(0[1-9]|1[0-2])[-_]?(0[1-9]|[12]\d|3[01])(?:[^\d]|$)', image_name)
    if m2:
        y, mo, d = m2.groups()
        return f"{y}-{mo}-{d} 00:00:00"

    return None


def process_queue_items(pipeline=None, max_items=None, conf_thresh=DEFAULT_CONF_THRESH, verbose=True):
    """
    Lấy các mục pending trong data_queue và tiến hành xử lý qua AI Pipeline với độ tin cậy conf_thresh (mặc định 0.36).
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Lấy các bản ghi cần xử lý (status = 0: chờ xử lý)
            query = "SELECT id, image_name FROM data_queue WHERE status = 0 ORDER BY create_at ASC"
            if max_items and max_items > 0:
                query += f" LIMIT {int(max_items)}"
            
            cursor.execute(query)
            pending_items = cursor.fetchall()

        if not pending_items:
            if verbose:
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [i] data_queue khong co anh nao cho xu ly (status = 0).")
            return 0

        if verbose:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [*] Co {len(pending_items)} anh can xu ly trong hang doi. (Do tin cay AI: {conf_thresh})")

        # 2. Khởi tạo Pipeline AI nếu chưa truyền vào
        if pipeline is None:
            if verbose:
                print("[*] Dang khoi tao mo hinh AI (UltimateClassroomPipeline)...")
            from pipeline_fusion import UltimateClassroomPipeline
            pipeline = UltimateClassroomPipeline(use_gpu=False, use_p2pnet=False)
            if verbose:
                print("[+] Mo hinh AI da san sang!")

        success_count = 0

        for item in pending_items:
            queue_id = item['id']
            image_name = item['image_name']
            src_image_path = os.path.join(DATA_DIR, image_name)

            if verbose:
                print("-" * 50)
                print(f"[*] Dang xu ly item [ID={queue_id}]: {image_name}")

            # Đánh dấu status = 2 (Đang xử lý)
            with conn.cursor() as cursor:
                cursor.execute("UPDATE data_queue SET status = 2, update_at = NOW() WHERE id = %s", (queue_id,))

            # Kiểm tra file vật lý tồn tại trong server/data
            if not os.path.exists(src_image_path):
                print(f"    [-] LOI: Khong tim thay file vat ly tai: {src_image_path}", file=sys.stderr)
                with conn.cursor() as cursor:
                    cursor.execute("UPDATE data_queue SET status = -1, update_at = NOW() WHERE id = %s", (queue_id,))
                continue

            try:
                # Đường dẫn ảnh đầu ra trong thư mục data_processed
                dest_image_path = os.path.join(PROCESSED_DIR, image_name)
                # Nếu file đã tồn tại ở data_processed, thêm timestamp để tránh ghi đè
                if os.path.exists(dest_image_path):
                    name_part, ext_part = os.path.splitext(image_name)
                    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
                    dest_image_path = os.path.join(PROCESSED_DIR, f"{name_part}_{ts}{ext_part}")

                # 3. Chạy dự đoán AI VÀ VẼ KẾT QUẢ TRỰC QUAN với độ tin cậy conf_thresh = 0.36
                res = pipeline.predict(src_image_path, output_path=dest_image_path, conf_thresh=conf_thresh)
                student_count = res.get('total_students', 0)
                room_code = extract_room_code(image_name)
                image_time = extract_image_time(image_name)

                if verbose:
                    print(f"    [+] Ket qua AI: Phong = {room_code} | Si so = {student_count} | Conf = {conf_thresh} | Thoi gian anh = {image_time or 'N/A'}")
                    print(f"    [+] Da ve box/marker AI va luu anh output tai: {dest_image_path}")

                # 4. Luu vao bang room_number (bao gom cot image_time)
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO room_number (room_code, number_student, image_time, create_at, update_at)
                        VALUES (%s, %s, %s, NOW(), NOW())
                    """, (room_code, student_count, image_time))

                # 5. Xoa file anh nguon trong thu muc data de giai phong bo nho
                if os.path.exists(src_image_path):
                    try:
                        os.remove(src_image_path)
                        if verbose:
                            print(f"    [+] Da don dep anh goc trong thu muc data: {image_name}")
                    except Exception as rm_err:
                        print(f"    [!] Canh bao: Khong the xoa anh goc trong data: {rm_err}", file=sys.stderr)

                # 6. Cap nhat status = 1 (Thanh cong) trong data_queue
                with conn.cursor() as cursor:
                    cursor.execute("UPDATE data_queue SET status = 1, update_at = NOW() WHERE id = %s", (queue_id,))

                success_count += 1
                if verbose:
                    print(f"    [✓] Hoan tat xu ly [ID={queue_id}] -> status = 1 (Thanh cong)")

            except Exception as proc_err:
                print(f"    [-] LOI khi chay AI tren file {image_name}: {proc_err}", file=sys.stderr)
                # Đánh dấu lỗi trong data_queue
                with conn.cursor() as cursor:
                    cursor.execute("UPDATE data_queue SET status = -1, update_at = NOW() WHERE id = %s", (queue_id,))

        if verbose:
            print("=" * 50)
            print(f"[*] Ket qua: Da xu ly thanh cong {success_count}/{len(pending_items)} anh (Conf: {conf_thresh}).")

        return success_count

    finally:
        conn.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Xử lý ảnh trong data_queue qua AI và lưu kết quả vào room_number")
    parser.add_argument('--limit', type=int, default=None, help="Số lượng ảnh tối đa cần xử lý trong 1 lần chạy")
    parser.add_argument('--conf', '--conf-thresh', dest='conf_thresh', type=float, default=DEFAULT_CONF_THRESH, 
                        help=f"Độ tin cậy nhận diện AI (mặc định: {DEFAULT_CONF_THRESH})")
    parser.add_argument('--silent', action='store_true', help="Chạy chế độ im lặng")
    args = parser.parse_args()

    process_queue_items(max_items=args.limit, conf_thresh=args.conf_thresh, verbose=not args.silent)
