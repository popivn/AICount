"""
Bộ điều phối Cron tổng hợp (All-in-one Cron Worker):
- Chạy quét thư mục `data` để đưa ảnh mới vào `data_queue`.
- Chạy xử lý AI cho các ảnh đang chờ, lưu sĩ số vào `room_number` và chuyển ảnh sang `data_processed`.
- Hỗ trợ chế độ chạy 1 lần (cho Cron bên ngoài gọi) hoặc lặp vô tận (cho chế độ Daemon/Service).

Cách dùng:
  python cron_worker.py               # Quét data và xử lý tất cả ảnh chờ
  python cron_worker.py --scan-only   # Chỉ quét data và nạp vào queue
  python cron_worker.py --process-only # Chỉ xử lý ảnh có sẵn trong queue
  python cron_worker.py --loop --interval 30 # Lặp liên tục mỗi 30 giây
"""

import sys
import os
import time
import argparse

# UTF-8 cho console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if SERVER_DIR not in sys.path:
    sys.path.insert(0, SERVER_DIR)

from scripts.cron_scan_data import scan_and_enqueue_images
from scripts.process_queue import process_queue_items


def run_cron_cycle(scan_only=False, process_only=False, pipeline=None, conf_thresh=0.36, verbose=True):
    if not process_only:
        scan_and_enqueue_images(verbose=verbose)

    if not scan_only:
        process_queue_items(pipeline=pipeline, conf_thresh=conf_thresh, verbose=verbose)


def main():
    parser = argparse.ArgumentParser(description="Cron Worker cho AI Attendance Pipeline")
    parser.add_argument('--scan-only', action='store_true', help="Chỉ quét thư mục data và nạp ảnh vào queue")
    parser.add_argument('--process-only', action='store_true', help="Chỉ xử lý các ảnh đang chờ trong queue")
    parser.add_argument('--conf', '--conf-thresh', dest='conf_thresh', type=float, default=0.36, 
                        help="Độ tin cậy nhận diện AI (mặc định: 0.36)")
    parser.add_argument('--loop', action='store_true', help="Chạy vòng lặp liên tục thay vì thoát sau 1 lần chạy")
    parser.add_argument('--interval', type=int, default=15, help="Khoảng thời gian nghỉ giữa các lần lặp (giây, mặc định 15)")
    args = parser.parse_args()

    # Nếu chạy lặp và cần xử lý, khởi tạo AI pipeline 1 lần để tái sử dụng bộ nhớ (Warm start)
    pipeline = None
    if not args.scan_only:
        print("[*] Khoi tao Pipeline AI dung chung...")
        from pipeline_fusion import UltimateClassroomPipeline
        pipeline = UltimateClassroomPipeline(use_gpu=False, use_p2pnet=False)

    if args.loop:
        print(f"[*] Bat dau che do Worker Daemon (Chu ky lap: {args.interval}s | Conf: {args.conf_thresh}). Nhan Ctrl+C de dung.")
        while True:
            try:
                run_cron_cycle(
                    scan_only=args.scan_only,
                    process_only=args.process_only,
                    pipeline=pipeline,
                    conf_thresh=args.conf_thresh,
                    verbose=True
                )
            except KeyboardInterrupt:
                print("\n[!] Da dung Cron Worker.")
                break
            except Exception as e:
                print(f"[-] Loi trong chu ky Cron: {e}", file=sys.stderr)

            time.sleep(args.interval)
    else:
        run_cron_cycle(
            scan_only=args.scan_only,
            process_only=args.process_only,
            pipeline=pipeline,
            conf_thresh=args.conf_thresh,
            verbose=True
        )


if __name__ == '__main__':
    main()
