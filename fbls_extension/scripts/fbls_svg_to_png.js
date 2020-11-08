#!/usr/bin/env node

// Example script arguments: source\fbls.svg
try {
	const sharp = require("sharp");
	const path = require('path');
	const inputFilePath = path.join(process.cwd(), process.argv[2]);
	const inputFilePathObj = path.parse(inputFilePath);

	for (size of [16, 32, 48, 96, 128]) {
		let outPutFilePath = path.join(inputFilePathObj.dir, `${inputFilePathObj.name}_${size}.png`);
		sharp(inputFilePath).resize({ width: size, height: size }).toFile(outPutFilePath, (error, info) => {
			console.error(error);
			console.error(info);
		});
	}
} catch (exception) {
	console.error(`Script failed ${exception}`);
}