param([ValidatePattern('^\d+\.\d+\.\d+(-[a-z0-9]+)?$')][string]$Version = '2.0.0')
$ErrorActionPreference = 'Stop'
$repoPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
& node (Join-Path $PSScriptRoot 'build.cjs') $Version
if ($LASTEXITCODE -ne 0) { throw 'Production build failed' }
$releasePath = Join-Path $repoPath "publishing/crazygames/v$Version"
$zipPath = Join-Path $repoPath "publishing/crazygames/ufo-run-crazygames-v$Version.zip"
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$manifest = Get-Content -LiteralPath (Join-Path $repoPath "publishing/crazygames/manifest-v$Version.json") -Raw | ConvertFrom-Json
# Explicit forward-slash entry names also work on the portal's Linux hosts.
$zipStream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
$writer = [System.IO.Compression.ZipArchive]::new($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($item in $manifest.files) {
    $entry = $writer.CreateEntry($item.path, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $inputStream = [System.IO.File]::OpenRead((Join-Path $releasePath $item.path))
    try { $inputStream.CopyTo($entryStream) }
    finally { $inputStream.Dispose(); $entryStream.Dispose() }
  }
} finally { $writer.Dispose(); $zipStream.Dispose() }
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  $entries = @($archive.Entries | Where-Object { $_.Name })
  if ($entries.Count -ne $manifest.fileCount) { throw 'ZIP file count differs from build' }
  foreach ($item in $manifest.files) {
    $entry = $archive.GetEntry($item.path)
    if (!$entry -or $entry.Length -ne $item.bytes) { throw "Missing/wrong ZIP entry: $($item.path)" }
    $stream = $entry.Open()
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { $actualHash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $stream.Dispose(); $sha.Dispose() }
    if ($actualHash -ne $item.sha256) { throw "ZIP checksum differs: $($item.path)" }
  }
  if (!$archive.GetEntry('index.html')) { throw 'index.html must be at ZIP root' }
} finally { $archive.Dispose() }
Write-Output "Validated ZIP: $zipPath ($((Get-Item -LiteralPath $zipPath).Length) bytes)"
