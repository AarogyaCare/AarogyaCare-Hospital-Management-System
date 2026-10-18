@echo off
setlocal
if exist "C:\Program Files\JetBrains\IntelliJ IDEA 2025.1.1\plugins\maven\lib\maven3\bin\mvn.cmd" (
    call "C:\Program Files\JetBrains\IntelliJ IDEA 2025.1.1\plugins\maven\lib\maven3\bin\mvn.cmd" %*
) else (
    mvn %*
)
