$Output = "chatgpt-ai-debug-dump.txt"

$Files = @(
  "apps/api/src/services/generation.service.ts",
  "apps/api/src/ai/openrouter.client.ts",
  "apps/api/src/ai/model-router.ts",
  "apps/api/src/ai/sse.ts",
  "apps/api/src/routes/chat.routes.ts",
  "apps/web/src/lib/streamChat.ts",
  "apps/web/src/components/ChatShell.tsx",
  "apps/web/src/store/chat.store.ts",
  "packages/shared/src/index.ts"
)

$ErrorActionPreference = "Stop"

$root = Get-Location
$outPath = Join-Path $root $Output

if (Test-Path $outPath) {
  Remove-Item $outPath
}

Add-Content -Path $outPath -Value "PROJECT AI DEBUG DUMP" -Encoding UTF8
Add-Content -Path $outPath -Value "Root: $root" -Encoding UTF8
Add-Content -Path $outPath -Value "Generated: $(Get-Date -Format o)" -Encoding UTF8
Add-Content -Path $outPath -Value "" -Encoding UTF8

foreach ($file in $Files) {
  $path = Join-Path $root $file

  Add-Content -Path $outPath -Value "" -Encoding UTF8
  Add-Content -Path $outPath -Value "============================================================" -Encoding UTF8
  Add-Content -Path $outPath -Value "FILE: $file" -Encoding UTF8
  Add-Content -Path $outPath -Value "============================================================" -Encoding UTF8
  Add-Content -Path $outPath -Value "" -Encoding UTF8

  if (-not (Test-Path $path)) {
    Add-Content -Path $outPath -Value "[ERROR] File not found: $file" -Encoding UTF8
    continue
  }

  $content = Get-Content -Path $path -Raw -Encoding UTF8
  Add-Content -Path $outPath -Value $content -Encoding UTF8
}

Write-Host "Gotowe: $outPath"