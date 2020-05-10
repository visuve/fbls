/*------------------------------------------.----------------------------------------------------
 *  Copyright (c) visuve 2020. All rights reserved.
 *  Licensed under the MIT License. See license.txt in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

"use strict";

(function () {
	console.time("FBLS background script init");

	let contentScriptPorts = new Map();
	let statsPerTab = new Map();

	function connected(port) {
		var tabId = port.sender.tab.id;

		port.onMessage.addListener(cleanedLinks => {
			statsPerTab.set(tabId, cleanedLinks);
			updateBadge(tabId, cleanedLinks);
			updateTooltip(tabId, cleanedLinks);
		});

		port.onDisconnect.addListener(disconnectedPort => {
			contentScriptPorts.delete(tabId);

			if (disconnectedPort.error) {
				console.debug(`Tab(${tabId}) disconnected: ${disconnectedPort.error.message}`);
			} else {
				console.debug(`Tab(${tabId}) disconnected`);
			}
		});

		contentScriptPorts.set(tabId, port);
		console.debug(`Tab(${tabId}) connected`);
	}

	function updateBadge(tabId, count) {
		let badge = { text: `${count}`, tabId: tabId };
		chrome.browserAction.setBadgeText(badge);
	}

	function updateTooltip(tabId, count) {
		let badge = { title: `[FBLS] links cleaned: ${count}`, tabId: tabId };
		chrome.browserAction.setTitle(badge);
	}

	function toolbarButtonClicked() {
		const mapToObj = map => {
			let obj = [];
			map.forEach((value, key) => {
				obj.push({ "tab": key, "sanitized": value });
			});
			return obj;
		};

		let stats = mapToObj(statsPerTab);
		console.log(JSON.stringify(stats, null, '\t'));
	}

	if (!chrome.runtime.onConnect.hasListener(connected)) {
		chrome.runtime.onConnect.addListener(connected);
	}

	if (!chrome.browserAction.onClicked.hasListener(toolbarButtonClicked)) {
		chrome.browserAction.onClicked.addListener(toolbarButtonClicked);
	}

	console.timeEnd("FBLS background script init");
})();