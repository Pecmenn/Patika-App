# Telefonda denemek için APK üretir: apk\Patika-deneme.apk. Mağaza sürümü değildir.
# Çalıştırma: pwsh -File scripts\build-test-apk.ps1 [-ServerUrl http://192.168.1.100:4000]
# Eski "powershell" değil "pwsh": eskisi bu dosyadaki Türkçe harfleri bozuyor.
#
# Neden kısa klasör: Windows yol sınırı C++ derlemesini durduruyor.
# Neden küçültme kapalı: açıkken R8 bildirim altyapısının veritabanını siliyor, uygulama açılışta kapanıyor.
param([string]$ServerUrl = 'http://192.168.1.100:4000')

$ErrorActionPreference = 'Stop'
$source = Split-Path -Parent $PSScriptRoot
$work = 'C:\pa'

robocopy $source $work /E /NFL /NDL /NJH /NJS /NP /R:1 /W:1 /XD .git .expo e2e apk .gradle .cxx android | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Kopyalama hatası: $LASTEXITCODE" }

$env:PATIKA_TEST_APK = 'true'
$env:EXPO_PUBLIC_API_URL = $ServerUrl
$env:EXPO_PUBLIC_TEST_SIGN_IN = 'true'
$env:JAVA_HOME = "$env:LOCALAPPDATA\Android\jdk17"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

$ErrorActionPreference = 'Continue'
Set-Location $work
npx expo prebuild --platform android --no-install 2>&1 | Select-Object -Last 1

Set-Location "$work\android"
& .\gradlew.bat assembleRelease '-PreactNativeArchitectures=arm64-v8a,x86_64' '-Pandroid.enableMinifyInReleaseBuilds=false' '-Pandroid.enableShrinkResourcesInReleaseBuilds=false' '--console=plain' 2>&1 |
  Select-String -Pattern 'FAILED|What went wrong|BUILD ' | ForEach-Object { $_.Line }
$buildExit = $LASTEXITCODE

$apk = Get-ChildItem "$work\android\app\build\outputs\apk\release\*.apk" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($buildExit -ne 0 -or -not $apk) {
  Write-Error "Derleme başarısız. Ara dosyalar $work içinde bırakıldı."
  exit 1
}

New-Item -ItemType Directory -Force "$source\apk" | Out-Null
Copy-Item $apk.FullName "$source\apk\Patika-deneme.apk" -Force
"APK hazır: $source\apk\Patika-deneme.apk ($([Math]::Round($apk.Length / 1MB)) MB), sunucu: $ServerUrl"

# Derleme araçları kapanmadan klasör silinemez.
& .\gradlew.bat --stop 2>&1 | Out-Null
Set-Location $source
Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
if (Test-Path $work) { "Not: $work tamamen silinemedi, elle silinebilir." }
