import * as p from "@clack/prompts";
import pc from "picocolors";
import { scanSkills } from "../services/scanner.js";
import { saveSkill } from "../services/writer.js";
import { formatMode } from "./format.js";
import { togglePrompt } from "./toggle-prompt.js";
import type { CliOptions } from "../core/types.js";

export async function run(options: CliOptions): Promise<void> {
    const scopeLabel = options.scope === "global" ? "Global" : "Local";

    p.intro(pc.bgCyan(pc.black(` skills-toggle — ${scopeLabel} Skills `)));

    const s = p.spinner();
    s.start("Scanning for skills…");

    const skills = await scanSkills(options);

    s.stop(`Found ${skills.length} skill${skills.length === 1 ? "" : "s"}`);

    if (skills.length === 0) {
        p.log.info(
            options.scope === "global"
                ? "No global skills found in ~/.agents/skills/, ~/.copilot/skills/, ~/.claude/skills/, or ~/.pi/skills/"
                : "No local skills found in .agents/skills/, .github/skills/, .claude/skills/, or .pi/skills/",
        );
        p.outro("Nothing to do.");
        return;
    }

    const changes = await togglePrompt(skills);

    if (!changes || changes.length === 0) {
        p.outro("No changes made.");
        return;
    }

    p.log.info(pc.dim("Saving:"));
    for (const { skill, newMode } of changes) {
        p.log.message(
            `  ${pc.bold(skill.name)}: ${formatMode(skill.invocationMode)} → ${formatMode(newMode)}`,
        );
    }

    s.start("Saving changes…");

    for (const { skill, newMode } of changes) {
        await saveSkill(skill, newMode);
    }

    s.stop("Changes saved.");
    p.outro("Done!");
}
