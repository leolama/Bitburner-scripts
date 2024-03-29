import { formatMoney, formatDuration } from "util.js"

/** @param {import('../.').NS} ns */
export async function main(ns) {
    var playerFac = ns.getPlayer().factions

    ns.tprintf("\n");
    ns.tprintf("------------\n");
    ns.tprintf("PLAYER STATS\n");
    ns.tprintf("------------\n");
    ns.tprintf("\n");
    ns.tprintf("City: " + ns.getPlayer().city);
    ns.tprintf("\n");
    ns.tprintf("Money: " + formatMoney(ns.getPlayer().money, 4, 3));
    ns.tprintf("Hacking: " + ns.getPlayer().skills.hacking);
    ns.tprintf("Strength: " + ns.getPlayer().skills.strength);
    ns.tprintf("Defense: " + ns.getPlayer().skills.defense);
    ns.tprintf("Dexterity: " + ns.getPlayer().skills.dexterity);
    ns.tprintf("Agility: " + ns.getPlayer().skills.agility);
    ns.tprintf("Charisma: " + ns.getPlayer().skills.charisma);
    ns.tprintf("Intelligence: " + ns.getPlayer().skills.intelligence);
    ns.tprintf("\n");
    ns.tprintf("Current factions: " + playerFac.join(", "));
    ns.tprintf("\n");
    ns.tprintf("WSE Account?: " + ns.getPlayer().hasWseAccount);
    ns.tprintf("TIX API?: " + ns.getPlayer().hasTixApiAccess);
    ns.tprintf("4S Market Data?: " + ns.getPlayer().has4SData);
    ns.tprintf("4S Market Data API?: " + ns.getPlayer().has4SDataTixApi);
    ns.tprintf("\n");
    ns.tprintf("Karma: " + ns.heart.break());
    ns.tprintf("Kills (this aug reset): " + ns.getPlayer().numPeopleKilled);
    ns.tprintf("\n");
    ns.tprintf("Gang?: " + ns.gang.inGang());
    ns.tprintf("Corporation?: " + ns.getPlayer().hasCorporation);
    ns.tprintf("\n");
    ns.tprintf("Time played since augmentation reset: " + formatDuration(ns.getPlayer().playtimeSinceLastAug));
    ns.tprintf("Time played since BitNode reset: " + formatDuration(ns.getPlayer().playtimeSinceLastBitnode));
    ns.tprintf("Total play time: " + formatDuration(ns.getPlayer().totalPlaytime));
    ns.tprintf("\n");
    ns.tprintf("----------\n");
    ns.tprintf("NODE STATS\n");
    ns.tprintf("----------\n");
    ns.tprintf("\n");
    ns.tprintf("Current BitNode: " + ns.getPlayer().bitNodeN);
    ns.tprintf("\n");
    ns.tprintf("Servers required hacking level:");
    ns.tprintf("CSEC: " + ns.getServerRequiredHackingLevel("CSEC"));
    ns.tprintf("avmnite-02h: " + ns.getServerRequiredHackingLevel("avmnite-02h"));
    ns.tprintf("I.I.I.I: " + ns.getServerRequiredHackingLevel("I.I.I.I"));
    ns.tprintf("run4theh111z: " + ns.getServerRequiredHackingLevel("run4theh111z"));
    ns.tprintf("w0r1d_d43m0n: " + ns.getServerRequiredHackingLevel("w0r1d_d43m0n"));
}