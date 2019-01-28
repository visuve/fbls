# This file is needed only for submitting the extension to https://addons.mozilla.org/developers/

Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

[String[]]$files = @(
	"../../license.txt",
	"../sources/fbls_background_script.js",
	"../sources/fbls_content_script.js",
	"../sources/manifest.json",
	"../sources/*.png")

Compress-Archive -Path $files `
	-DestinationPath "fbls.zip" `
	-CompressionLevel Optimal `
	-Force

Pause