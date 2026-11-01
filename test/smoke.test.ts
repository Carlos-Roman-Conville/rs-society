import { describe, expect, it } from "vitest";
import { streams } from "@rex/kernel";
import * as society from "../src/index.ts";

describe("smoke", () => {
  it("imports the barrel", () => {
    expect(society).toBeDefined();
  });

  it("reaches the kernel's streams", () => {
    expect(typeof streams).toBe("function");
    expect(streams(1)).toBeDefined();
  });
});
