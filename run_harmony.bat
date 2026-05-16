@echo off
title Harmony Platform Launcher
echo Starting Harmony Backend...
start "Harmony Backend" cmd /k "cd Backend && npm start"

echo Starting Harmony Bot...
start "Harmony Bot" cmd /k "cd bot && npm start"

echo.
echo Both services are starting in separate windows.
echo Close the individual windows to stop the services.
pause
