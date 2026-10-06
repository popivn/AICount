@echo off
chcp 65001 >nul
cd /d "%~dp0\.."

set "PYTHON_EXE="
if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXE=venv\Scripts\python.exe"
) else if exist "..\venv\Scripts\python.exe" (
    set "PYTHON_EXE=..\venv\Scripts\python.exe"
) else if exist "C:\laragon\bin\python\python-3.13\python.exe" (
    set "PYTHON_EXE=C:\laragon\bin\python\python-3.13\python.exe"
) else (
    set "PYTHON_EXE=python"
)

"%PYTHON_EXE%" scripts\cron_scan_data.py %*
