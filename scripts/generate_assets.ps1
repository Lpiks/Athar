Add-Type -AssemblyName System.Drawing

$srcPath = "D:\Programmation\APP\Athar\assets\logo_candidates\concept_4_andalusian_heritage.jpg"
$assetsDir = "D:\Programmation\APP\Athar\assets"
$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

Write-Host "Processing assets from: $srcPath"

# 1. icon.png (1024x1024)
$iconBmp = [System.Drawing.Bitmap]::new(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($iconBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($srcBmp, 0, 0, 1024, 1024)
$g.Dispose()
$iconPath = Join-Path $assetsDir "icon.png"
$iconBmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$iconBmp.Dispose()
Write-Host "[OK] Generated icon.png (1024x1024)"

# 2. splash-icon.png (1024x1024)
$splashBmp = [System.Drawing.Bitmap]::new(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($splashBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($srcBmp, 0, 0, 1024, 1024)
$g.Dispose()
$splashPath = Join-Path $assetsDir "splash-icon.png"
$splashBmp.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)
$splashBmp.Dispose()
Write-Host "[OK] Generated splash-icon.png (1024x1024)"

# 3. android-icon-background.png (1024x1024)
# Sample edge background color: RGB(2, 38, 35) -> #022623
$bgBmp = [System.Drawing.Bitmap]::new(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($bgBmp)
$bgColor = [System.Drawing.Color]::FromArgb(255, 2, 38, 35)
$brush = [System.Drawing.SolidBrush]::new($bgColor)
$g.FillRectangle($brush, 0, 0, 1024, 1024)
$brush.Dispose()
$g.Dispose()
$bgPath = Join-Path $assetsDir "android-icon-background.png"
$bgBmp.Save($bgPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bgBmp.Dispose()
Write-Host "[OK] Generated android-icon-background.png (1024x1024)"

# 4. android-icon-foreground.png (1024x1024)
# Safe zone is inner 66% (radius ~338px). The emblem needs to fit inside safe zone.
# Scale source image to 72% (738x738), center it, and feather edges to transparent.
$fgBmp = [System.Drawing.Bitmap]::new(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$targetSize = 738
$offset = [int]((1024 - $targetSize) / 2) # 143

$scaledBmp = [System.Drawing.Bitmap]::new($targetSize, $targetSize)
$g = [System.Drawing.Graphics]::FromImage($scaledBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($srcBmp, 0, 0, $targetSize, $targetSize)
$g.Dispose()

$center = $targetSize / 2.0
$maxR = $targetSize / 2.0
$innerR = $maxR * 0.70

for ($x = 0; $x -lt $targetSize; $x++) {
    for ($y = 0; $y -lt $targetSize; $y++) {
        $p = $scaledBmp.GetPixel($x, $y)
        $dx = $x - $center
        $dy = $y - $center
        $dist = [Math]::Sqrt($dx * $dx + $dy * $dy)
        
        $alphaMultiplier = 1.0
        if ($dist -gt $innerR) {
            $alphaMultiplier = [Math]::Max(0.0, [Math]::Min(1.0, 1.0 - ($dist - $innerR) / ($maxR - $innerR)))
        }
        
        $finalAlpha = [int]($p.A * $alphaMultiplier)
        $fgBmp.SetPixel($x + $offset, $y + $offset, [System.Drawing.Color]::FromArgb($finalAlpha, $p.R, $p.G, $p.B))
    }
}
$scaledBmp.Dispose()
$fgPath = Join-Path $assetsDir "android-icon-foreground.png"
$fgBmp.Save($fgPath, [System.Drawing.Imaging.ImageFormat]::Png)
$fgBmp.Dispose()
Write-Host "[OK] Generated android-icon-foreground.png (1024x1024)"

# 5. favicon.png (192x192)
$favBmp = [System.Drawing.Bitmap]::new(192, 192)
$g = [System.Drawing.Graphics]::FromImage($favBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($srcBmp, 0, 0, 192, 192)
$g.Dispose()
$favPath = Join-Path $assetsDir "favicon.png"
$favBmp.Save($favPath, [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Dispose()
Write-Host "[OK] Generated favicon.png (192x192)"

# 6. notification-icon.png (192x192) - Pure white on transparent background
$tempMono = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$tempScaled = [System.Drawing.Bitmap]::new(512, 512)
$g = [System.Drawing.Graphics]::FromImage($tempScaled)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($srcBmp, 0, 0, 512, 512)
$g.Dispose()

$lowThresh = 45
$highThresh = 115

for ($x = 0; $x -lt 512; $x++) {
    for ($y = 0; $y -lt 512; $y++) {
        $p = $tempScaled.GetPixel($x, $y)
        $lum = 0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B
        $isBg = ($p.R -lt 35 -and $p.B -gt $p.R) -or ($lum -lt $lowThresh)
        
        if ($isBg) {
            $tempMono.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } else {
            $alpha = [int]([Math]::Min(255.0, [Math]::Max(0.0, ($lum - $lowThresh) / ($highThresh - $lowThresh) * 255.0)))
            $tempMono.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
        }
    }
}
$tempScaled.Dispose()

# Find bounding box
$minX = 512; $maxX = 0; $minY = 512; $maxY = 0
for ($x = 0; $x -lt 512; $x++) {
    for ($y = 0; $y -lt 512; $y++) {
        if ($tempMono.GetPixel($x, $y).A -gt 40) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1

# Crop to tight bounding box
$cropped = [System.Drawing.Bitmap]::new($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($cropped)
$g.DrawImage($tempMono, 0, 0, [System.Drawing.Rectangle]::new($minX, $minY, $cropW, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$tempMono.Dispose()

# Create notification-icon.png (192x192) with padding
$notifBmp = [System.Drawing.Bitmap]::new(192, 192, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($notifBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$availW = 192 * 0.75
$availH = 192 * 0.75
$scale = [Math]::Min($availW / $cropW, $availH / $cropH)
$drawW = [int]($cropW * $scale)
$drawH = [int]($cropH * $scale)
$drawX = [int]((192 - $drawW) / 2)
$drawY = [int]((192 - $drawH) / 2)
$g.DrawImage($cropped, $drawX, $drawY, $drawW, $drawH)
$g.Dispose()

$notifPath = Join-Path $assetsDir "notification-icon.png"
$notifBmp.Save($notifPath, [System.Drawing.Imaging.ImageFormat]::Png)
$notifBmp.Dispose()
Write-Host "[OK] Generated notification-icon.png (192x192)"

# 7. android-icon-monochrome.png (432x432)
$monoBmp = [System.Drawing.Bitmap]::new(432, 432, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($monoBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$availW = 432 * 0.60
$availH = 432 * 0.60
$scale = [Math]::Min($availW / $cropW, $availH / $cropH)
$drawW = [int]($cropW * $scale)
$drawH = [int]($cropH * $scale)
$drawX = [int]((432 - $drawW) / 2)
$drawY = [int]((432 - $drawH) / 2)
$g.DrawImage($cropped, $drawX, $drawY, $drawW, $drawH)
$g.Dispose()

$monoPath = Join-Path $assetsDir "android-icon-monochrome.png"
$monoBmp.Save($monoPath, [System.Drawing.Imaging.ImageFormat]::Png)
$monoBmp.Dispose()
Write-Host "[OK] Generated android-icon-monochrome.png (432x432)"

$cropped.Dispose()
$srcBmp.Dispose()
Write-Host "All assets generated successfully!"
