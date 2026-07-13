import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE_URL = "http://localhost:5173/game";
const OUTPUT_DIR = "/opt/cursor/artifacts";

async function main() {
	await mkdir(OUTPUT_DIR, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		viewport: { width: 520, height: 900 },
		recordVideo: {
			dir: OUTPUT_DIR,
			size: { width: 520, height: 900 },
		},
	});

	const page = await context.newPage();
	await page.addInitScript(() => localStorage.clear());

	await page.goto(BASE_URL, { waitUntil: "networkidle" });
	await page.locator(".tile-layer .tile").first().waitFor({ timeout: 10000 });

	// Let the user see the starting board
	await page.waitForTimeout(600);

	// Single move
	await page.keyboard.press("ArrowRight");
	await page.waitForTimeout(450);

	// Chained moves mid-animation
	await page.keyboard.press("ArrowDown");
	await page.waitForTimeout(80);
	await page.keyboard.press("ArrowLeft");
	await page.waitForTimeout(80);
	await page.keyboard.press("ArrowUp");
	await page.waitForTimeout(80);
	await page.keyboard.press("ArrowRight");
	await page.waitForTimeout(80);

	// Let animations and spawn/merge effects settle
	await page.waitForTimeout(900);

	// A few more deliberate moves
	await page.keyboard.press("ArrowDown");
	await page.waitForTimeout(500);
	await page.keyboard.press("ArrowLeft");
	await page.waitForTimeout(700);

	await context.close();
	await browser.close();

	const { readdir, rename } = await import("node:fs/promises");
	const videoPath = `${OUTPUT_DIR}/tile-animations-demo.webm`;
	const recorded = (await readdir(OUTPUT_DIR)).find((name) => name.endsWith(".webm"));

	if (recorded && recorded !== "tile-animations-demo.webm") {
		await rename(`${OUTPUT_DIR}/${recorded}`, videoPath);
	}

	console.log(`Video saved to ${videoPath}`);
}

main().catch((error) => {
	console.error("Failed to record animation demo:", error);
	process.exit(1);
});
