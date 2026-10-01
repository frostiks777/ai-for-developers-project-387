@echo off
cd /d "%~dp0"
echo Starting frontend + backend...
call npm run dev:all
pause
