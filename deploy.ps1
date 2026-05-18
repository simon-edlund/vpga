#!/usr/bin/env pwsh
git fetch --tags

if ($args.Count -ne 1 -or ($args[0] -ne "stage" -and $args[0] -ne "prod")) {
    Write-Error "Usage: $($MyInvocation.MyCommand.Name) stage|prod"
    exit 1
}

$ver =$(git describe --tags --dirty --always).Trim() -replace('^rel-', '')

if ($args[0] -eq "prod") {
    if ($ver -match "dirty" -or !(git describe --tags --exact-match 2>$null)) {
        Write-Error "Production builds must be on a clean, tagged commit."
        exit 1
    }
}

Write-Host ""
Write-Host "Building vpga version ${ver} for $($args[0]) environment"
Write-Host ""
   
$containername = if ($args[0] -eq "prod") { "vpga" } else { "vpga-stage" }

docker build `
  --build-arg VITE_VERSION=${ver} `
  -t ${containername}:latest -t ${containername}:${ver} .

$tempFile = [System.IO.Path]::GetTempFileName()
docker image save  ${containername}:latest ${containername}:${ver} -o $tempFile
scp $tempFile truenas_admin@nas:/tmp/${containername}_image.tar
rm $tempFile

$remoteDeploy = @"
docker image load -i /tmp/${containername}_image.tar
rm /tmp/${containername}_image.tar
if docker container inspect ${containername} >/dev/null 2>&1; then
  docker restart ${containername}
else
  echo "Container ${containername} not found; skipping restart"
fi
"@

ssh truenas_admin@nas $remoteDeploy
