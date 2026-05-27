Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("e:\codingfolder\tauri\DawnDesk\src-tauri\icons\logo-of-the-dawn-of-the-sun-with-a-blue-wave-vector.jpg")
Write-Output "jpg:"
Write-Output $img.Width
Write-Output $img.Height
$img.Dispose()

$img2 = [System.Drawing.Image]::FromFile("e:\codingfolder\tauri\DawnDesk\src-tauri\icons\icon.png")
Write-Output "png:"
Write-Output $img2.Width
Write-Output $img2.Height
$img2.Dispose()

$img3 = [System.Drawing.Image]::FromFile("e:\codingfolder\tauri\DawnDesk\src-tauri\icons\icon.ico")
Write-Output "ico:"
Write-Output $img3.Width
Write-Output $img3.Height
$img3.Dispose()
