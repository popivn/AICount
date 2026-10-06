"""
Package config - Quản lý toàn bộ cấu hình máy chủ Backend AI.
"""

from .database import (
    DB_CONFIG,
    get_db_connection,
    test_db_connection,
    execute_query,
    fetch_one,
    fetch_all,
)

__all__ = [
    'DB_CONFIG',
    'get_db_connection',
    'test_db_connection',
    'execute_query',
    'fetch_one',
    'fetch_all',
]
