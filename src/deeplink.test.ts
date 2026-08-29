import { describe, expect, it } from "vitest";
import { focusIdFromSearchParam } from "./deeplink";

describe("focusIdFromSearchParam", () => {
  it("reads focus param from URL", () => {
    expect(focusIdFromSearchParam("https://app.test/graph?focus=node-1")).toBe("node-1");
  });

  it("returns null when param is absent", () => {
    expect(focusIdFromSearchParam("https://app.test/graph")).toBeNull();
  });
});
