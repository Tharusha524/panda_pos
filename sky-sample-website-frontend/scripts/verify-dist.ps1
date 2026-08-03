# Run after: npm run build
# Ensures dist/ is ready to upload to public_html/pos/

$dist = Join-Path $PSScriptRoot "..\dist"
$errors = @()

if (-not (Test-Path "$dist\index.html")) {
    $errors += "Missing dist/index.html - run npm run build"
}

$assets = "$dist\assets"
if (-not (Test-Path $assets)) {
    $errors += "Missing dist/assets/ folder - upload will break (404 on all pages)"
} else {
    $count = (Get-ChildItem $assets -File).Count
    Write-Host "OK: $count files in dist/assets/"
}

if (-not (Test-Path "$dist\.htaccess")) {
    $errors += "Missing dist/.htaccess"
}

$logo = "$dist\company-logo1.jpg"
if (-not (Test-Path $logo)) {
    Write-Host "WARN: dist/company-logo1.jpg missing - copy logo to public/company-logo1.jpg then rebuild"
}

$html = Get-Content "$dist\index.html" -Raw -ErrorAction SilentlyContinue
if ($html -notmatch '/pos/assets/') {
    $errors += "index.html does not reference /pos/assets/ - check VITE_BASE_PATH=/pos/ in .env.production"
}

if ($errors.Count -gt 0) {
    Write-Host "`nDEPLOY BLOCKED:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" }
    exit 1
}

Write-Host "`nReady to upload ALL contents of:" -ForegroundColor Green
Write-Host "  $((Resolve-Path $dist).Path)"
Write-Host "  -> public_html/pos/`n"
