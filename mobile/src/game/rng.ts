export type SeededRng = { next: () => number; nextInt: (max: number) => number; state: number };

export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0;
  return {
    get state() {
      return state;
    },
    set state(value: number) {
      state = value >>> 0;
    },
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    nextInt(max: number) {
      return Math.floor(this.next() * max);
    }
  };
}

export function generateSeed() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] >>> 0;
  }
  return (Math.random() * 0xffffffff) >>> 0;
}
