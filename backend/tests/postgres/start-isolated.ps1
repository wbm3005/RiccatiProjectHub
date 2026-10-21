param([switch]$Authorized)

$ErrorActionPreference = 'Stop'
if (-not $Authorized) { throw 'Se requiere autorización explícita del usuario antes de crear el clúster. Use -Authorized solo después de obtenerla.' }

$testRoot = [IO.Path]::GetFullPath((Join-Path ([IO.Path]::GetTempPath()) 'riccati-s2-pg-20261021'))
if (Test-Path -LiteralPath $testRoot) { throw "El destino ya existe; no se sobrescribirá: $testRoot" }
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 55432)
try { $listener.Start() } finally { $listener.Stop() }

New-Item -ItemType Directory -Path $testRoot | Out-Null
$archive = Join-Path $testRoot 'postgresql-18.6-5-windows-x64-binaries.zip'
$download = 'https://get.enterprisedb.com/postgresql/postgresql-18.6-5-windows-x64-binaries.zip'
$expectedHash = 'e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2'
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -UseBasicParsing -Uri $download -OutFile $archive
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) {
  throw 'El checksum del archivo no coincide; no se ejecutará ningún binario.'
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
try {
  foreach ($entry in $zip.Entries) {
    if ($entry.FullName -notmatch '^pgsql/(bin|lib|share)/' -or $entry.FullName.EndsWith('/')) { continue }
    $target = [IO.Path]::GetFullPath((Join-Path $testRoot $entry.FullName))
    if (-not $target.StartsWith($testRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
      throw 'Ruta fuera del destino de extracción.'
    }
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
    [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target)
  }
} finally { $zip.Dispose() }

$pgBin = Join-Path $testRoot 'pgsql\bin'
$version = & (Join-Path $pgBin 'postgres.exe') --version
if ($LASTEXITCODE -ne 0 -or $version -notmatch '18\.6') { throw 'Versión de PostgreSQL inesperada.' }

$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
$password = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
$utf8 = [Text.UTF8Encoding]::new($false)
$passwordPath = Join-Path $testRoot 'bootstrap-password.txt'
[IO.File]::WriteAllText($passwordPath, $password, $utf8)
$dataPath = Join-Path $testRoot 'data'
& (Join-Path $pgBin 'initdb.exe') -D $dataPath -U riccati_test_admin -E UTF8 --locale=C --auth=scram-sha-256 --pwfile=$passwordPath
if ($LASTEXITCODE -ne 0) { throw 'initdb no terminó correctamente.' }

$settings = @(
  "listen_addresses = '127.0.0.1'",
  'port = 55432',
  "cluster_name = 'riccati_s2_validation'",
  "log_statement = 'none'",
  "log_min_error_statement = 'panic'"
)
[IO.File]::WriteAllText((Join-Path $dataPath 'postgresql.auto.conf'), ($settings -join "`n") + "`n", $utf8)
$configPath = Join-Path $testRoot 'test-config.json'
$config = @{ approved=$true; host='127.0.0.1'; port=55432; user='riccati_test_admin'; password=$password; dataDirectory=$dataPath }
[IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json), $utf8)

$pgCtl = Join-Path $pgBin 'pg_ctl.exe'
$logPath = Join-Path $testRoot 'postgres.log'
$start = Start-Process -FilePath $pgCtl -ArgumentList @('-D', ('"' + $dataPath + '"'), '-l', ('"' + $logPath + '"'), '-w', '-t', '25', 'start') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $testRoot 'start.out') -RedirectStandardError (Join-Path $testRoot 'start.err')
# Start-Process -Wait también espera al servidor descendiente. Esperar solo pg_ctl.
if (-not $start.WaitForExit(30000)) { throw 'pg_ctl no terminó dentro del plazo; revisar los logs antes de continuar.' }
if ($start.ExitCode -ne 0) { throw "No se inició el clúster. Revisar únicamente los logs en $testRoot" }
Write-Output "PostgreSQL 18.6 aislado en 127.0.0.1:55432. Configuración de pruebas: $configPath"
