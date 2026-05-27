Add-Type -AssemblyName System.Drawing
$source = "C:\Users\Laptop\.gemini\antigravity\brain\1d50a5c7-bbfa-4dee-874d-3e377c6ee3c3\dawn_desk_icon_4k_1779900296529.png"
$target = "e:\codingfolder\tauri\DawnDesk\app-icon-fixed.png"
$img = [System.Drawing.Image]::FromFile($source)
$img.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
