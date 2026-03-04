$countries = "AF","AL","DZ","AD","AO","AR","AM","AU","AT","AZ","BH","BD","BY","BE","BR","BG","CA","CL","CN","CO","HR","CY","CZ","DK","EG","EE","FI","FR","GE","DE","GR","HU","IS","IN","ID","IR","IQ","IE","IL","IT","JP","JO","KZ","KE","KR","KW","KG","LV","LB","LY","LT","LU","MY","MT","MX","MD","MC","MN","ME","MA","NL","NZ","NG","NO","OM","PK","PS","PH","PL","PT","QA","RO","RU","SA","RS","SG","SK","SI","ZA","ES","LK","SE","CH","SY","TW","TJ","TH","TN","TR","TM","UA","AE","GB","US","UZ","VN"
$destDir = "c:\Users\Ucer\Desktop\fasttime\src\assets\flags"
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir }

foreach ($code in $countries) {
    $url = "https://purecatamphetamine.github.io/country-flag-icons/3x2/$($code.ToUpper()).svg"
    $dest = Join-Path $destDir "$($code.ToLower()).svg"
    Write-Host "Downloading $code..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -ErrorAction Stop
    } catch {
        Write-Warning "Failed to download $code"
    }
    Start-Sleep -Milliseconds 100
}
