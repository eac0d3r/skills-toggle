import fs from "node:fs/promises";
import matter from "gray-matter";
import { applyInvocationMode } from "../core/invocation.js";
import type { InvocationMode, SkillEntry } from "../core/types.js";

export async function saveSkill(skill: SkillEntry, newMode: InvocationMode): Promise<void> {
    const content = await fs.readFile(skill.filePath, "utf-8");
    const parsed = matter(content);

    const updatedFrontmatter = applyInvocationMode(parsed.data, newMode);
    const updatedContent = matter.stringify(parsed.content, updatedFrontmatter);

    await fs.writeFile(skill.filePath, updatedContent, "utf-8");
}
