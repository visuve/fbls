/*------------------------------------------.----------------------------------------------------
 *  Copyright (c) Veli-Matti Visuri <veli-matti.visuri@iki.fi>. All rights reserved.
 *  Licensed under the MIT License. See license.txt in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

"use strict";

(function () {
	console.time("FBLS content script init");

	// Facebook link shim
	const FB_LINK_SHIM = "https://l.facebook.com/l.php?u=";

	// See https://fbclid.com/ for more details
	const FB_CLICK_ID = /(\?|&|&amp%3B)fbclid=.{0,61}/;

	// See https://en.wikipedia.org/wiki/UTM_parameters for more details
	const UTM_PARAMS = /(\?|&|&amp%3B)utm_(source|medium|campaign|term|content|id)=[\w.]+/g;

	function cleanUpParameters(params) {
		params = params.replace(FB_CLICK_ID, '');
		params = params.replace(UTM_PARAMS, '');
		return params;
	}

	function cleanUpUrl(rawUrl) {
		try {
			let trimmed = rawUrl.substring(FB_LINK_SHIM.length);
			let decoded = decodeURIComponent(trimmed);
			let cleaned = decoded.replace(/&h=[\S]*/, '');
			let url = new URL(cleaned);

			if (url.search && url.search !== "") {
				return "https://" + url.host + url.pathname + cleanUpParameters(url.search);
			}

			return "https://" + url.host + url.pathname;
		} catch (e) {
			console.warn(`An exception occurred: ${e}`);
		}

		return rawUrl;
	}

	function removeAttributes(element) {
		for (let i = element.attributes.length - 1; i >= 0; i--) {
			element.removeAttribute(element.attributes[i].name);
		}
	}

	function cleanUpLink(element, sender) {
		if (!element.hasAttribute("href")) {
			console.warn("Element has no href!");
			return false;
		}

		let rawUrl = element.getAttribute("href");

		if (!rawUrl.startsWith(FB_LINK_SHIM)) {
			return false;
		}

		let cleanedUrl = cleanUpUrl(rawUrl);
		removeAttributes(element);
		element.setAttribute("href", cleanedUrl);

		if (cleanedUrl === rawUrl) {
			console.warn(`Could not clean: ${rawUrl}`);
			return false;
		}

		console.debug(`${sender}: ${cleanedUrl}`);
		return true;
	}

	let cleanedLinks = 0;

	function cleanUpLinks(links, sender) {
		for (let i = 0; i < links.length; ++i) {
			if (cleanUpLink(links[i], sender)) {
				++cleanedLinks;
			}
		}

		delaySendStats();
	}

	function cleanUpBody() {
		cleanUpLinks(document.body.getElementsByTagName('a'), 'I');
	}

	function handleMutations(mutations, o) {
		mutations.forEach(mutation => {
			mutation.addedNodes.forEach(addedNode => {
				if (addedNode.getElementsByTagName) {
					let elements = addedNode.getElementsByTagName('a');
					cleanUpLinks(elements, 'M');
				}
			});
		});
	}

	let observer = new MutationObserver(handleMutations);

	function observeBody() {
		const config = {
			attributes: false,
			characterData: false,
			childList: true,
			subtree: true
		};

		observer.observe(document.body, config);
	}

	let statsSender = null;

	function handleDisconnect(port) {
		if (port.error) {
			console.error(`Background script disconnected: ${port.error.message}`);
		} else {
			console.error("Background script disconnected");
		}

		clearTimeout(statsSender);
		backgroundScriptPort = null;
	}

	function sendStats() {
		if (backgroundScriptPort) {
			backgroundScriptPort.postMessage(cleanedLinks);
		}
	}

	function delaySendStats() {
		if (statsSender) {
			clearTimeout(statsSender);
		}
		statsSender = setTimeout(sendStats, 250);
	}

	let backgroundScriptPort = chrome.runtime.connect({ name: "fbls_content_script" });
	backgroundScriptPort.onDisconnect.addListener(handleDisconnect);

	window.addEventListener("unload", () => {
		observer.disconnect();
		observer = null;
	});

	cleanUpBody();
	observeBody();

	console.timeEnd("FBLS content script init");
})();