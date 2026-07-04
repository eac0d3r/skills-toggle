import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { scanSkills } from "../services/scanner.js";

async function createSkillFixture(
    baseDir: string,
    skillDir: string,
    skillName: string,
    frontmatter: string,
    body: string = "",
): Promise<void> {
    const dir = path.join(baseDir, skillDir, skillName);
    await fs.mkdir(dir, { recursive: true });
    const content = `---\n${frontmatter}\n---\n${body}`;
    await fs.writeFile(path.join(dir, "SKILL.md"), content, "utf-8");
}

describe("scanSkills", () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-toggle-test-"));
    });

    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it("finds skills in .agents/skills/", async () => {
        await createSkillFixture(tmpDir, ".agents/skills", "my-skill", 'name: my-skill\ndescription: "A test skill"');

        const skills = await scanSkills({ cwd: tmpDir, scope: "local" });
        expect(skills).toHaveLength(1);
        expect(skills[0].name).toBe("my-skill");
        expect(skills[0].source).toBe("agents");
        expect(skills[0].scope).toBe("local");
    });

    it("finds skills in .github/skills/", async () => {
        await createSkillFixture(tmpDir, ".github/skills", "copilot-skill", "name: copilot-skill\ndescription: test");

        const skills = await scanSkills({ cwd: tmpDir, scope: "local" });
        expect(skills).toHaveLength(1);
        expect(skills[0].source).toBe("copilot");
    });

    it("finds skills in .claude/skills/", async () => {
        await createSkillFixture(tmpDir, ".claude/skills", "claude-skill", "name: claude-skill\ndescription: test");

        const skills = await scanSkills({ cwd: tmpDir, scope: "local" });
        expect(skills).toHaveLength(1);
        expect(skills[0].source).toBe("claude");
    });

    it("finds skills across multiple directories", async () => {
        await createSkillFixture(tmpDir, ".agents/skills", "skill-a", "name: skill-a\ndescription: a");
        await createSkillFixture(tmpDir, ".github/skills", "skill-b", "name: skill-b\ndescription: b");
        await createSkillFixture(tmpDir, ".claude/skills", "skill-c", "name: skill-c\ndescription: c");

        const skills = await scanSkills({ cwd: tmpDir, scope: "local" });
        expect(skills).toHaveLength(3);
        expect(skills.map((s) => s.name)).toEqual(["skill-a", "skill-b", "skill-c"]);
    });

    it("returns empty array when no skill directories exist", async () => {
        const skills = await scanSkills({ cwd: tmpDir, scope: "local" });
        expect(skills).toEqual([]);
    });

    it("skips directories without SKILL.md", async () => {
        const dir = path.join(tmpDir, ".agents", "skills", "no-skill");
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, "README.md"), "not a skill");

        const skills = await scanSkills({ cwd: tmpDir, scope: "local" });
        expect(skills).toEqual([]);
    });

    it("resolves invocation mode from frontmatter", async () => {
        await createSkillFixture(tmpDir, ".agents/skills", "secure", "name: secure\ndescription: test\ndisable-model-invocation: true");

        const skills = await scanSkills({ cwd: tmpDir, scope: "local" });
        expect(skills[0].invocationMode).toBe("user-only");
    });

    it("uses directory name when frontmatter has no name", async () => {
        await createSkillFixture(tmpDir, ".agents/skills", "dir-name", "description: no name field");

        const skills = await scanSkills({ cwd: tmpDir, scope: "local" });
        expect(skills[0].name).toBe("dir-name");
    });

    it("sorts skills by name", async () => {
        await createSkillFixture(tmpDir, ".agents/skills", "zeta", "name: zeta\ndescription: z");
        await createSkillFixture(tmpDir, ".agents/skills", "alpha", "name: alpha\ndescription: a");

        const skills = await scanSkills({ cwd: tmpDir, scope: "local" });
        expect(skills[0].name).toBe("alpha");
        expect(skills[1].name).toBe("zeta");
    });
});
