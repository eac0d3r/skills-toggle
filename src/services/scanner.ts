import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { getSkillDirectories, SKILL_FILENAME } from "../core/constants.js";
import { resolveInvocationMode } from "../core/invocation.js";
import type { CliOptions, SkillEntry, SkillFrontmatter } from "../core/types.js";

export async function scanSkills(options: CliOptions): Promise<SkillEntry[]> {
    const dirs = getSkillDirectories(options.cwd, options.scope);
    const skills: SkillEntry[] = [];

    for (const { dir, source, scope } of dirs) {
        const exists = await fs
            .stat(dir)
            .then((s) => s.isDirectory())
            .catch(() => false);

        if (!exists) continue;

        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const skillFile = path.join(dir, entry.name, SKILL_FILENAME);
            const fileExists = await fs
                .stat(skillFile)
                .then((s) => s.isFile())
                .catch(() => false);

            if (!fileExists) continue;

            try {
                const content = await fs.readFile(skillFile, "utf-8");
                const { data } = matter(content);
                const frontmatter = data as SkillFrontmatter;

                skills.push({
                    name: frontmatter.name ?? entry.name,
                    description: frontmatter.description ?? "",
                    source,
                    scope,
                    filePath: skillFile,
                    frontmatter,
                    invocationMode: resolveInvocationMode(frontmatter),
                });
            } catch {
                // Skip skills with unparseable frontmatter
            }
        }
    }

    return skills.sort((a, b) => a.name.localeCompare(b.name));
}
