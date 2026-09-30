@echo off
title AI Classroom Monitoring Backend Server (Port 3838)
chcp 65001 >nul

cd /d "%~dp0"

echo ========================================================
echo   AI CLASSROOM MONITORING - BACKEND SERVER (PORT 3838)
echo ========================================================
echo.

set "PYTHON_EXE="

:: 1. Kiem tra venv cuc bo neu co
if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXE=venv\Scripts\python.exe"
) else if exist "..\venv\Scripts\python.exe" (
    set "PYTHON_EXE=..\venv\Scripts\python.exe"
) else if exist "C:\laragon\bin\python\python-3.13\python.exe" (
    set "PYTHON_EXE=C:\laragon\bin\python\python-3.13\python.exe"
) else (
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        set "PYTHON_EXE=python"
    )
)

if "%PYTHON_EXE%"=="" (
    echo [LOI] Khong tim thay Python! Vui long kiem tra lai moi truong Python.
    pause
    exit /b 1
)

echo [*] Su dung Python tai: %PYTHON_EXE%
echo [*] May chu dang khoi chay tai: http://localhost:3838
echo.

"%PYTHON_EXE%" app.py

pause
