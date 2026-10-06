"""
Cấu hình và tiện ích kết nối cơ sở dữ liệu MySQL cho Server Backend AI.
Không sử dụng file .env, các thông số cấu hình được quản lý trực tiếp tại đây.
"""

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# ==============================================================================
# 1. THÔNG SỐ CẤU HÌNH MYSQL (Thay đổi thông tin tương ứng với CSDL của bạn tại đây)
# ==============================================================================
DB_CONFIG = {
    'host': '127.0.0.1',          # Địa chỉ máy chủ MySQL (localhost / 127.0.0.1)
    'port': 3306,                 # Cổng MySQL mặc định
    'user': 'root',               # Tên người dùng MySQL
    'password': '',               # Mật khẩu người dùng (để trống nếu không có mật khẩu)
    'database': 'vttu_attendance',# Tên cơ sở dữ liệu
    'charset': 'utf8mb4',         # Bảng mã hỗ trợ đầy đủ tiếng Việt có dấu
    'connect_timeout': 10,        # Thời gian chờ kết nối tối đa (giây)
    'autocommit': True,           # Tự động commit các thao tác INSERT/UPDATE
}


# ==============================================================================
# 2. HÀM TẠO KẾT NỐI (Hỗ trợ pymysql hoặc mysql.connector)
# ==============================================================================
def get_db_connection():
    """
    Tạo và trả về một kết nối mới tới cơ sở dữ liệu MySQL.
    Tự động ưu tiên thư viện `pymysql`, nếu không có sẽ thử `mysql.connector`.
    """
    # Cách 1: Thử sử dụng PyMySQL (Khuyên dùng - thuần Python, không cần build C)
    try:
        import pymysql
        import pymysql.cursors

        connection = pymysql.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database=DB_CONFIG['database'],
            charset=DB_CONFIG['charset'],
            cursorclass=pymysql.cursors.DictCursor,  # Trả về kết quả dạng dictionary: {'id': 1, 'ten': '...'}
            connect_timeout=DB_CONFIG['connect_timeout'],
            autocommit=DB_CONFIG['autocommit']
        )
        return connection
    except ImportError:
        pass

    # Cách 2: Thử sử dụng mysql-connector-python của Oracle
    try:
        import mysql.connector

        connection = mysql.connector.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database=DB_CONFIG['database'],
            charset=DB_CONFIG['charset'],
            connection_timeout=DB_CONFIG['connect_timeout'],
            autocommit=DB_CONFIG['autocommit']
        )
        return connection
    except ImportError:
        pass

    raise RuntimeError(
        "Chưa cài đặt driver MySQL cho Python!\n"
        "Vui lòng chạy lệnh sau để cài đặt driver PyMySQL:\n"
        "    pip install pymysql"
    )


# ==============================================================================
# 3. CÁC HÀM TIỆN ÍCH THỰC THI TRUY VẤN
# ==============================================================================
def test_db_connection() -> bool:
    """
    Kiểm tra trạng thái kết nối tới CSDL MySQL.
    Trả về True nếu kết nối thành công, False nếu thất bại.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 AS check_status")
            result = cursor.fetchone()
            print(f"[+] Kết nối MySQL thành công! (Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}, DB: {DB_CONFIG['database']})")
        conn.close()
        return True
    except Exception as e:
        print(f"[-] Kết nối MySQL thất bại: {e}", file=sys.stderr)
        return False


def execute_query(sql: str, params: tuple = None) -> int:
    """
    Thực thi câu lệnh INSERT, UPDATE, DELETE.
    Trả về ID bản ghi vừa thêm (nếu INSERT) hoặc số dòng bị ảnh hưởng.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            affected_rows = cursor.execute(sql, params or ())
            # Trả về lastrowid nếu có (cho INSERT)
            last_id = getattr(cursor, 'lastrowid', None)
            return last_id if last_id else affected_rows
    finally:
        conn.close()


def fetch_one(sql: str, params: tuple = None):
    """
    Truy vấn lấy ra 1 dòng kết quả dạng dict (hoặc None nếu không tìm thấy).
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, params or ())
            return cursor.fetchone()
    finally:
        conn.close()


def fetch_all(sql: str, params: tuple = None) -> list:
    """
    Truy vấn lấy ra danh sách tất cả các dòng kết quả dạng list[dict].
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, params or ())
            return cursor.fetchall() or []
    finally:
        conn.close()


if __name__ == '__main__':
    print("=" * 60)
    print("  KIỂM TRA CẤU HÌNH KẾT NỐI MYSQL")
    print("=" * 60)
    print(f"Host:     {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"User:     {DB_CONFIG['user']}")
    print(f"Database: {DB_CONFIG['database']}")
    print("-" * 60)
    test_db_connection()
