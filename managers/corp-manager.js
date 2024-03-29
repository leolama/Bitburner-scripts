/*
    original from https://github.com/tyrope/bitburner
*/

import { formatNumber, log } from "util.js";

// Cities in which you can have Offices/warehouses.
const CITIES = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
// The positions you can put employees in.
const JOBS = ["Operations", "Engineer", "Business", "Management", "Research & Development", "Training"];
// Corporate upgrades, which can be leveled up.
// As well as the maximum level I personally would level them to.
const LEVEL_UPGRADES = {
	"Smart Factories": 10,
	"Smart Storage": 14,
	"Project Insight": Number.POSITIVE_INFINITY,
	"Wilson Analytics": Number.POSITIVE_INFINITY,
	"Nuoptimal Nootropic Injector Implants": 250,
	"Speech Processor Implants": 250,
	"Neural Accelerators": 250,
	FocusWires: 250,
	"ABC SalesBots": Number.POSITIVE_INFINITY,
};
// Product Names to cycle through
const PRODUCT_NAMES = ["Tobacco 1", "Tobacco 2", "Tobacco 3"];
let latestProductIndex = -1;

const Divisions = Array();

/**
 * Try and buy an Unlock for the corp.
 * @param {import("../.").NS} ns NetScript
 * @param {String} upgradeName name of the upgrade to unlock
 * @param {Boolean?} tryOnce if true, won't loop (also won't need awaiting).
 **/
async function getUnlockUpgrade(ns, upgradeName, tryOnce = false) {
	const CorpAPI = eval("ns.corporation");
	if (CorpAPI.hasUnlockUpgrade(upgradeName)) {
		return log(ns, `INFO: Trying to buy unlock ${upgradeName} but we already have it.`);
	}
	while (true) {
		if (CorpAPI.getCorporation().funds > CorpAPI.getUnlockUpgradeCost(upgradeName)) {
			CorpAPI.unlockUpgrade(upgradeName);
		}
		if (CorpAPI.hasUnlockUpgrade(upgradeName)) {
			break;
		}
		if (tryOnce) {
			if (!CorpAPI.hasUnlockUpgrade(upgradeName)) {
				return log(ns, `INFO: Couldn't afford unlock ${upgradeName}`);
			}
		}
		await ns.sleep(10000);
	}
	return log(ns, `SUCCESS: Unlocked ${upgradeName}.`);
}

/**
 * Try and buy a levelled upgrade for the corp.
 * @param {import("../.").NS} ns NetScript
 * @param {String} upgradeName name of the upgrade to unlock
 * @param {Number?} maximum level to upgrade to. (Default: 1)
 * @param {Boolean?} buyNow if true, won't wait for more money to upgrade. (also won't need awaiting).
 */
async function buyUpgradeLevel(ns, upgradeName, maxLevel = 1, buyNow = false) {
	const CorpAPI = eval("ns.corporation");
	const oldLevel = CorpAPI.getUpgradeLevel(upgradeName);
	if (CorpAPI.getUpgradeLevel(upgradeName) >= maxLevel) {
		return log(ns, `INFO: Trying to upgrade ${upgradeName} to ${maxLevel} but we're already level ${CorpAPI.getUpgradeLevel(upgradeName)}`);
	}
	while (CorpAPI.getUpgradeLevel(upgradeName) < maxLevel) {
		if (CorpAPI.getUpgradeLevelCost(upgradeName) <= CorpAPI.getCorporation().funds) {
			CorpAPI.levelUpgrade(upgradeName);
		} else if (buyNow) {
			break;
		} else {
			await ns.sleep(10000);
		}
	}
	if (CorpAPI.getUpgradeLevel(upgradeName) != oldLevel) {
		return log(ns, `SUCCESS: Upgraded ${upgradeName} to ${CorpAPI.getUpgradeLevel(upgradeName)}.`);
	}
}

/**
 * Form a division in a new industry.
 * @param {import("../.").NS} ns NetScript
 * @param {String} industry The industry this division's working.
 */
async function formDivision(ns, industry) {
	const CorpAPI = eval("ns.corporation");
	const DivName = industry.substr(0, 4) + "Works";

	if (CorpAPI.getCorporation().divisions.some((a) => a.name == DivName)) {
		// This Division already exists.
		CorpAPI.getDivision(DivName);
		Divisions.push(DivName);
		return log(ns, `INFO: Using pre-established ${industry} division: ${DivName}.`);
	} else {
		// Create the division.
		while (CorpAPI.getExpandCityCost() > CorpAPI.getCorporation().funds) {
			await ns.sleep(10000);
		}
		CorpAPI.expandIndustry(industry, DivName);
		Divisions.push(DivName);
		return log(ns, `SUCCESS: Formed ${industry} division ${DivName}.`);
	}
}

/**
 * Expand a division to a new city.
 * @param {import("../.").NS} ns NetScript
 * @param {String} division The division we're expanding.
 * @param {String} city The city we're expanding to.
 */
async function tryExpandDivision(ns, division, city) {
	const CorpAPI = eval("ns.corporation");
	const Corp = CorpAPI.getCorporation();
	if (CorpAPI.getDivision(division).cities.includes(city)) {
		return log(ns, `INFO: ${division} trying to expand into ${city} but it's already there.`);
	}
	while (CorpAPI.getExpandCityCost() > Corp.funds) {
		await ns.sleep(10000);
	}
	CorpAPI.expandCity(division, city);
	return log(ns, `SUCCESS: ${division} expanded into ${city}.`);
}

/**
 * Upgrade, or buy a warehouse, to a specific size.
 * @param {import("../.").NS} ns NetScript
 * @param {String} division The division we're expanding.
 * @param {String} city The city we're expanding in.
 * @param {Number} size the new maximum size we want.
 */
async function upgradeWarehouseTo(ns, division, city, size) {
	const CorpAPI = eval("ns.corporation");
	if (CorpAPI.hasWarehouse(division, city) && CorpAPI.getWarehouse(division, city).size >= size) {
		return log(ns, `INFO: ${division}'s Warehouse in ${city} is already big enough (${CorpAPI.getWarehouse(division, city).size} > ${size})`);
	}

	// Get a warehouse
	if (!CorpAPI.hasWarehouse(division, city)) {
		while (CorpAPI.getPurchaseWarehouseCost() > CorpAPI.getCorporation().funds) {
			await ns.sleep(10000);
		}
		CorpAPI.purchaseWarehouse(division, city);
		log(ns, `SUCCESS: ${division} bought a warehouse in ${city}`);
	}

	// Upgrade the warehouse to size.
	while (CorpAPI.getWarehouse(division, city).size < size) {
		CorpAPI.upgradeWarehouse(division, city);
	}
	log(ns, `SUCCESS: ${division} upgraded the warehouse in ${city} to size ${CorpAPI.getWarehouse(division, city).size}`);
}

/**
 * Buy a list of materials to a certain amount within a warehouse.
 * @param {import("../.").NS} ns NetScript
 * @param {String} division
 * @param {String} city
 * @param {String[]} material
 * @param {Number[]} limit
 */
async function buyMaterialsToLimit(ns, division, city, material, limit) {
	if (material.length != limit.length) {
		return log(ns, `ERROR: buyMaterialsToLimit material and limit lists differ in length (${material.length}/${limit.length}).`);
	}

	const CorpAPI = eval("ns.corporation");

	if (CorpAPI.hasWarehouse(division, city) == false) {
		return log(ns, `ERROR: ${division} is trying to buy materials in ${city}, but doesn't have a warehouse.`);
	}

	let stopBuying;
	while (true) {
		if (CorpAPI.getWarehouse(division, city).size - CorpAPI.getWarehouse(division, city).sizeUsed == 0) {
			return log(ns, `WARN: ${division}'s warehouse in ${city} is full, but we're trying to buy more mats.`);
		}
		stopBuying = true;
		for (let i in material) {
			let qty = CorpAPI.getMaterial(division, city, material[i]).qty;
			if (qty < limit[i]) {
				stopBuying = false;
				CorpAPI.buyMaterial(division, city, material[i], (limit[i] - qty) / 10);
			} else {
				CorpAPI.buyMaterial(division, city, material[i], 0);
			}
		}
		if (stopBuying) {
			break;
		}
		await ns.sleep(10000);
	}
	let shopping = Array();
	for (let i = 0; i < limit.length; i++) {
		shopping.push(`${limit[i]}x ${material[i]}`);
	}
	return log(ns, `SUCCESS: ${division}@${city} bought: ${shopping.join(", ")}`);
}

/**
 * Increase the size of the office until we've filled all of these positions.
 * @param {import("../.").NS} ns NetScript
 * @param {String} division
 * @param {String} city
 * @param {Number[]} positions the amount of employees in each position, in the order of JOBS
 */
async function increaseOfficeTo(ns, division, city, positions) {
	const CorpAPI = eval("ns.corporation");

	let totalEmpsWanted = positions.reduce((a, b) => a + b);
	while (true) {
		if (CorpAPI.getOffice(division, city).size < totalEmpsWanted) {
			// Upgrade the Office.
			CorpAPI.upgradeOfficeSize(division, city, totalEmpsWanted - CorpAPI.getOffice(division, city).size);
		} else if (CorpAPI.getOffice(division, city).employees.length < totalEmpsWanted) {
			// Hire people.
			for (let i = CorpAPI.getOffice(division, city).employees.length; i < totalEmpsWanted; i++) {
				CorpAPI.hireEmployee(division, city);
			}
		} else {
			for (let empID in CorpAPI.getOffice(division, city).employees) {
				let emp = CorpAPI.getOffice(division, city).employees[empID];
				let maxPos = positions[0];
				if (empID < maxPos) {
					if (JOBS[0] != CorpAPI.getEmployee(division, city, emp).pos) {
						await CorpAPI.assignJob(division, city, emp, JOBS[0]);
					}
					continue;
				}
				maxPos += positions[1];
				if (empID < maxPos) {
					if (JOBS[1] != CorpAPI.getEmployee(division, city, emp).pos) {
						await CorpAPI.assignJob(division, city, emp, JOBS[1]);
					}
					continue;
				}
				maxPos += positions[2];
				if (empID < maxPos) {
					if (JOBS[2] != CorpAPI.getEmployee(division, city, emp).pos) {
						await CorpAPI.assignJob(division, city, emp, JOBS[2]);
					}
					continue;
				}
				maxPos += positions[3];
				if (empID < maxPos) {
					if (JOBS[3] != CorpAPI.getEmployee(division, city, emp).pos) {
						await CorpAPI.assignJob(division, city, emp, JOBS[3]);
					}
					continue;
				}
				maxPos += positions[4];
				if (empID < maxPos) {
					if (JOBS[4] != CorpAPI.getEmployee(division, city, emp).pos) {
						await CorpAPI.assignJob(division, city, emp, JOBS[4]);
					}
					continue;
				}
				maxPos += positions[5];
				if (empID < maxPos) {
					if (JOBS[5] != CorpAPI.getEmployee(division, city, emp).pos) {
						await CorpAPI.assignJob(division, city, emp, JOBS[5]);
					}
					continue;
				}
				await CorpAPI.assignJob(division, city, emp, "Unassigned");
			}
			return log(ns, `SUCCESS: ${division}'s ${city} office expanded to ${CorpAPI.getOffice(division, city).size} employees.`);
		}
	}
}

/**
 * Create a product.
 * @param {import("../.").NS} ns NetScript
 * @param {String} division The division that's creating the product
 * @param {Number} investment The amount of money to invest (NOTE: will spend 2x investment)!
 */
function createProduct(ns, division, investment) {
	const CorpAPI = eval("ns.corporation");

	// Step 1: Find any in-progress product.
	for (let i = 0; i < PRODUCT_NAMES.length; i++) {
		if (CorpAPI.getDivision(division).products.includes(PRODUCT_NAMES[i]) && CorpAPI.getProduct(division, PRODUCT_NAMES[i]).developmentProgress < 99.9) {
			latestProductIndex = i;
			return log(ns, `INFO: ${division} is already working on ${PRODUCT_NAMES[i]}`);
		}
	}

	// Step 2: Find the first non-existant product.
	for (let i = 0; i < PRODUCT_NAMES.length; i++) {
		if (!CorpAPI.getDivision(division).products.includes(PRODUCT_NAMES[i])) {
			CorpAPI.makeProduct(division, "Aevum", PRODUCT_NAMES[i], investment, investment);
			CorpAPI.sellProduct(division, "Aevum", PRODUCT_NAMES[i], "MAX", "MP", true);
			if (CorpAPI.hasResearched(division, "Market-TA.II")) {
				CorpAPI.setProductMarketTA2(division, PRODUCT_NAMES[i], true);
			}
			return log(ns, `SUCCESS: ${division} is creating ${PRODUCT_NAMES[i]} with a $${formatNumber(investment * 2)} budget.`);
		}
	}
	if (latestProductIndex == PRODUCT_NAMES.length - 1) {
		latestProductIndex = 0;
	} else {
		latestProductIndex++;
	}

	// Step 3: Discontinue the oldest product, and re-create it.
	CorpAPI.discontinueProduct(division, PRODUCT_NAMES[latestProductIndex]);
	CorpAPI.makeProduct(division, "Aevum", PRODUCT_NAMES[latestProductIndex], investment, investment);
	CorpAPI.sellProduct(division, "Aevum", PRODUCT_NAMES[latestProductIndex], "MAX", "MP", true);
	if (CorpAPI.hasResearched(division, "Market-TA.II")) {
		CorpAPI.setProductMarketTA2(division, PRODUCT_NAMES[latestProductIndex], true);
	}
	return log(ns, `SUCCESS: ${division} is re-creating ${PRODUCT_NAMES[latestProductIndex]} with a $${formatNumber(investment * 2)} budget.`);
}

/**
 * Cycle the latestProductIndex to whichever value is to be created next.
 * @param {import("../.").NS} ns NetScript
 * @param {String} division
 */
function cycleToNextAvailProduct(ns, division) {
	const CorpAPI = eval("ns.corporation");

	for (let i = 2; i >= 0; i--) {
		if (CorpAPI.getDivision(division).products.includes(PRODUCT_NAMES[i])) {
			if (CorpAPI.getProduct(division, PRODUCT_NAMES[i]).developmentProgress < 100) {
				return (latestProductIndex = i - 1);
			}
			return (latestProductIndex = i);
		}
	}
	latestProductIndex = 0;
}

/**
 * Start and build stage 1 of a corporation.
 * @param {import("../.").NS} ns NetScript
 * @param {String} corpName
 */
async function initialSetup(ns, corpName) {
	const CorpAPI = eval("ns.corporation");

	// If we don't have a corp. Make one.
	if (ns.getPlayer().hasCorporation) {
		log(ns, `INFO: Using pre-established corporation ${CorpAPI.getCorporation().name}`);
	} else {
		log(ns, 'INFO: No corporation found, trying to create one', true);
		if (CorpAPI.createCorporation(corpName, true)) {
			log(ns, `SUCCESS: Established ${corpName}`, true);
		} else {
			log(ns, 'WARN: You can not afford to create a corporation', true);
			return;
		}
	}

	// Get the APIs and create the Agriculture Division.
	await getUnlockUpgrade(ns, "Warehouse API");
	await getUnlockUpgrade(ns, "Office API");
	await formDivision(ns, "Agriculture");

	// Get Smart Supply
	await getUnlockUpgrade(ns, "Smart Supply");
	CorpAPI.setSmartSupply(Divisions[0], CITIES[2], true);

	// Get Advertising.
	CorpAPI.hireAdVert(Divisions[0]);

	// In all cities...
	for (let c in CITIES) {
		// Expand into it.
		await tryExpandDivision(ns, Divisions[0], CITIES[c]);
		await upgradeWarehouseTo(ns, Divisions[0], CITIES[c], 300);

		// Hire 3 employees
		await increaseOfficeTo(ns, Divisions[0], CITIES[c], [1, 1, 1, 0, 0, 0]);

		// Start selling.
		CorpAPI.sellMaterial(Divisions[0], CITIES[c], "Plants", "MAX", "MP");
		CorpAPI.sellMaterial(Divisions[0], CITIES[c], "Food", "MAX", "MP");
	}
}

/**
 * Phase 2 of corporation management: Investors and maximum material profit.
 * @param {import("../.").NS} ns NetScript
 * @param {Boolean} waitForEmployees Whether to wait on the 100/99.998/99.998 employee stats. (Default: true)
 */
async function timeToGrow(ns, waitForEmployees) {
	const CorpAPI = eval("ns.corporation");
	const upgrades = ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants", "Smart Factories"];
	for (let upg of upgrades) {
		await buyUpgradeLevel(ns, upg, 2);
	}

	// Buy 125 Hardware, 75 AI Cores, 27k Real Estate in each city.
	for (let city of CITIES) {
		await buyMaterialsToLimit(ns, Divisions[0], city, ["Hardware", "AI Cores", "Real Estate"], [125, 75, 27e3]);
	}

	// Wait for Employee stats (100 Morale, 99.998 Happy/Energy)
	while (waitForEmployees) {
		let morale = 0;
		let happiness = 0;
		let energy = 0;
		let numEmployees = 0;
		for (let city of CITIES) {
			let employees = CorpAPI.getOffice(Divisions[0], city).employees;
			numEmployees += employees.length;
			for (let name of employees) {
				let employee = CorpAPI.getEmployee(Divisions[0], city, name);
				morale += employee.mor;
				happiness += employee.hap;
				energy += employee.ene;
			}
		}
		morale /= numEmployees;
		happiness /= numEmployees;
		energy /= numEmployees;
		if (morale >= 100 && happiness >= 99.998 && energy >= 99.998) {
			break;
		}
		log(
			ns,
			`INFO: Waiting for employees to get their shit together (mor: ${ns.nFormat(morale, "0.0[00]")}, hap: ${ns.nFormat(happiness, "0.0[00]")}, ene: ${ns.nFormat(
				energy,
				"0.0[00]"
			)}).`
		);
		await ns.sleep(10000);
	}
	if (CorpAPI.getInvestmentOffer().round == 1) {
		// Get 210b from an investor.
		await trickInvestors(ns);
		let cycle = 0;
		while (CorpAPI.getInvestmentOffer().funds < 210e9) {
			log(ns, `INFO: Waiting for the second investment opportunity (${ns.nFormat(CorpAPI.getInvestmentOffer().funds, "0.00a")}/210t).`);
			await ns.sleep(5000);
			++cycle
			if (cycle > 6) {
				log(ns, 'WARN: trickInvestors() failed to increase investment, returning employees to normal jobs', true);
				for (let c of CITIES) {
					//set employees back to normal operation
					await increaseOfficeTo(ns, Divisions[0], c, [1, 1, 1, 0, 0, 0]);
				}
				break;
			}
		}
		while (CorpAPI.getInvestmentOffer().funds < 210e9) {
			log(ns, `INFO: Waiting for the first investment opportunity (${ns.nFormat(CorpAPI.getInvestmentOffer().funds, "0.00a")}/210b).`);
			await ns.sleep(1000);
		}
		CorpAPI.acceptInvestmentOffer();
		log(ns, "SUCCESS: Accepted investor's offer");
	} else {
		log(ns, "INFO: Skipped first investor, it's already done.");
	}
	// Upgrade offices to 9. (2Ops,2Eng,1Bus,2Mng,2R&D)
	for (let city of CITIES) {
		await increaseOfficeTo(ns, Divisions[0], city, [2, 2, 1, 2, 2, 0]);
		log(ns, `SUCCESS: Upgraded the ${city} office to [2, 2, 1, 2, 2, 0]`);
	}
	// Upgrade Smart Factories and Smart Storage to 10.
	await buyUpgradeLevel(ns, "Smart Factories", 10);
	await buyUpgradeLevel(ns, "Smart Storage", 10);

	//Upgrade Storage to 2000 in all cities.
	//Buy mats: HW + 2675 = 2800, Robots 96, AI + 2445 = 2520, RE + 119400 = 146400.
	let mats = ["Hardware", "Robots", "AI Cores", "Real Estate"];
	let limits = [2800, 96, 2520, 146400];
	for (let city of CITIES) {
		await upgradeWarehouseTo(ns, Divisions[0], city, 2000);
		await buyMaterialsToLimit(ns, Divisions[0], city, mats, limits);
	}
	if (CorpAPI.getInvestmentOffer().round == 2) {
		// Get 5t from an investor.
		await trickInvestors(ns);
		let cycle = 0;
		while (CorpAPI.getInvestmentOffer().funds < 5e12) {
			log(ns, `INFO: Waiting for the second investment opportunity (${ns.nFormat(CorpAPI.getInvestmentOffer().funds, "0.00a")}/5t).`);
			await ns.sleep(5000);
			++cycle
			if (cycle > 6) {
				log(ns, 'WARN: trickInvestors() failed to increase investment, returning employees to normal jobs', true);
				for (let c of CITIES) {
					//set employees back to normal operation
					await increaseOfficeTo(ns, Divisions[0], c, [2, 2, 1, 2, 2, 0]);
				}
				break;
			}
		}
		while (CorpAPI.getInvestmentOffer().funds < 5e12) {
			log(ns, `INFO: Waiting for the second investment opportunity (${ns.nFormat(CorpAPI.getInvestmentOffer().funds, "0.00a")}/5t).`);
			await ns.sleep(5000);
		}
		CorpAPI.acceptInvestmentOffer();
		log(ns, "SUCCESS: Accepted investor's offer");
	} else {
		log(ns, "INFO: Skipped second investor, it's already done.");
	}
	//Upgrade Storage to 3800 in all cities.
	//Buy mats: HW + 6500 = 9300, Robots + 630 = 726, AI + 3750 = 6270, RE + 84k = 230.4k.
	mats = ["Hardware", "Robots", "AI Cores", "Real Estate"];
	limits = [6500, 726, 6270, 230400];
	for (let city of CITIES) {
		await upgradeWarehouseTo(ns, Divisions[0], city, 3800);
		await buyMaterialsToLimit(ns, Divisions[0], city, mats, limits);
	}
}

/**
 * Phase 3 of corporation management: Products.
 * @param {import("../.").NS} ns NetScript
 */
async function firstProduct(ns) {
	const CorpAPI = eval("ns.corporation");
	const Corp = CorpAPI.getCorporation;
	await formDivision(ns, "Tobacco");
	for (let city of CITIES) {
		let employees;
		if (city == "Aevum") {
			employees = [6, 6, 6, 6, 6, 0];
		} else {
			employees = [2, 2, 1, 2, 2, 0];
		}
		await tryExpandDivision(ns, Divisions[1], city);
		await upgradeWarehouseTo(ns, Divisions[1], city, 1);
		CorpAPI.setSmartSupply(Divisions[1], city, true);
		await increaseOfficeTo(ns, Divisions[1], city, employees);
	}

	// Make first product (1b investment)
	createProduct(ns, Divisions[1], 1e9);

	let upgrades = ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants"];
	while (CorpAPI.getProduct(Divisions[1], PRODUCT_NAMES[latestProductIndex]).developmentProgress < 100) {
		log(ns, "INFO: Waiting for product completion.");
		// Wilson Analytics (~Lv14)
		if (CorpAPI.getUpgradeLevel("Wilson Analytics") < 14) {
			buyUpgradeLevel(ns, "Wilson Analytics", 14, true);
		}
		let bought = false;
		for (let upg of upgrades) {
			if (CorpAPI.getUpgradeLevel(upg) < 20) {
				bought = true;
				buyUpgradeLevel(ns, upg, 20, true);
			}
		}
		if (bought) {
			continue;
		} //Don't buy AdVerts if we're still upgrading.

		// AdVert to ~36k Awareness, 27k Popularity.
		let aware = CorpAPI.getDivision(Divisions[1]).awareness;
		let popular = CorpAPI.getDivision(Divisions[1]).popularity;
		if (aware < 36000 || popular < 27000) {
			CorpAPI.hireAdVert(Divisions[1]);
		}
		await ns.sleep(10000);
	}
	// Sell product.
	CorpAPI.sellProduct(Divisions[1], "Aevum", PRODUCT_NAMES[latestProductIndex], "MAX", "MP", true);
}

/**
 * Trick the investors to offer us more money at once
 * @param {import("../.").NS} ns NetScript
 */
async function trickInvestors(ns) {
	const CorpAPI = eval("ns.corporation");

	log(ns, 'INFO: Tricking the investors');
	log(ns, "INFO: Stopping sales and moving employees into operations");

	if (CorpAPI.getCorporation().divisions[1] == null) {
		//AgriWorks
		for (let c of CITIES) {
			//stopping selling and moving employees into production
			CorpAPI.sellMaterial(Divisions[0], c, "Food", "0", "MP");
			CorpAPI.sellMaterial(Divisions[0], c, "Plants", "0", "MP");

			if (CorpAPI.getInvestmentOffer().round == 1) {
				await increaseOfficeTo(ns, Divisions[0], c, [3, 0, 0, 0, 0, 0]);
			} else {
				await increaseOfficeTo(ns, Divisions[0], c, [7, 2, 0, 0, 0, 0]);
			}
		}
		log(ns, "INFO: Waiting for warehouses to be full");

		let allWarehousesFull = false;
		while (!allWarehousesFull) {
			allWarehousesFull = true;
			for (let c of CITIES) {
				if (CorpAPI.getWarehouse(Divisions[0], c).sizeUsed <= 0.95 * CorpAPI.getWarehouse(Divisions[0], c).size) {
					allWarehousesFull = false;
					break;
				}
			}
			await ns.sleep(5000);
		}

		log(ns, "INFO: Warehouses are full, moving employees into business");
		for (let c of CITIES) {
			//moving employees into business and starting selling
			if (CorpAPI.getInvestmentOffer().round == 1) {
				await increaseOfficeTo(ns, Divisions[0], c, [0, 0, 3, 0, 0, 0]);
			} else {
				await increaseOfficeTo(ns, Divisions[0], c, [0, 0, 9, 0, 0, 0]);
			}
		}

		log(ns, "INFO: Employees have been moved, starting to sell");
		for (let c of CITIES) {
			//moving employees into business and starting selling
			CorpAPI.sellMaterial(Divisions[0], c, "Food", "MAX", "MP");
			CorpAPI.sellMaterial(Divisions[0], c, "Plants", "MAX", "MP");
		}
	} else {
		//TobaWorks
		let products = CorpAPI.getDivision("TobaWorks").products;
		for (let p of products) {
			for (let c of CITIES) {
				//stopping selling and moving employees into production
				CorpAPI.sellProduct(Divisions[1], c, p, "0", "MP");
				CorpAPI.sellProduct(Divisions[1], c, p, "0", "MP");

				await increaseOfficeTo(ns, Divisions[1], c, [2, 7, 0, 0, 0, 0]);
			}
		}
		log(ns, "INFO: Waiting for warehouses to be full");

		let allWarehousesFull = false;
		while (!allWarehousesFull) {
			allWarehousesFull = true;
			for (let c of CITIES) {
				if (CorpAPI.getWarehouse(Divisions[1], c).sizeUsed <= 0.95 * CorpAPI.getWarehouse(Divisions[1], c).size) {
					allWarehousesFull = false;
					break;
				}
			}
			await ns.sleep(5000);
		}

		log(ns, "INFO: Warehouses are full, moving employees into business");
		for (let p of products) {
			for (let c of CITIES) {
				//move employees into business and start to sell

				await increaseOfficeTo(ns, Divisions[1], c, [0, 0, 9, 0, 0, 0]);
			}

			log(ns, "INFO: Employees have been moved, starting to sell");
			for (let c of CITIES) {
				//moving employees into business and starting selling
				CorpAPI.sellProduct(Divisions[1], c, p, "0", "MP");
				CorpAPI.sellProduct(Divisions[1], c, p, "0", "MP");
			}
		}
	}
}
/**
 * Check research for the specified division and try to research them
 * @param {import("../.").NS} ns NetScript
 * @param {String} division 
 */
function checkDivisionResearch(ns, division) {
	const CorpAPI = eval("ns.corporation");
	const RESEARCH = ["uPgrade: Fulcrum", "uPgrade: Capacity.I", "uPgrade: Capacity.II"]; 
	var NEED_RESEARCH = [];
	var RESEARCH_COST = [];

	if (!CorpAPI.hasResearched(division, "Market-TA.II")) {
		if (CorpAPI.getDivision(division).research > 150000) {
			CorpAPI.research(division, "Hi-Tech R&D Laboratory");
			log(ns, 'SUCCESS: Researched Hi-Tech R&D Laboratory');
			CorpAPI.research(division, "Market-TA.I");
			log(ns, 'SUCCESS: Researched Market-TA.I');
			CorpAPI.research(division, "Market-TA.II");
			log(ns, 'SUCCESS: Researched Market-TA.II');
		} else {
			log(ns, 'INFO: Waiting for 150k research');
			return;
		}
	}

	// Check how many products we can have and increase the product names array
	if (CorpAPI.hasResearched(division, 'uPgrade: Capacity.I') && PRODUCT_NAMES.length < 4) {
		PRODUCT_NAMES.push('Tobacco 4');
	}
	if (CorpAPI.hasResearched(division, 'uPgrade: Capacity.II') && PRODUCT_NAMES.length < 5) {
		PRODUCT_NAMES.push('Tobacco 5');
	}

	for (let i = 0; i < RESEARCH.length; ++i) {
		if (!CorpAPI.hasResearched(division, RESEARCH[i])) {
			NEED_RESEARCH.push(RESEARCH[i]);
		}
	}

	//if we have all research, skip the rest
	if (NEED_RESEARCH.length == 0) {
		log(ns, 'INFO: Have all research');
		return;
	} else {
		for (let i = 0; i < NEED_RESEARCH.length; ++i) {
			RESEARCH_COST.push(CorpAPI.getResearchCost(division, NEED_RESEARCH[i]) * 2); //double the price to leave some research left
		}
	}

	for (let i = 0; i < NEED_RESEARCH.length; ++i) {
		if (CorpAPI.getDivision(division).research > RESEARCH_COST[i]) {
			CorpAPI.research(division, NEED_RESEARCH[i]);
			log(ns, "SUCCESS: Researched " + NEED_RESEARCH[i]);
		}
	}
}

/** @param {import("../.").NS} ns NetScript */
export async function main(ns) {
	const CorpAPI = eval("ns.corporation");

	ns.disableLog("ALL");
	ns.clearLog();
	const corpName = "Corp";
	const stage = Number(ns.read("/data/corp-stage.txt"));
	const waitForMorale = ns.args[1] != undefined ? ns.args[1] : true;
	switch (stage) {
		case undefined:
		case 0:
		case 1:
			log(ns, `--- STARTING STAGE 1: INITIAL SETUP ---`);
			await ns.write("/data/corp-stage.txt", "1", "w");
			await initialSetup(ns, corpName);
		case 2:
			log(ns, `--- STARTING STAGE 2: TIME TO GROW ---`);
			await ns.write("/data/corp-stage.txt", "2", "w");
			if (Divisions.length < 1) {
				Divisions.push("AgriWorks");
			}
			await timeToGrow(ns, waitForMorale);
		case 3:
			log(ns, `--- STARTING STAGE 3: FIRST PRODUCT ---`);
			await ns.write("/data/corp-stage.txt", "3", "w");
			if (Divisions.length < 1) {
				Divisions.push("AgriWorks");
			}
			await firstProduct(ns);
			log(ns, `--- SETUP COMPLETE. ---`);
			await ns.write("/data/corp-stage.txt", "4", "w");
			break;
		default:
			log(ns, `--- SKIPPING ALL SETUP STAGES ---`);
			// We should assume we've got an Agriculture and Tobacco division.
			Divisions.push("AgriWorks");
			Divisions.push("TobaWorks");
			cycleToNextAvailProduct(ns, Divisions[1]);
			log(ns, `INFO: Starting with product name ${PRODUCT_NAMES[latestProductIndex]}`);
			break;
	}

	// Start main loop.
	while (true) {
		//check current investor or go public
		if (CorpAPI.getInvestmentOffer().round == 3) {
			log(ns, `--- INVESTOR 3. ---`);
			let offer = CorpAPI.getInvestmentOffer().funds;
			if (offer < 8e14) {
				log(ns, `INFO: Offer too low (${ns.nFormat(offer, "0.00a")}/800t).`);
			} else {
				CorpAPI.acceptInvestmentOffer();
				log(ns, "SUCCESS: Accepted investor 3's offer of " + ns.nFormat(offer, "0.00a"));
			}
		} else if (CorpAPI.getInvestmentOffer().round == 4) {
			log(ns, `--- INVESTOR 4. ---`);
			let offer = CorpAPI.getInvestmentOffer().funds;
			if (offer < 1e18) {
				log(ns, `INFO: Offer too low (${ns.nFormat(offer, "0.00a")}/1Q).`);
			} else {
				CorpAPI.acceptInvestmentOffer();
				log(ns, "SUCCESS: Accepted investor 4's offer of " + ns.nFormat(offer, "0.00a"));
				CorpAPI.goPublic(50000000);
				CorpAPI.issueDividends(0.05);
			}
		}

		// Determine proper investment.
		log(ns, `--- MAKING PRODUCTS. ---`);
		let exp = Math.floor(Math.log10(CorpAPI.getCorporation().funds));
		if (CorpAPI.getCorporation().funds / 10 ** exp < 2) {
			exp--;
		}
		let base = Math.floor(CorpAPI.getCorporation().funds / 10 ** exp) / 2;
		let investment = base * 10 ** exp;

		// Create the product.
		createProduct(ns, Divisions[1], investment);

		// Upgrade office sizes.
		let maxSize;
		let numEmp;
		let numPerPos;
		let hasPrintedHeader = false;
		for (let city of CITIES) {
			if (city == "Aevum") {
				maxSize = 300;
			} else {
				maxSize = CorpAPI.getOffice(Divisions[1], "Aevum").size - 60;
			}
			if (CorpAPI.getOffice(Divisions[1], city).size < maxSize && CorpAPI.getOfficeSizeUpgradeCost(Divisions[1], city, 15) <= CorpAPI.getCorporation().funds) {
				let startSize = CorpAPI.getOffice(Divisions[1], city).size;
				for (numEmp = startSize + 15; numEmp < maxSize; numEmp += 15) {
					if (CorpAPI.getOfficeSizeUpgradeCost(Divisions[1], city, numEmp - startSize) > CorpAPI.getCorporation().funds) {
						numEmp -= 15;
						break;
					}
				}
				numEmp = Math.min(numEmp, maxSize);
				if (!hasPrintedHeader) {
					hasPrintedHeader = true;
					log(ns, `--- UPGRADING OFFICES ---`);
				}
				log(ns, `INFO: Upgrading ${city} from ${startSize} to ${numEmp} (max: ${maxSize})`);
				numPerPos = numEmp / 5;
				await increaseOfficeTo(ns, Divisions[1], city, [numPerPos, numPerPos, numPerPos, numPerPos, numPerPos, 0]);
			}
		}

		// Buy upgrades.
		log(ns, `--- BUYING UPGRADES ---`);
		for (let upg in LEVEL_UPGRADES) {
			if (upg == "Wilson Analytics") {
				// Special case, this one we stop when we're max awareness/popularity.
				if (CorpAPI.getDivision(Divisions[1]).awareness > 1e308 || CorpAPI.getDivision(Divisions[1]).popularity > 1e308) {
					continue;
				}
			}

			let maxlevel;
			if (CorpAPI.getOffice(Divisions[1], "Aevum").size == 300) {
				maxlevel = LEVEL_UPGRADES[upg];
			} else {
				maxlevel = Math.min(CorpAPI.getOffice(Divisions[1], "Aevum").size, LEVEL_UPGRADES[upg]);
			}
			if (CorpAPI.getUpgradeLevel(upg) < maxlevel) {
				buyUpgradeLevel(ns, upg, maxlevel, true);
			}
		}

		//Buy AdVerts
		if (CorpAPI.getDivision(Divisions[1]).awareness < Number.MAX_VALUE || CorpAPI.getDivision(Divisions[1]).popularity < Number.MAX_VALUE) {
			log(ns, `--- BUYING ADVERTS ---`);

			let adverts = 0;
			while (CorpAPI.getHireAdVertCost(Divisions[1]) < CorpAPI.getCorporation().funds) {
				CorpAPI.hireAdVert(Divisions[1]);
				adverts++;
			}

			if (adverts == 0) {
				log(ns, `INFO: Couldn't afford adverts.`);
			} else {
				log(ns, `SUCCESS: bought ${adverts} adverts.`);
			}
		}

		//Research research
		log(ns, '--- RESEARCHING RESEARCH ---');
		checkDivisionResearch(ns, Divisions[1]);


		// Wait for next cycle.
		let delayEnd = new Date(Date.now() + 10000);
		let h = delayEnd.getHours();
		let m = delayEnd.getMinutes() < 10 ? "0" + delayEnd.getMinutes() : delayEnd.getMinutes();
		let s = delayEnd.getSeconds() < 10 ? "0" + delayEnd.getSeconds() : delayEnd.getSeconds();
		log(ns, `--- WAITING UNTIL ${h}:${m}:${s}. ---`);
		await ns.sleep(10000);
	}
}