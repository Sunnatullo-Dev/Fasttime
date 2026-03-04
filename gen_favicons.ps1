Add-Type -AssemblyName System.Drawing

$Source = "c:\Users\Ucer\Desktop\fasttime\src\assets\fasttime-logo.png"
$Public = "c:\Users\Ucer\Desktop\fasttime\public"

# Multi-resolution favicons
$Sizes = @(
    @{W = 16; H = 16; Name = "favicon-16x16.png" },
    @{W = 32; H = 32; Name = "favicon-32x32.png" },
    @{W = 48; H = 48; Name = "favicon-48x48.png" },
    @{W = 64; H = 64; Name = "favicon-64x64.png" },
    @{W = 128; H = 128; Name = "favicon-128x128.png" },
    @{W = 180; H = 180; Name = "apple-touch-icon.png" },
    @{W = 256; H = 256; Name = "icon-256.png" },
    @{W = 1024; H = 1024; Name = "icon-1024.png" }
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

# Create .ico (multi-size) using 64x64 as base for simple .ico
$IcoBase = New-Object System.Drawing.Bitmap(64, 64)
$IGraphics = [System.Drawing.Graphics]::FromImage($IcoBase)
$IGraphics.Clear([System.Drawing.Color]::Transparent)
$IGraphics.DrawImage($Original, 0, 0, 64, 64)
$IcoBase.Save("$Public\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Icon)
$IGraphics.Dispose()
$IcoBase.Dispose()

$Original.Dispose()
Write-Host "Favicons generated (transparent)."
