import { chromium } from "playwright";

const BASE_URL = "http://localhost:5173/game";

/**
 * @param {import("playwright").Page} page
 */
async function getTilePositions(page) {
	return page.evaluate(() => {
		const tiles = Array.from(document.querySelectorAll(".tile-layer .tile"));
		const sampleTile = tiles[0];
		const cellSize = sampleTile ? sampleTile.offsetWidth : 0;
		const gap = 10;
		const padding = 10;
		const stride = cellSize + gap;

		return tiles.map((tile) => {
			const transform = tile.style.transform;
			const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
			const px = match ? Number(match[1]) : null;
			const py = match ? Number(match[2]) : null;

			return {
				value: tile.textContent?.trim(),
				px,
				py,
				gridX: px !== null ? (px - padding) / stride : null,
				gridY: py !== null ? (py - padding) / stride : null,
			};
		});
	});
}

/**
 * @param {{ gridX: number | null, gridY: number | null }} tile
 */
function isOnGrid(tile) {
	if (tile.gridX === null || tile.gridY === null) return false;
	return (
		Math.abs(tile.gridX - Math.round(tile.gridX)) < 0.02 &&
		Math.abs(tile.gridY - Math.round(tile.gridY)) < 0.02
	);
}

async function main() {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({ viewport: { width: 500, height: 800 } });

	await page.addInitScript(() => localStorage.clear());
	await page.goto(BASE_URL, { waitUntil: "networkidle" });

	const title = await page.locator("h1").textContent();
	if (!title?.includes("4096")) {
		throw new Error(`Expected game page, got title: ${title}`);
	}

	const tileLayer = page.locator(".tile-layer .tile");
	await tileLayer.first().waitFor({ timeout: 10000 });
	const initialCount = await tileLayer.count();
	if (initialCount < 2) {
		throw new Error(`Expected at least 2 starting tiles, found ${initialCount}`);
	}

	await page.keyboard.press("ArrowRight");
	await page.waitForTimeout(50);
	await page.keyboard.press("ArrowDown");
	await page.waitForTimeout(50);
	await page.keyboard.press("ArrowLeft");
	await page.waitForTimeout(50);

	const chainPositions = await getTilePositions(page);
	if (chainPositions.length === 0) {
		throw new Error("Tiles disappeared during chained move");
	}

	const hasMotionDuringChain = chainPositions.some((tile) => !isOnGrid(tile));
	if (!hasMotionDuringChain) {
		console.warn("Warning: all tiles already on grid mid-chain (timing may be too slow)");
	}

	await page.waitForTimeout(700);

	const finalCount = await tileLayer.count();
	if (finalCount < 2) {
		throw new Error(`Expected tiles after animation, found ${finalCount}`);
	}

	const finalPositions = await getTilePositions(page);
	const allSettled = finalPositions.every(isOnGrid);

	if (!allSettled) {
		throw new Error(
			`Tiles did not settle on grid after animation: ${JSON.stringify(finalPositions)}`
		);
	}

	await page.screenshot({ path: "/opt/cursor/artifacts/game-animated.png", fullPage: true });

	console.log("Browser verification passed:");
	console.log(`- Game loaded with ${initialCount} tiles`);
	console.log(`- Chained key presses processed (${chainPositions.length} tiles mid-chain)`);
	console.log(`- Animation settled with ${finalCount} tiles on grid`);
	console.log("- Screenshot saved to /opt/cursor/artifacts/game-animated.png");

	await browser.close();
}

main().catch((error) => {
	console.error("Browser verification failed:", error);
	process.exit(1);
});
