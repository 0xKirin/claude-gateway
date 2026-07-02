# Launch `make start` in a new Git Bash (mintty) window.
# - Ctrl+C inside the window stops the dev server and auto-closes the window.
# - Any other non-zero exit pauses for inspection so the error stays visible.

$ErrorActionPreference = 'Stop'

$repo = $PSScriptRoot

function Find-GitBash {
    if ($env:GIT_BASH -and (Test-Path -LiteralPath $env:GIT_BASH)) {
        return $env:GIT_BASH
    }

    $candidates = @(
        'C:\Program Files\Git\git-bash.exe',
        'C:\Program Files (x86)\Git\git-bash.exe',
        (Join-Path $env:LOCALAPPDATA 'Programs\Git\git-bash.exe')
    )
    foreach ($c in $candidates) {
        if ($c -and (Test-Path -LiteralPath $c)) { return $c }
    }

    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        $derived = Join-Path (Split-Path -Parent (Split-Path -Parent $git.Source)) 'git-bash.exe'
        if (Test-Path -LiteralPath $derived) { return $derived }
    }

    return $null
}

$gitBash = Find-GitBash
if (-not $gitBash) {
    Write-Error "git-bash.exe not found. Install Git for Windows (https://git-scm.com/download/win) or set `$env:GIT_BASH to its full path."
    exit 1
}

# Write bash payload to a temp script. Script self-deletes on entry so it leaves no residue.
# Auto-close on success / Ctrl+C (130) / SIGTERM (143); pause on any other non-zero exit.
$tmp = Join-Path $env:TEMP ("claude-gateway-start-{0}.sh" -f [guid]::NewGuid().ToString('N'))
$bashScript = @"
#!/usr/bin/env bash
rm -- `"`$0`"
make start
ec=`$?
if [ `"`$ec`" -ne 0 ] && [ `"`$ec`" -ne 130 ] && [ `"`$ec`" -ne 143 ]; then
  echo
  read -n1 -r -p `"make start exited with code `$ec. Press any key to close...`"
fi
"@
Set-Content -LiteralPath $tmp -Value $bashScript -Encoding ASCII

# Translate Windows temp path -> /c/... form that bash understands.
$bashTmp = $tmp -replace '\\', '/'
if ($bashTmp -match '^([A-Za-z]):/(.*)$') {
    $bashTmp = '/' + $matches[1].ToLower() + '/' + $matches[2]
}

# Spawn detached via `cmd /c start`. Empty "" is the window-title slot required by `start`.
# Start-Process does not reliably propagate the mintty child in every host context, so we
# go through cmd which always opens the GUI subprocess on the user's desktop session.
& cmd.exe /c "start `"`" `"$gitBash`" `"--cd=$repo`" `"$bashTmp`""
