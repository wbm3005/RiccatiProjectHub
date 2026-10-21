$ErrorActionPreference = 'Stop'
$testRoot = [IO.Path]::GetFullPath((Join-Path ([IO.Path]::GetTempPath()) 'riccati-s2-pg-20261021'))
$dataPath = Join-Path $testRoot 'data'
$config = Get-Content -Raw -LiteralPath (Join-Path $testRoot 'test-config.json') | ConvertFrom-Json
if ($config.approved -ne $true -or $config.host -ne '127.0.0.1' -or $config.port -ne 55432 -or
    [IO.Path]::GetFullPath($config.dataDirectory) -ne $dataPath) { throw 'La configuración no corresponde al clúster de pruebas aprobado.' }
$settings = [IO.File]::ReadAllText((Join-Path $dataPath 'postgresql.auto.conf'))
if ($settings -notmatch "cluster_name = 'riccati_s2_validation'") { throw 'Identidad de clúster inesperada.' }
& (Join-Path $testRoot 'pgsql\bin\pg_ctl.exe') -D $dataPath -m fast -w -t 25 stop
if ($LASTEXITCODE -ne 0) { throw 'No se pudo confirmar la detención del clúster de pruebas.' }
Write-Output 'Clúster de pruebas detenido. Sus archivos se conservaron para revisión.'
