/** @param {NS} ns **/
import { hackTools, nukeServer } from "util.js"

export async function main(ns) {
	var factionNames = ["CSEC","avmnite-02h","I.I.I.I","run4theh111z"]; //hacking based factions (that I know of so far)
	var factionHackLvl = ["54","203","358","511"]; //required hacking level
	var factionProgs = ["1","2","3","4"];
	var numTools = hackTools(ns);
	var count = 0;
	var hackingLvl = ns.getPlayer().hacking;

	while (count < factionNames.length) {
		if (factionHackLvl[count] <= hackingLvl && numTools >= factionProgs[count]) {
			await nukeServer(ns, factionNames[count]);
				if (await ns.prompt("Do you want to connect to '" + factionNames[count] + "' to install a backdoor?")) {
					ns.run("scripts/connect.js",1,factionNames[count]);
				}
			++count;
			await ns.sleep(1000)
		}
		else {
			await ns.sleep(2000)
		}
		var numTools = hackTools(ns);
		var hackingLvl = ns.getPlayer().hacking;
	}
}