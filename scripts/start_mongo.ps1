# Start native MongoDB server
$baseDir = Split-Path -Parent $PSScriptRoot
$mongoExe = "$baseDir\bin\mongo\mongodb-win32-x86_64-windows-7.0.14\bin\mongod.exe"
$dataPath = "$baseDir\data\mongo"

if (!(Test-Path $dataPath)) {
    New-Item -ItemType Directory -Force -Path $dataPath | Out-Null
}

Write-Host "Starting native MongoDB 7.0 on 127.0.0.1:27017..."
Start-Process -FilePath $mongoExe -ArgumentList "--dbpath `"$dataPath`" --port 27017 --bind_ip 127.0.0.1" -NoNewWindow
