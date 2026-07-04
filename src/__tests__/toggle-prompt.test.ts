import { describe, expect, it } from "vitest";
import { getRenderedLineCount, isCancelKey } from "../cli/toggle-prompt.js";

describe("getRenderedLineCount", () => {
    it("counts wrapped terminal rows instead of raw newline-separated lines", () => {
        expect(getRenderedLineCount("Toggle skill modes (navigate)", 10)).toBe(3);
    });

    it("ignores ANSI escape sequences when measuring wrapped rows", () => {
        expect(getRenderedLineCount("\x1B[36mabcdefghij\x1B[39m", 5)).toBe(2);
    });

    it("counts empty lines as one terminal row", () => {
        expect(getRenderedLineCount("abc\n\ndef", 80)).toBe(3);
    });
});

describe("isCancelKey", () => {
    it("treats Escape as cancel", () => {
        expect(isCancelKey("\x1b")).toBe(true);
    });

    it("does not treat arrow key escape sequences as cancel", () => {
        expect(isCancelKey("\x1b[A")).toBe(false);
        expect(isCancelKey("\x1b[B")).toBe(false);
    });
});
