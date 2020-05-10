# Facebook Link Sanitizer

- Really simple Firefox & Chrome extension to sanitize Facebook links to:
	- Prevent redirection through l.facebook.com
	- Get rid of the excess metadata like
		- fbclid (click identifier)
		- Urchin Tracking Module parameters

This way Facebook or won't know that you clicked a link on their page.
Also the third party sites won't know that you landed their site through Facebook.

Mostly this extension is for me to learn about browser extensions & JavaScript.

# Required tools for development

- Mozilla Firefox or Google Chrome
- Node.js
	- Include in PATH
- Visual Studio 2019 with latest updates
	- Node.js development workload installed
- NOTE: you might need to have Python in your PATH too...

# Debugging

- Open solution
- Right click and click "Set as StartUp project" `fbls_extension_firefox` or `fbls_extension_chrome` 
- Right click npm in the project you selected
- Click "Install missing npm Packages"
- Hit F5 or green "Start" sign