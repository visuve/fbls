#!/usr/bin/env node

try {
	const cromeLaunch = require('chrome-launch');
	const path = require('path');
	const extensionSource = path.join(process.cwd(), process.argv[2]);
	const arguments = ["--temp-profile", `--load-extension=${extensionSource}`];

	cromeLaunch("about:blank", arguments);
} catch (exception) {
	console.error(`Script failed ${exception}`);
}