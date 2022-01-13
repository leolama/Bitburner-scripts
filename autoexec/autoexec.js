//https://github.com/leolama/Bitburner
//alias start="run autoexec/autoexec.js"
/** @param {NS} ns **/
export async function main(ns) {

	var programs = ["/managers/hack-manager.js",
		"/managers/autobuy.js",
		//"/autoexec/autofaction.js",
		"/managers/stock-manager.js"
		//"/autoexec/repl.js"
	];

	for (let i = 0;i < programs.length; i++) {
		if (ns.fileExists(programs[i])) {
			if (!ns.isRunning(programs[i], "home")) {
				ns.run(programs[i]);
				ns.tprint("Started " + programs[i]);
				await ns.sleep(500);
			}
			else {
				ns.tprint(programs[i] + " is already running");
				await ns.sleep(500);
			}
		}
		else {
			ns.tprint("No file called " + programs[i]);
		}
	}
}
