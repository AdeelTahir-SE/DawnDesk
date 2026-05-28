param(
    [string]$MediaFile = "test_video.mp4"
)

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Media Operations Verification Menu   " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "1. Test Media Probe (ffprobe)"
    Write-Host "   -> Checks if ffprobe can read file metadata and streams."
    Write-Host "2. Test Thumbnail Generation (ffmpeg)"
    Write-Host "   -> Extracts a single frame at 1-second mark."
    Write-Host "3. Test Audio Extraction (ffmpeg)"
    Write-Host "   -> Strips video and extracts raw audio stream."
    Write-Host "4. Test Video Trimming (ffmpeg)"
    Write-Host "   -> Creates a 2-second trimmed clip."
    Write-Host "5. Run All Tests"
    Write-Host "   -> Runs tests 1 through 4 sequentially."
    Write-Host "Q. Quit"
    Write-Host "========================================" -ForegroundColor Cyan
}

function Test-Probe {
    Write-Host "`n[Test 1] Probing Media: $MediaFile" -ForegroundColor Yellow
    if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: ffprobe is not installed or not in PATH." -ForegroundColor Red
        return
    }
    $output = ffprobe -v error -show_format -show_streams $MediaFile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Media probed successfully." -ForegroundColor Green
        $output | Select-Object -First 10
        Write-Host "...(output truncated for brevity)" -ForegroundColor DarkGray
    } else {
        Write-Host "FAILED: $output" -ForegroundColor Red
    }
}

function Test-Thumbnail {
    Write-Host "`n[Test 2] Generating Thumbnail for: $MediaFile" -ForegroundColor Yellow
    if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: ffmpeg is not installed or not in PATH." -ForegroundColor Red
        return
    }
    $outFile = "test_output_thumbnail.jpg"
    if (Test-Path $outFile) { Remove-Item $outFile }
    $output = ffmpeg -y -i $MediaFile -ss 00:00:01.000 -vframes 1 $outFile 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path $outFile)) {
        Write-Host "SUCCESS: Thumbnail generated -> $outFile" -ForegroundColor Green
    } else {
        Write-Host "FAILED: $output" -ForegroundColor Red
    }
}

function Test-ExtractAudio {
    Write-Host "`n[Test 3] Extracting Audio from: $MediaFile" -ForegroundColor Yellow
    $outFile = "test_output_audio.aac"
    if (Test-Path $outFile) { Remove-Item $outFile }
    $output = ffmpeg -y -i $MediaFile -vn -acodec copy $outFile 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path $outFile)) {
        Write-Host "SUCCESS: Audio extracted -> $outFile" -ForegroundColor Green
    } else {
        Write-Host "FAILED: $output" -ForegroundColor Red
    }
}

function Test-TrimVideo {
    Write-Host "`n[Test 4] Trimming Video: $MediaFile" -ForegroundColor Yellow
    $outFile = "test_output_trimmed.mp4"
    if (Test-Path $outFile) { Remove-Item $outFile }
    $output = ffmpeg -y -i $MediaFile -ss 00:00:00 -t 00:00:02 -c copy $outFile 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path $outFile)) {
        Write-Host "SUCCESS: Video trimmed (2s) -> $outFile" -ForegroundColor Green
    } else {
        Write-Host "FAILED: $output" -ForegroundColor Red
    }
}

if (-not (Test-Path $MediaFile)) {
    Write-Host "WARNING: Default test file '$MediaFile' not found." -ForegroundColor Yellow
    $MediaFile = Read-Host "Enter the full path to a media file to test"
    if (-not (Test-Path $MediaFile)) {
        Write-Host "File not found. Exiting." -ForegroundColor Red
        exit
    }
}

do {
    Show-Menu
    $choice = Read-Host "Select an option"
    
    switch ($choice) {
        '1' { Test-Probe; Read-Host "`nPress Enter to continue..." }
        '2' { Test-Thumbnail; Read-Host "`nPress Enter to continue..." }
        '3' { Test-ExtractAudio; Read-Host "`nPress Enter to continue..." }
        '4' { Test-TrimVideo; Read-Host "`nPress Enter to continue..." }
        '5' { 
            Test-Probe
            Test-Thumbnail
            Test-ExtractAudio
            Test-TrimVideo
            Read-Host "`nPress Enter to continue..." 
        }
        'q' { Write-Host "Exiting..."; break }
        'Q' { Write-Host "Exiting..."; break }
        default { Write-Host "Invalid choice, please try again." -ForegroundColor Red; Start-Sleep -Seconds 1 }
    }
} while ($choice -notmatch '^[qQ]$')
