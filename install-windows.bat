@echo off
title MeasureCount Pro - Windows Installer
color 0A

echo ========================================
echo   MeasureCount Pro - Windows Installer
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running as Administrator
) else (
    echo [INFO] Running as standard user (OK for PWA install)
)
echo.

:: Get the current directory
set "APP_DIR=%~dp0"
set "APP_URL=file:///%APP_DIR:\=/%index.html"

echo App Location: %APP_DIR%
echo App URL: %APP_URL%
echo.

:: Create desktop shortcut
echo [1/3] Creating desktop shortcut...
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP_DIR%\MeasureCount Pro.lnk"

:: Create shortcut using PowerShell
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = 'msedge'; $Shortcut.Arguments = '--app=%APP_URL%'; $Shortcut.WorkingDirectory = '%APP_DIR%'; $Shortcut.IconLocation = '%APP_DIR%\icons\icon-192.ico'; $Shortcut.Description = 'MeasureCount Pro - AR Measurement and AI Counting'; $Shortcut.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [OK] Desktop shortcut created: %SHORTCUT_PATH%
) else (
    echo [WARN] Could not create desktop shortcut
    echo       You can manually create a shortcut to: %APP_URL%
)
echo.

:: Create Start Menu shortcut
echo [2/3] Creating Start Menu shortcut...
set "STARTMENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
set "SHORTCUT_SM=%STARTMENU_DIR%\MeasureCount Pro.lnk"

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_SM%'); $Shortcut.TargetPath = 'msedge'; $Shortcut.Arguments = '--app=%APP_URL%'; $Shortcut.WorkingDirectory = '%APP_DIR%'; $Shortcut.Description = 'MeasureCount Pro - AR Measurement and AI Counting'; $Shortcut.Save()"

if exist "%SHORTCUT_SM%" (
    echo [OK] Start Menu shortcut created
) else (
    echo [WARN] Could not create Start Menu shortcut
)
echo.

:: Try to install as PWA using Edge
echo [3/3] Attempting to install as PWA...
echo.
echo NOTE: If a browser window opens, please:
echo   1. Click the Apps menu (three dots)
echo   2. Select "Apps" -\> "Install MeasureCount Pro"
echo   3. Click "Install"
echo.
echo This will give you the best app experience!
echo.
pause

:: Open the app in Edge
echo Opening MeasureCount Pro...
start msedge "%APP_URL%"

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo The app can be accessed from:
echo   - Desktop shortcut
echo   - Start Menu
echo   - Browser: %APP_URL%
echo.
echo For the best experience, install as PWA
echo from the browser's Apps menu.
echo.
pause
