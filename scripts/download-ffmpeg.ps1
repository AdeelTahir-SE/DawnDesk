# Download FFmpeg & FFprobe for Tauri Sidecar
# Downloads from gyan.dev (trusted Windows FFmpeg builds)

$ErrorActionPreference = "Stop"
$targetDir = Join-Path (Join-Path (Join-Path $PSScriptRoot "..") "src-tauri") "binaries"

if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$ffmpegTarget = Join-Path $targetDir "ffmpeg-x86_64-pc-windows-msvc.exe"
$ffprobeTarget = Join-Path $targetDir "ffprobe-x86_64-pc-windows-msvc.exe"

if ((Test-Path $ffmpegTarget) -and (Test-Path $ffprobeTarget)) {
    Write-Host "FFmpeg and FFprobe already exist in $targetDir" -ForegroundColor Green
    & $ffmpegTarget -version | Select-Object -First 1
    exit 0
}

$zipUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipFile = Join-Path $env:TEMP "ffmpeg-release-essentials.zip"
$extractDir = Join-Path $env:TEMP "ffmpeg-extract"

Write-Host "Downloading FFmpeg essentials build..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UseBasicParsing

Write-Host "Extracting..." -ForegroundColor Cyan
if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
Expand-Archive -Path $zipFile -DestinationPath $extractDir -Force

# Find the extracted folder (it has a version-named subfolder)
$innerDir = Get-ChildItem -Path $extractDir -Directory | Select-Object -First 1
$binDir = Join-Path $innerDir.FullName "bin"

Write-Host "Copying binaries to $targetDir..." -ForegroundColor Cyan
Copy-Item (Join-Path $binDir "ffmpeg.exe") $ffmpegTarget -Force
Copy-Item (Join-Path $binDir "ffprobe.exe") $ffprobeTarget -Force

# Cleanup
Remove-Item $zipFile -Force -ErrorAction SilentlyContinue
Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Done! FFmpeg sidecar binaries ready." -ForegroundColor Green
& $ffmpegTarget -version | Select-Object -First 1
