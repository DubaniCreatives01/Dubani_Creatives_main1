Add-Type -AssemblyName System.Drawing

$portfolioPath = "C:\Users\Dubani Creatives\.gemini\antigravity\scratch\montana_clone\images\Portfolio"
$files = Get-ChildItem -Path $portfolioPath -Recurse -Include *.jpg,*.jpeg,*.png,*.webp

# JPEG Quality Encoder logic
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$qualityParam = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]60)
$encoderParams.Param[0] = $qualityParam

$count = 0
$totalSizeBefore = 0
$totalSizeAfter = 0

foreach ($file in $files) {
    Try {
        $totalSizeBefore += $file.Length
        
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        
        $newWidth = $img.Width
        $newHeight = $img.Height

        # Scale down if width > 1000
        if ($img.Width -gt 1000) {
            $ratio = 1000 / $img.Width
            $newWidth = 1000
            $newHeight = [math]::Round($img.Height * $ratio)
        }

        # Create new bitmap
        $bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $gfx = [System.Drawing.Graphics]::FromImage($bmp)
        
        # High quality interpolation
        $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gfx.DrawImage($img, 0, 0, $newWidth, $newHeight)

        $img.Dispose()
        $gfx.Dispose()

        # Save as new JPG
        $newName = [System.IO.Path]::ChangeExtension($file.FullName, ".jpg")
        
        # We must overwrite safely so we delete original first if they have same name
        if ($newName -eq $file.FullName) {
            Remove-Item $file.FullName
        } else {
            Remove-Item $file.FullName
        }

        $bmp.Save($newName, $jpegCodec, $encoderParams)
        $bmp.Dispose()
        
        $totalSizeAfter += (Get-Item $newName).Length
        $count++
    } Catch {
        Write-Host "Error processing $($file.Name): $($_.Exception.Message)"
    }
}

$beforeMB = [math]::Round($totalSizeBefore / 1MB, 2)
$afterMB = [math]::Round($totalSizeAfter / 1MB, 2)

Write-Host "Compressed $count images."
Write-Host "Total Size Before: $beforeMB MB"
Write-Host "Total Size After: $afterMB MB"
