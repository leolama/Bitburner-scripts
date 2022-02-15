/** @param {import("..").NS} ns */
export async function main(ns) {
	ns.print("Script started");
	var multipleOf = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576];
	var serverNum = ns.getPurchasedServers();
	var maxServers = ns.getPurchasedServerLimit()

	ns.tprint("Bought | Limit");
	ns.tprint(serverNum.length + "      | " + maxServers);

	for (let i = 0; i < 20; ++i) {
		ns.tprint(ns.nFormat(multipleOf[i], "0,0") + "GB -- " + ns.nFormat(ns.getPurchasedServerCost(multipleOf[i]), "($0.000a)"));
	}
}