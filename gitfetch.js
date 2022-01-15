/** @param {NS} ns **/
export async function main(ns) {
	var baseURL = "https://raw.githubusercontent.com/";
	var owner = "leolama/"; //change this
	var repo = "Bitburner/"; //change this
	var branch = "main/"; //probably keep this the same

	//file list
	var files = [
		"docs.js",
		"grow.js",
		"hack.js",
		"weak.js",
		"util.js",
		"autoexec/autobuy.js",
		"autoexec/autoexec.js",
		"autoexec/autofaction.js",
		"autoexec/repl.js",
		"managers/hack-manager.js",
		"managers/stock-manager.js",
		"scripts/alter.js",
		"scripts/buyserver.js",
		"scripts/connect.js",
		"scripts/deleteserver.js",
		"scripts/infiniteloop.js",
		"scripts/removefolder.js",
		"scripts/scan.js",
		"scripts/servercost.js",
		"scripts/serverinfo.js",
		"scripts/unclickable.js"
	];

	if (await ns.prompt("This will overrite all files specified in gitfetch.js, do you want to continue?")) {
		for (let file of files) {
			await ns.wget(baseURL + owner + repo + branch + files[i], "/" + files[i]);
			ns.tprint("Got " + baseURL + owner + repo + branch + files[i] + " to /" + files[i]);
			await ns.sleep(100)
		}
	}

}
