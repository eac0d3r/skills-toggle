import { describe, expect, it } from "vitest";
import path from "node:path";
import os from "node:os";
import { getSkillDirectories } from "../core/constants.js";

describe("getSkillDirectories", () => {
    it("returns local skill directories", () => {
        const cwd = path.join("tmp", "project");

        expect(getSkillDirectories(cwd, "local")).toEqual([
            { dir: path.join(cwd, ".agents", "skills"), source: "agents", scope: "local" },
            { dir: path.join(cwd, ".github", "skills"), source: "copilot", scope: "local" },
            { dir: path.join(cwd, ".claude", "skills"), source: "claude", scope: "local" },
            { dir: path.join(cwd, ".pi", "skills"), source: "pi", scope: "local" },
        ]);
    });

    it("returns global skill directories", () => {
        const home = os.homedir();

        expect(getSkillDirectories("unused", "global")).toEqual([
            { dir: path.join(home, ".agents", "skills"), source: "agents", scope: "global" },
            { dir: path.join(home, ".copilot", "skills"), source: "copilot", scope: "global" },
            { dir: path.join(home, ".claude", "skills"), source: "claude", scope: "global" },
            { dir: path.join(home, ".pi", "skills"), source: "pi", scope: "global" },
        ]);
    });
});
