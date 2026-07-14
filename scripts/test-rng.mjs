import { createSeededRng, generateSeed } from "../src/lib/rng.js";
import assert from "node:assert/strict";

const seed = 123456;
const a = createSeededRng(seed);
const b = createSeededRng(seed);
const seqA = Array.from({ length: 20 }, () => a.next());
const seqB = Array.from({ length: 20 }, () => b.next());
assert.deepEqual(seqA, seqB, "same seed must produce identical sequences");

const c = createSeededRng(seed);
for (let i = 0; i < 5; i++) c.next();
const midState = c.state;
const continued = Array.from({ length: 5 }, () => c.next());

const restored = createSeededRng(0);
restored.state = midState;
assert.deepEqual(
	Array.from({ length: 5 }, () => restored.next()),
	continued,
	"restoring rngState must continue the same sequence"
);

const seeds = new Set(Array.from({ length: 50 }, () => generateSeed()));
assert.ok(seeds.size > 40, "generateSeed should produce varied values");

console.log("rng tests passed");
