@echo off
echo ==============================================================
echo 🚜 Starting Agri-App Fleet Management & Billing Portal...
echo ==============================================================

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this machine!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b
)

echo.
if not exist "backend\node_modules" (
    echo [Setup] Installing Backend dependencies for first run...
    cd backend && call npm install && cd ..
)

if not exist "frontend\node_modules" (
    echo [Setup] Installing Frontend dependencies for first run...
    cd frontend && call npm install && cd ..
)

echo [1/2] Starting Express Backend (MongoDB Atlas)...
start "Agri-App Backend API (:5000)" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting Next.js Frontend (:3000)...
start "Agri-App Web Portal (:3000)" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ==============================================================
echo  Agri-App is now running!
echo  Frontend URL: http://localhost:3000
echo  Backend URL:  http://localhost:5000
echo ==============================================================
echo.
echo Opening browser...
start http://localhost:3000

exit
