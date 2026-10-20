# Starts the CyberLoy LMS development services for this computer and its LAN.
# Browse to http://<this-computer's-LAN-IP>:3035 from another device.

$projectRoot = $PSScriptRoot
$npmCommand = Join-Path $env:ProgramFiles 'nodejs\npm.cmd'

if (-not (Test-Path $npmCommand)) {
    throw 'Node.js/npm was not found. Install the Node.js LTS release, then run this script again.'
}

Start-Process -FilePath 'php' `
    -WorkingDirectory (Join-Path $projectRoot 'backend') `
    -ArgumentList @('artisan', 'serve', '--host=0.0.0.0', '--port=8010')

Start-Process -FilePath $npmCommand `
    -WorkingDirectory (Join-Path $projectRoot 'frontend') `
    -ArgumentList @('run', 'dev')

Write-Host 'Started Laravel at port 8010 and Vite at port 3035.'
Write-Host 'On this PC: http://localhost:3035'
Write-Host 'On another PC: http://<this-computer-LAN-IP>:3035'
