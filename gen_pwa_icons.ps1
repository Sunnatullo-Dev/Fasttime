Add-Type -AssemblyName System.Drawing

$Source = "c:\Users\Ucer\Desktop\fasttime\src\assets\fasttime-logo.png"
$Public = "c:\Users\Ucer\Desktop\fasttime\public"

$Sizes = @(
    @{W = 192; H = 192; Name = "pwa-192.png" },
    @{W = 512; H = 512; Name = "pwa-512.png" }
)

$Original = [System.Drawing.Image]::FromFile($Source)

foreach ($Size in $Sizes) {
    # Initialize with transparent background
    $NewBitmap = New-Object System.Drawing.Bitmap($Size.W, $Size.H)
    $Graphics = [System.Drawing.Graphics]::FromImage($NewBitmap)
    $Graphics.Clear([System.Drawing.Color]::Transparent)
    
    # High quality settings
    $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Draw resized
    $Graphics.DrawImage($Original, 0, 0, $Size.W, $Size.H)
    
    $NewBitmap.Save("$Public\$($Size.Name)", [System.Drawing.Imaging.ImageFormat]::Png)
    $Graphics.Dispose()
    $NewBitmap.Dispose()
}

$Original.Dispose()
Write-Host "PWA icons generated (transparent)."
