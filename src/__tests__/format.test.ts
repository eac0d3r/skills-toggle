import { describe, expect, it } from "vitest";
import { formatSource } from "../cli/format.js";

const ANSI_PATTERN = new RegExp(String.raw`\x1B\[[0-?]*[ -/]*[@-~]`, "g");

function plain(value: string): string {
    return value.replace(ANSI_PATTERN, "");
}

describe("formatSource", () => {
    it("shows source directories for non-Copilot skills", () => {
        expect(plain(formatSource("claude", "local"))).toBe("[.claude/skills]");
        expect(plain(formatSource("agents", "local"))).toBe("[.agents/skills]");
        expect(plain(formatSource("pi", "local"))).toBe("[.pi/skills]");
    });

    it("shows the Copilot directory for the current scope", () => {
        expect(plain(formatSource("copilot", "local"))).toBe("[.github/skills]");
        expect(plain(formatSource("copilot", "global"))).toBe("[.copilot/skills]");
    });
});
