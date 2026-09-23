import { describe, expect, it } from "vite-plus/test";

import {
  COMPLEXITY_TIER_BLURB,
  EXPR_ATOMS,
  EXPR_COMPLEXITY,
  NODE_COMPLEXITY,
  NODE_TYPES,
} from "../src/index.ts";
import type { ComplexityTier, NodeType } from "../src/index.ts";

describe("complexity tiers", () => {
  it("covers every closed NodeType", () => {
    for (const type of NODE_TYPES) {
      expect(NODE_COMPLEXITY[type as NodeType]).toMatch(/^L[0-5]$/);
    }
    expect(Object.keys(NODE_COMPLEXITY).sort()).toEqual([...NODE_TYPES].sort());
  });

  it("covers every closed ExprAtom", () => {
    for (const atom of EXPR_ATOMS) {
      expect(EXPR_COMPLEXITY[atom]).toMatch(/^L[0-5]$/);
    }
    expect(Object.keys(EXPR_COMPLEXITY).sort()).toEqual([...EXPR_ATOMS].sort());
  });

  it("L0 settlement minimum is documented", () => {
    const l0Nodes = Object.entries(NODE_COMPLEXITY)
      .filter(([, tier]) => tier === "L0")
      .map(([type]) => type)
      .sort();
    expect(l0Nodes).toEqual(["callFunc", "get", "if", "set", "then"]);

    const l0Atoms = Object.entries(EXPR_COMPLEXITY)
      .filter(([, tier]) => tier === "L0")
      .map(([atom]) => atom)
      .sort();
    expect(l0Atoms).toEqual(["$add", "$gt", "$lit", "$mul"]);
  });

  it("exposes blurbs for all tiers", () => {
    const tiers: ComplexityTier[] = ["L0", "L1", "L2", "L3", "L4", "L5"];
    for (const tier of tiers) {
      expect(COMPLEXITY_TIER_BLURB[tier].length).toBeGreaterThan(0);
    }
  });
});
