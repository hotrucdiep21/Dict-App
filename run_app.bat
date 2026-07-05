@echo off
title Antigravity Dictation - Launcher
echo ===================================================
echo   Starting Antigravity Dictation App...
echo ===================================================
echo.

docker compose up -d

echo.
echo ===================================================
echo   Waiting for services to initialize (3s)...
echo ===================================================
timeout /t 3 /nobreak > NUL

echo.
echo   Opening browser to http://localhost:5173/ ...
start http://localhost:5173/

echo.
echo ===================================================
echo   App is running successfully in the background!
echo   You can close this window now.
echo   To stop the app later, run 'stop_app.bat'.
echo ===================================================
timeout /t 5 > NUL
