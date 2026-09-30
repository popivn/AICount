@echo off
title AI Classroom Monitoring Web Server (Port 3838)
chcp 65001 >nul

cd /d "%~dp0"

echo ========================================================
echo   HE THONG AI GIAM SAT & DIEM DANH LOP HOC (PORT 3838)
echo   Model: YOLOv8-Pose (Khung xuong) + P2PNet (Dau nguoi)
echo ========================================================
echo.

set "PYTHON_EXE="

:: 1. Uu tien dung Python cua Laragon
if exist "C:\laragon\bin\python\python-3.13\python.exe" (
    set "PYTHON_EXE=C:\laragon\bin\python\python-3.13\python.exe"
) else (
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        set "PYTHON_EXE=python"
    )
)

if "%PYTHON_EXE%"=="" (
    echo [LOI] Khong tim thay Python!
    echo Vui long kiem tra lai C:\laragon\bin\python\python-3.13 hoac cai dat Python.
    echo.
    pause
    exit /b 1
)

echo [*] Su dung Python tai: %PYTHON_EXE%
echo [*] Dang khoi chay may chu web tai: http://localhost:3838
echo [*] Cua so trinh duyet se tu dong mo sau 3 giay...
echo.

:: Tu dong mo trinh duyet sau 3 giay
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3838"

:: Chay may chu Flask
"%PYTHON_EXE%" app.py

echo.
echo [!] Chuong trinh da dung lai.
pause
