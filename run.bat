@echo off
setlocal enabledelayedexpansion
title Vector-X - Autonomous AI Multi-Agent & Analytics Platform

echo.
echo ========================================================
echo        VECTOR-X : AUTONOMOUS DATA & SOC PLATFORM
echo ========================================================
echo.

:: Resolve project root
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:: Detect Python environment (.venv, venv, or system)
if exist "%PROJECT_ROOT%.venv\Scripts\python.exe" (
    echo [*] Using virtual environment: .venv
    set "PYTHON_EXE=%PROJECT_ROOT%.venv\Scripts\python.exe"
) else if exist "%PROJECT_ROOT%venv\Scripts\python.exe" (
    echo [*] Using virtual environment: venv
    set "PYTHON_EXE=%PROJECT_ROOT%venv\Scripts\python.exe"
) else (
    where python >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Python not found on PATH.
        echo Please install Python 3.10+ and add it to PATH.
        pause
        exit /b 1
    )
    set "PYTHON_EXE=python"
)

:: Check Node.js
where node >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js not found on PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: Check npm
where npm >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] npm not found on PATH.
    pause
    exit /b 1
)

:: Load .env safely if present
if exist ".env" (
    echo [*] Loading environment variables from .env ...
    for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
        if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"
    )
)

echo.
echo [1/2] Starting FastAPI backend on http://127.0.0.1:8000 ...
start "Vector-X - FastAPI Backend (Port 8000)" cmd /k "cd /d "%PROJECT_ROOT%" && "%PYTHON_EXE%" -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload"

:: Wait briefly for backend to initialize
timeout /t 2 /nobreak >nul

echo [2/2] Starting React (Vite) frontend on http://localhost:3000 ...
start "Vector-X - React Frontend (Port 3000)" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npm run dev"

:: Wait briefly then open browser
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================================
echo   Vector-X Full-Stack Application is Running!
echo ========================================================
echo.
echo   Frontend (React) : http://localhost:3000
echo   Backend (FastAPI): http://127.0.0.1:8000
echo   API Docs         : http://127.0.0.1:8000/docs
echo   Health Check     : http://127.0.0.1:8000/api/health
echo.
echo   To stop the application, close the two terminal windows.
echo ========================================================
echo.
pause
