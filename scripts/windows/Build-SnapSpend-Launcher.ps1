$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$OutputExe = Join-Path $ProjectRoot "SnapSpendLocal.exe"
$SourceFile = Join-Path $env:TEMP "SnapSpendLocalLauncher.cs"

$Source = @'
using System;
using System.Diagnostics;
using System.IO;

internal static class Program
{
    private static int Main()
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string script = Path.Combine(root, "scripts", "windows", "Start-SnapSpend.ps1");

        if (!File.Exists(script))
        {
            Console.Error.WriteLine("Could not find " + script);
            Console.Error.WriteLine("Put SnapSpendLocal.exe in the project root, beside the scripts folder.");
            Console.WriteLine("Press any key to close.");
            Console.ReadKey();
            return 1;
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + script + "\"",
            WorkingDirectory = root,
            UseShellExecute = true
        };

        Process.Start(startInfo);
        return 0;
    }
}
'@

Set-Content -Path $SourceFile -Value $Source -Encoding ASCII

Write-Host "Building $OutputExe" -ForegroundColor Cyan
try {
    Add-Type -TypeDefinition $Source -OutputAssembly $OutputExe -OutputType ConsoleApplication
}
catch {
    $CscCandidates = @(
        "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
        "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
    )
    $Csc = $CscCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $Csc) {
        throw "Could not compile launcher with Add-Type, and csc.exe was not found. Run this in Windows PowerShell 5.1 or install .NET Framework developer tools."
    }

    & $Csc /nologo /target:exe /out:$OutputExe $SourceFile
    if ($LASTEXITCODE -ne 0) {
        throw "csc.exe failed with exit code $LASTEXITCODE."
    }
}

Write-Host "Created $OutputExe" -ForegroundColor Green
