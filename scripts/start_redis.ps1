# Start native Redis server
$baseDir = Split-Path -Parent $PSScriptRoot
$redisExe = "$baseDir\bin\redis\redis-server.exe"

Write-Host "Starting native Redis on 127.0.0.1:6379..."
Start-Process -FilePath $redisExe -ArgumentList "--port 6379 --bind 127.0.0.1" -NoNewWindow
