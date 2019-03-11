param (
  [string]$platform,
  [string]$arch
)

$ErrorActionPreference = "Stop";

$binary = "portainer.exe"
$project_path = (Get-ITEM -Path env:BUILD_SOURCESDIRECTORY).Value

Set-Item env:GOPATH "$project_path\api"

New-Item -Name dist -Path "$project_path" -ItemType Directory | Out-Null
New-Item -Name portainer -Path "$project_path\api\src\github.com\" -ItemType Directory | Out-Null

Copy-Item -Path "$project_path\api" -Destination "$project_path\api\src\github.com\portainer" -Recurse -Force -ErrorAction:SilentlyContinue
Rename-Item -Path "$project_path\api\src\github.com\portainer\api" -NewName "portainer" -ErrorAction:SilentlyContinue

Set-Location -Path "$project_path\api\cmd\portainer"

go.exe get -t -d -v ./...
go.exe build -v

Move-Item -Path "$project_path\api\cmd\portainer\$($binary)" -Destination "$project_path\dist"
