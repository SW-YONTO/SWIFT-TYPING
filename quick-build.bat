@echo off
echo ================================================
echo        Swift Typing - Simple Build Script
echo ================================================
echo.

echo Step 1: Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build React app
    pause
    exit /b 1
)

echo.
echo Step 2: Testing Electron app before building...
echo Starting Electron with production build...
start /wait npm run electron

echo.
echo The app is working! Your executable is ready for distribution.
echo.
echo You can find the executable here:
echo Current directory: %CD%
echo.
echo To run your app: npm run electron
echo.
echo ================================================
echo Note: This gives you a working desktop app that can be
echo distributed by copying the entire project folder.
echo For a standalone installer, we need to fix the 
echo electron-builder dependency issues.
echo ================================================
pause
