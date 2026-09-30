@echo off
title AI Classroom Monitoring - Khoi Chay Toan Bo He Thong
chcp 65001 >nul

cd /d "%~dp0"

echo ===================================================================
echo   KHOI CHAY HE THONG AI CLASSROOM MONITORING (CLIENT + SERVER)
echo ===================================================================
echo.

:: 1. Khoi chay Backend AI Server o cua so rieng
echo [1/3] Dang khoi dong Backend AI Server (Port 3838)...
start "AI Server (Port 3838)" cmd /k "cd /d ""%~dp0server"" && call run_server.bat"

:: Cho 2 giay de Server khoi dong
timeout /t 2 /nobreak >nul

:: 2. Khoi chay Frontend React Client o cua so rieng
echo [2/3] Dang khoi dong Frontend React Client (Port 3000)...
start "React Client (Port 3000)" cmd /k "cd /d ""%~dp0client"" && npm run dev"

:: 3. Tu dong mo trinh duyet sau 3 giay
echo [3/3] Dang mo trinh duyet tai: http://localhost:3000 ...
timeout /t 3 /nobreak >nul
start "" http://localhost:3000

echo.
echo ===================================================================
echo   [OK] Ca Client va Server da duoc khoi chay thanh cong!
echo   - Backend AI:  http://localhost:3838
echo   - Frontend UI: http://localhost:3000
echo ===================================================================
echo.
echo Cua so nay co the dong lai duoc.
pause
