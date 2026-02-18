# Kill all Node.js processes
Write-Host "Killing all Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Verify all killed
$remainingNodes = Get-Process node -ErrorAction SilentlyContinue
if ($remainingNodes) {
    Write-Host "Warning: Some Node processes still running!" -ForegroundColor Red
    $remainingNodes | Format-Table -Property Id, ProcessName, StartTime
} else {
    Write-Host "All Node.js processes killed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting API Server in MAINNET mode..." -ForegroundColor Cyan
Write-Host "Watch for these lines:" -ForegroundColor Yellow
Write-Host "  [ENV] BLOCKCHAIN_NETWORK = mainnet" -ForegroundColor Gray
Write-Host "  [ProviderService] Initialized: network mainnet chainId 56" -ForegroundColor Gray
Write-Host ""

# Change to API directory and start
Set-Location "e:\pepti-hub\payment-gateway\packages\api"
pnpm dev
