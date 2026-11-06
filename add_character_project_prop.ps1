$ErrorActionPreference = 'Stop'
$path = Join-Path (Get-Location) 'src\pages\ProjectWorkspace.jsx'
if (-not (Test-Path $path)) { throw "ProjectWorkspace.jsx not found. Run from the frameforge-frontend root." }
$content = [System.IO.File]::ReadAllText($path)
if ($content -match '<CharacterBible\s+project=\{project\}') {
  Write-Host 'Already updated: project={project} is present.' -ForegroundColor Green
  exit 0
}
$pattern = '<CharacterBible\s+characters=' 
$matches = [regex]::Matches($content, $pattern)
if ($matches.Count -ne 1) { throw "Expected one CharacterBible render with characters prop; found $($matches.Count). No changes made." }
Copy-Item $path "$path.bak" -Force
$updated = [regex]::Replace($content, $pattern, '<CharacterBible project={project} characters=', 1)
[System.IO.File]::WriteAllText($path, $updated, [System.Text.UTF8Encoding]::new($false))
Write-Host 'Updated ProjectWorkspace.jsx and created .bak backup.' -ForegroundColor Green
