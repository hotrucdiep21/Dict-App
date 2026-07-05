@echo off
title Antigravity Dictation - Stopper
echo ===================================================
echo   Stopping Antigravity Dictation App...
echo ===================================================
echo.

docker compose down

echo.
echo ===================================================
echo   Containers shut down successfully!
echo   Press any key to close this window.
echo ===================================================
pause > NUL
