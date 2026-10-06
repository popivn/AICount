/**
 * Tiện ích cắt tên ảnh và phân tích thông tin phòng học, thời gian
 */

/**
 * Cắt tên ảnh từ điểm 'P.' và trích xuất thông tin phòng học, số camera, ngày và giờ.
 * Bỏ qua mọi tiền tố (thư mục, uuid, mã camera NVR, các dấu gạch chân phía trước...).
 *
 * @param {string} filePath - Đường dẫn hoặc tên file (ví dụ: "server\\2550_0_4. P.202-01_20260923075304.png")
 * @returns {object|null}
 */
export function catTenAnh(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;

  // 1. Tách lấy tên file gốc (loại bỏ thư mục server/ hoặc server\)
  const fileName = filePath.split(/[/\\]/).pop();

  // 2. Tìm vị trí xuất hiện của 'P.' (không phân biệt hoa/thường)
  const pIndex = fileName.search(/p\./i);
  if (pIndex === -1) {
    console.warn("Không tìm thấy ký tự 'P.' trong tên file:", fileName);
    return null;
  }

  // Chuỗi tính từ 'P.' trở về sau, ví dụ: "P.202-01_20260923075304.png"
  const chuoiSauP = fileName.substring(pIndex);

  // 3. Regex bóc tách:
  // - Nhóm 1: Tên phòng & camera (ví dụ: P.202-01 hoặc P.202)
  // - Nhóm 2-7: Năm(4), Tháng(2), Ngày(2), Giờ(2), Phút(2), Giây(2)
  const pattern = /^(p\.[^_]+)_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/i;
  const match = chuoiSauP.match(pattern);

  if (!match) {
    return {
      chuoiSauP,
      phongDayDu: chuoiSauP.split('.')[0] || '',
      tenPhong: chuoiSauP.split('.')[0] || '',
    };
  }

  const [_, phongVaCam, nam, thang, ngay, gio, phut, giay] = match;

  // Tách riêng mã phòng và camera (nếu có dấu '-')
  const phanTachPhong = phongVaCam.split('-');
  const tenPhong = phanTachPhong[0];              // "P.202"
  const soPhong = tenPhong.replace(/p\./i, '');   // "202"
  const soCamera = phanTachPhong[1] || null;      // "01" (nếu có)

  return {
    chuoiSauP,                                    // "P.202-01_20260923075304.png"
    phongDayDu: phongVaCam,                      // "P.202-01"
    tenPhong,                                    // "P.202"
    soPhong,                                     // "202"
    soCamera,                                    // "01"
    ngay: `${nam}-${thang}-${ngay}`,             // "2026-09-23"
    ngayDinhDang: `${ngay}/${thang}/${nam}`,      // "23/09/2026"
    gio: `${gio}:${phut}:${giay}`,               // "07:53:04"
    thoiGianDayDu: `${nam}-${thang}-${ngay} ${gio}:${phut}:${giay}`, // "2026-09-23 07:53:04"
    thoiGianDate: new Date(`${nam}-${thang}-${ngay}T${gio}:${phut}:${giay}`),
  };
}

export default catTenAnh;
