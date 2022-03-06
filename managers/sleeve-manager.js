import { getNsDataThroughFile } from 'util.js'

/** @param {import('../.').NS} ns */
export async function main(ns) {
    ns.print('Script started');
    ns.disableLog('disableLog');
    ns.disableLog('sleep');

    const tempFile = '/data/sleeve-task.txt';
    const crimeAugs = ['BitWire', 'PCMatrix', 'INFRARET Enhancement', 'Graphene BrachiBlades Upgrade', 'BrachiBlades']; //setting up for auto augs
    var sleeveNum = ns.sleeve.getNumSleeves();
    var currentTasks = [];

    while (true) {
        for (let i = 0; i < sleeveNum; ++i) {
            //getting sleeve stats
            let getSleeveStats = ns.sleeve.getSleeveStats(i);
            let command, task;

            if (getSleeveStats.shock > 0) {
                command = `ns.sleeve.setToShockRecovery(${i})`;
                task = 'shock recovery';
            } else if (getSleeveStats.sync < 100) {
                command = `ns.sleeve.setToSynchronize(${i})`;
                task = 'syncronizing';
            } else if (getSleeveStats.strength < 75) {
                command = `ns.sleeve.setToGymWorkout(${i}, "powerhouse gym","strength")`;
                task = 'self strength training';
            } else if (getSleeveStats.defense < 75) {
                command = `ns.sleeve.setToGymWorkout(${i}, "powerhouse gym","defense")`;
                task = 'self defense training';
            } else if (getSleeveStats.dexterity < 75) {
                command = `ns.sleeve.setToGymWorkout(${i}, "powerhouse gym","dexterity")`;
                task = 'self dexterity training';
            } else if (getSleeveStats.agility < 75) {
                command = `ns.sleeve.setToGymWorkout(${i}, "powerhouse gym","agility")`;
                task = 'self agility training';
            } else if (i == 0 && ns.getPlayer().isWorking && ns.getPlayer().workType == "Working for Faction") {
                //prioritise security work since sleeves are typically combat stat heavy
                command = `ns.sleeve.setToFactionWork(0, ns.getPlayer().currentWorkFactionName, "Security Work")`;
                task = 'security work for faction';
            } else if (i == 0 && ns.getPlayer().isWorking && ns.getPlayer().workType == "Working for Company") {
                command = `ns.sleeve.setToCompanyWork(0, ns.getPlayer().companyName)`;
                task = 'company work';
            } else if (ns.getPlayer().isWorking && ns.getPlayer().workType.startsWith("Studying")) {
                if (ns.getPlayer().className.startsWith("Algorithms",10)) {
                    command = `ns.sleeve.setToUniversityCourse(${i}, "rothman university", "Algorithms")`;
                    task = 'algorithm course';
                } else if (ns.getPlayer().className.startsWith("Leadership",10)) {
                    command = `ns.sleeve.setToUniversityCourse(${i}, "rothman university", "Leadership")`;
                    task = 'leadership course';
                } else if (ns.getPlayer().className.startsWith("training")) {
                    if (ns.getPlayer().className.startsWith("strength",14)) {
                        command = `ns.sleeve.setToGymWorkout(${i}, "powerhouse gym","strength")`;
                        task = 'strength training';
                    } else if (ns.getPlayer().className.startsWith("defense",14)) {
                        command = `ns.sleeve.setToGymWorkout(${i}, "powerhouse gym","defense")`;
                        task = 'defense training';
                    } else if (ns.getPlayer().className.startsWith("dexterity",14)) {
                        command = `ns.sleeve.setToGymWorkout(${i}, "powerhouse gym","dexterity")`;
                        task = 'dexterity training';
                    } else if (ns.getPlayer().className.startsWith("agility",14)) {
                        command = `ns.sleeve.setToGymWorkout(${i}, "powerhouse gym","agility")`;
                        task = 'agility training';
                    }
                }
            } else {
                //if nothing else is happening, just murder
                command = `ns.sleeve.setToCommitCrime(${i}, "Homicide")`;
                task = 'homiciding';
            }

            //starting tasks
            if (currentTasks[i] == task) continue;
            if (await getNsDataThroughFile(ns, command, tempFile)) {
                ns.print('Sleeve ' + i + ': ' + task);
                currentTasks[i] = task;
            } else {
                //assuming we're working for a faction and that security work doesn't exist for them
                command = `ns.sleeve.setToFactionWork(${i}, ns.getPlayer().currentWorkFactionName, "Field Work")`;
                task = 'field work for faction';
                if (await getNsDataThroughFile(ns, command, tempFile)) {
                    ns.print('Sleeve ' + i + ': ' + task);
                    currentTasks[i] = task;
                } else {
                    command = `ns.sleeve.setToFactionWork(${i}, ns.getPlayer().currentWorkFactionName, "Hacking Contracts")`;
                    task = 'hacking contracts for faction';
                    if (await getNsDataThroughFile(ns, command, tempFile)) {
                        ns.print('Sleeve ' + i + ': ' + task);
                        currentTasks[i] = task;
                    } else {
                        ns.print('???');
                    }
                }
            }
        }
        await ns.sleep(1000);
    }
}