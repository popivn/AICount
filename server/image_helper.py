import os
import re
from datetime import datetime
from typing import Optional, Dict, Any


def cat_ten_anh(file_path: str) -> Optional[Dict[str, Any]]:
    """
    Cắt tên ảnh từ điểm 'P.' để lấy thông tin phòng học, số camera, ngày và giờ.
    Bỏ qua mọi tiền tố (thư mục, mã đầu ghi, UUID, các dấu gạch chân trước đó...).

    Args:
        file_path (str): Đường dẫn hoặc tên file ảnh.
                         Ví dụ: "server/2550_0_4. P.202-01_20260923075304.png"
                                "orig_6bb2c3b5_2550_0_4._P.202-01_20260923073501.png"

    Returns:
        dict: Chứa các trường thông tin đã bóc tách hoặc None nếu không hợp lệ.
    """
    if not file_path or not isinstance(file_path, str):
        return None

    # 1. Lấy tên file gốc (loại bỏ đường dẫn thư mục / hoặc \)
    file_name = os.path.basename(file_path.replace("\\", "/"))

    # 2. Tìm vị trí xuất hiện của 'P.' (không phân biệt hoa/thường)
    match_p = re.search(r"p\.", file_name, re.IGNORECASE)
    if not match_p:
        return None

    p_index = match_p.start()
    chuoi_sau_p = file_name[p_index:]

    # 3. Regex bóc tách thông tin:
    # - Nhóm 1: Tên phòng & camera (từ 'P.' đến trước dấu gạch dưới timestamp)
    # - Nhóm 2-7: 14 chữ số thời gian: YYYYMMDDHHmmss
    pattern = r"^(p\.[^_]+)_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})"
    match = re.match(pattern, chuoi_sau_p, re.IGNORECASE)

    if not match:
        return {
            "chuoi_sau_p": chuoi_sau_p,
            "phong_day_du": chuoi_sau_p.split(".")[0],
            "ten_phong": chuoi_sau_p.split(".")[0],
        }

    phong_va_cam, nam, thang, ngay, gio, phut, giay = match.groups()

    # Tách phòng và camera (nếu có dấu '-')
    phan_tach = phong_va_cam.split("-")
    ten_phong = phan_tach[0]
    so_phong = re.sub(r"^p\.", "", ten_phong, flags=re.IGNORECASE)
    so_camera = phan_tach[1] if len(phan_tach) > 1 else None

    try:
        dt_obj = datetime(int(nam), int(thang), int(ngay), int(gio), int(phut), int(giay))
    except Exception:
        dt_obj = None

    return {
        "chuoi_sau_p": chuoi_sau_p,                      # "P.202-01_20260923075304.png"
        "phong_day_du": phong_va_cam,                    # "P.202-01"
        "ten_phong": ten_phong,                          # "P.202"
        "so_phong": so_phong,                            # "202"
        "so_camera": so_camera,                          # "01"
        "ngay": f"{nam}-{thang}-{ngay}",                 # "2026-09-23"
        "ngay_dinh_dang": f"{ngay}/{thang}/{nam}",        # "23/09/2026"
        "gio": f"{gio}:{phut}:{giay}",                   # "07:53:04"
        "thoi_gian_day_du": f"{nam}-{thang}-{ngay} {gio}:{phut}:{giay}", # "2026-09-23 07:53:04"
        "datetime": dt_obj,
    }


if __name__ == "__main__":
    test1 = r"server\2550_0_4. P.202-01_20260923075304.png"
    test2 = r"orig_6bb2c3b5_2550_0_4._P.202-01_20260923073501.png"

    print("Test 1:", cat_ten_anh(test1))
    print("Test 2:", cat_ten_anh(test2))
