@echo off
TITLE TelemetryIQ Dashboard - Setup and Run

echo =======================================================
echo   TelemetryIQ Project Setup & Execution Script
echo =======================================================
echo.

echo [1/6] Checking Frontend dependencies...
if not exist "node_modules\" (
    echo   - Frontend node_modules not found. Installing Dependencies...
    call npm install
) else (
    echo   - Frontend dependencies already installed.
)
echo.

echo [2/6] Checking Backend dependencies...
if not exist "server\node_modules\" (
    echo   - Backend node_modules not found. Installing Dependencies...
    cd server
    call npm install
    cd ..
) else (
    echo   - Backend dependencies already installed.
)
echo.

echo [3/6] Checking Agent dependencies...
if not exist "agent\node_modules\" (
    echo   - Agent node_modules not found. Installing Dependencies...
    cd agent
    call npm install
    cd ..
) else (
    echo   - Agent dependencies already installed.
)
echo.

echo [4/6] Starting Backend Server...
start "TelemetryIQ Backend" cmd /k "cd server && npm start"

:: Adding a small timeout to let the backend start before agent and frontend
timeout /t 3 /nobreak > NUL

echo [5/6] Starting Telemetry Agent...
start "TelemetryIQ Agent" cmd /k "cd agent && npm start"

echo [6/6] Starting Frontend Server...
start "TelemetryIQ Frontend" cmd /k "npm run dev"

echo.
echo =======================================================
echo   Project Started Successfully!
echo   * Backend, Agent, and Frontend are running in separate popup windows.
echo   * You can close this main window or press any key to exit it.
echo =======================================================
pause
