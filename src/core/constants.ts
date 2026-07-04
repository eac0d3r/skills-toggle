import path from "node:path";
import os from "node:os";
import type { SkillSource, SkillScope } from "./types.js";

export interface SkillDirectory {
    dir: string;
    source: SkillSource;
    scope: SkillScope;
}

const HOME = os.homedir();

export function getSkillDirectories(cwd: string, scope: SkillScope): SkillDirectory[] {
    if (scope === "local") {
        return [
            { dir: path.join(cwd, ".agents", "skills"), source: "agents", scope: "local" },
            { dir: path.join(cwd, ".github", "skills"), source: "copilot", scope: "local" },
            { dir: path.join(cwd, ".claude", "skills"), source: "claude", scope: "local" },
        ];
    }

    return [
        { dir: path.join(HOME, ".agents", "skills"), source: "agents", scope: "global" },
        { dir: path.join(HOME, ".copilot", "skills"), source: "copilot", scope: "global" },
        { dir: path.join(HOME, ".claude", "skills"), source: "claude", scope: "global" },
    ];
}

export const SKILL_FILENAME = "SKILL.md";
