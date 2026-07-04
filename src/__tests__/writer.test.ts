import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import matter from "gray-matter";
import { saveSkill } from "../services/writer.js";
import type { SkillEntry } from "../core/types.js";

function makeSkillEntry(filePath: string, overrides?: Partial<SkillEntry>): SkillEntry {
    return {
        name: "test-skill",
        description: "A test skill",
        source: "agents",
        scope: "local",
        filePath,
        frontmatter: { name: "test-skill", description: "A test skill" },
        invocationMode: "full",
        ...overrides,
    };
}

describe("saveSkill", () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-toggle-writer-"));
    });

    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it("updates frontmatter to user-only mode", async () => {
        const filePath = path.join(tmpDir, "SKILL.md");
        await fs.writeFile(filePath, "---\nname: test\ndescription: A test\n---\nBody content here.\n");

        const skill = makeSkillEntry(filePath);
        await saveSkill(skill, "user-only");

        const content = await fs.readFile(filePath, "utf-8");
        const { data } = matter(content);
        expect(data["disable-model-invocation"]).toBe(true);
        expect(data).not.toHaveProperty("user-invocable");
    });

    it("updates frontmatter to disabled mode", async () => {
        const filePath = path.join(tmpDir, "SKILL.md");
        await fs.writeFile(filePath, "---\nname: test\ndescription: A test\n---\nBody.\n");

        const skill = makeSkillEntry(filePath);
        await saveSkill(skill, "disabled");

        const content = await fs.readFile(filePath, "utf-8");
        const { data } = matter(content);
        expect(data["disable-model-invocation"]).toBe(true);
        expect(data["user-invocable"]).toBe(false);
    });

    it("cleans up default values when setting full mode", async () => {
        const filePath = path.join(tmpDir, "SKILL.md");
        await fs.writeFile(
            filePath,
            "---\nname: test\ndescription: A test\ndisable-model-invocation: true\nuser-invocable: false\n---\nBody.\n",
        );

        const skill = makeSkillEntry(filePath);
        await saveSkill(skill, "full");

        const content = await fs.readFile(filePath, "utf-8");
        const { data } = matter(content);
        expect(data).not.toHaveProperty("disable-model-invocation");
        expect(data).not.toHaveProperty("user-invocable");
    });

    it("preserves body content", async () => {
        const filePath = path.join(tmpDir, "SKILL.md");
        const body = "\nThis is the skill body.\n\nWith multiple paragraphs.\n";
        await fs.writeFile(filePath, `---\nname: test\ndescription: A test\n---\n${body}`);

        const skill = makeSkillEntry(filePath);
        await saveSkill(skill, "disabled");

        const content = await fs.readFile(filePath, "utf-8");
        const { content: parsedBody } = matter(content);
        expect(parsedBody).toContain("This is the skill body.");
        expect(parsedBody).toContain("With multiple paragraphs.");
    });

    it("preserves unrelated frontmatter keys", async () => {
        const filePath = path.join(tmpDir, "SKILL.md");
        await fs.writeFile(
            filePath,
            '---\nname: test\ndescription: A test\nargument-hint: "[file]"\n---\nBody.\n',
        );

        const skill = makeSkillEntry(filePath);
        await saveSkill(skill, "model-only");

        const content = await fs.readFile(filePath, "utf-8");
        const { data } = matter(content);
        expect(data["argument-hint"]).toBe("[file]");
        expect(data["user-invocable"]).toBe(false);
        expect(data).not.toHaveProperty("disable-model-invocation");
    });
});
