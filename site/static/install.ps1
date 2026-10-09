# OMG does not currently publish a native Windows build.
# Use a supported Linux distribution inside WSL instead:
# https://getomg.dev/docs/installation/

$ErrorActionPreference = 'Stop'
Write-Error 'Native Windows is not supported by OMG. Install a supported Linux distribution inside WSL and follow https://getomg.dev/docs/installation/.'
exit 1
