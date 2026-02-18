@echo off
echo ========================================
echo   PeptiPay Clean Restart Script
echo ========================================
echo.

echo [1/3] Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✓ All Node.js processes killed
) else (
    echo ℹ No Node.js processes found
)
echo.

echo [2/3] Waiting 3 seconds for cleanup...
timeout /t 3 /nobreak >nul
echo ✓ Ready to start
echo.

echo [3/3] Starting API server from ROOT folder...
echo.
echo ========================================
echo   Starting in MAINNET mode...
echo   Check console for:
echo   [ProviderService] network: 'mainnet', chainId: 56
echo ========================================
echo.

cd /d "e:\pepti-hub\payment-gateway"
pnpm dev
