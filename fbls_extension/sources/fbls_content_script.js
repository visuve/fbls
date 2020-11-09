/*------------------------------------------.----------------------------------------------------
 *  Copyright (c) visuve 2020. All rights reserved.
 *  Licensed under the MIT License. See license.txt in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

"use strict";

(function () {
	console.time("[FBLS] content script init");

	// Facebook link shim
	const FB_LINK_SHIM = "https://l.facebook.com/l.php?u=";

	// See https://fbclid.com/ for more details
	const FB_PARAMS = [
		"fbclid",
		"fbc_id"
	]

	// See https://en.wikipedia.org/wiki/UTM_parameters for more details
	const UTM_PARAMS = [
		"utm_source",
		"utm_medium",
		"utm_campaign",
		"utm_term",
		"utm_content",
		"utm_id"
	];

	function cleanUpSearchParameters(searchParams) {
		for (let i = 0; i < FB_PARAMS.length; ++i) {
			searchParams.delete(FB_PARAMS[i]);
		}
		for (let i = 0; i < UTM_PARAMS.length; ++i) {
			searchParams.delete(UTM_PARAMS[i]);
		}
		let searchString = searchParams.toString();
		if (!searchString) {
			return "";
		}
		return '?' + searchString;
	}

	function cleanUpUrl(rawUrl) {
		try {
			if (rawUrl.startsWith(FB_LINK_SHIM)) {
				rawUrl = rawUrl.substring(FB_LINK_SHIM.length);
				rawUrl = decodeURIComponent(rawUrl);
				rawUrl = rawUrl.replace(/&h=[\S]*/, '');
			}

			let url = new URL(rawUrl);
			let cleaned = `https://${url.host}${url.pathname}`;

			let searchParams = url.searchParams;
			if (searchParams) {
				cleaned += cleanUpSearchParameters(searchParams);
			}
			return cleaned;
		} catch (e) {
			console.warn(`[FBLS] an exception occurred: ${e}`);
		}

		return rawUrl;
	}

	function removeAttributes(element) {
		for (let i = element.attributes.length - 1; i >= 0; i--) {
			let attributeName = element.attributes[i].name;
			element.removeAttribute(attributeName);
		}
	}

	function cleanUpLink(element, sender) {
		if (!element.hasAttribute("href")) {
			console.warn("[FBLS] element has no href!");
			return false;
		}

		let rawUrl = element.getAttribute("href");
		if (!rawUrl.startsWith("http")) {
			return false;
		}

		let cleanedUrl = cleanUpUrl(rawUrl);
		removeAttributes(element);
		element.setAttribute("href", cleanedUrl);

		if (cleanedUrl === rawUrl) {
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
		cleanUpLinks(document.getElementsByTagName('a'), 'I');
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
			console.error(`[FBLS] background script disconnected: ${port.error.message}`);
		} else {
			console.error("[FBLS] background script disconnected");
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

	console.timeEnd("[FBLS] content script init");
})();