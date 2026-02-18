@echo off
echo ========================================
echo   Create Test Payment (Mainnet)
echo ========================================
echo.

echo Creating payment for 1 USDT on BSC Mainnet...
echo.

curl -X POST http://localhost:3000/api/v1/payments ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: ppt_204f0c894959e43cce92acce0aefd9d4417223a78d02f726d83b34c9d388b377" ^
  -d "{\"orderId\":\"test_%RANDOM%\",\"amount\":\"1\",\"currency\":\"USDT\",\"returnUrl\":\"https://example.com/return\",\"callbackUrl\":\"https://example.com/callback\"}"

echo.
echo.
echo ========================================
echo   Payment Created!
echo ========================================
echo.
echo Copy the "paymentAddress" from above
echo Send 1 USDT to that address from your wallet
echo Watch the console for detection!
echo.
pause
