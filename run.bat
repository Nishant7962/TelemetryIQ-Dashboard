@echo off
TITLE TelemetryIQ Dashboard - Setup and Run

echo =======================================================
echo   TelemetryIQ Project Setup ^& Execution Script
echo =======================================================
echo.

:: ── Node.js Version Check ─────────────────────────────────────────────────
echo [0/6] Checking Node.js version...
for /f "tokens=1 delims=v." %%a in ('node -v 2^>nul') do set "NODE_MAJOR=%%a"
for /f "tokens=2 delims=v." %%a in ('node -v 2^>nul') do set "NODE_MAJOR=%%a"

node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo   [ERROR] Node.js is not installed or not in PATH!
    echo   Please install Node.js v18 or higher from https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f %%v in ('node -e "process.stdout.write(process.versions.node.split('.')[0])"') do set NODE_MAJOR=%%v

if %NODE_MAJOR% LSS 18 (
    echo.
    echo   [ERROR] Node.js v%NODE_MAJOR% is too old!
    echo   TelemetryIQ requires Node.js v18 or higher.
    echo   Please visit https://nodejs.org to upgrade.
    echo.
    pause
    exit /b 1
)
echo   - Node.js v%NODE_MAJOR% detected. OK!
echo.

:: ── Frontend Dependencies ─────────────────────────────────────────────────
echo [1/6] Checking Frontend dependencies...
if not exist "node_modules\" (
    echo   - node_modules not found. Installing Dependencies...
    call npm install
) else (
    echo   - Frontend dependencies already installed.
)
echo.

:: ── Backend Dependencies ──────────────────────────────────────────────────
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

:: ── Agent Dependencies ────────────────────────────────────────────────────
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

:: ── Start Backend ─────────────────────────────────────────────────────────
echo [4/6] Starting Backend Server...
start "TelemetryIQ Backend" cmd /k "cd server && npm start"

:: Wait for backend to boot before starting agent + frontend
timeout /t 4 /nobreak > NUL

:: ── Start Agent ───────────────────────────────────────────────────────────
echo [5/6] Starting Telemetry Agent...
start "TelemetryIQ Agent" cmd /k "cd agent && npm start"

:: ── Start Frontend ────────────────────────────────────────────────────────
echo [6/6] Starting Frontend Server...
start "TelemetryIQ Frontend" cmd /k "npm run dev"

echo.
echo =======================================================
echo   Project Started Successfully!
echo   * Frontend  : http://localhost:5173
echo   * Backend   : http://localhost:4000
echo   * 3 terminal windows opened (Backend, Agent, Frontend)
echo   * You can close this window or press any key to exit.
echo =======================================================
pause
