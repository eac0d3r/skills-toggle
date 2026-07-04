import { describe, it, expect } from "vitest";
import { resolveInvocationMode, applyInvocationMode } from "../core/invocation.js";
import type { SkillFrontmatter } from "../core/types.js";

describe("resolveInvocationMode", () => {
    it("returns 'full' when both flags are default (omitted)", () => {
        expect(resolveInvocationMode({})).toBe("full");
    });

    it("returns 'full' when disable-model-invocation=false and user-invocable=true", () => {
        expect(
            resolveInvocationMode({ "disable-model-invocation": false, "user-invocable": true }),
        ).toBe("full");
    });

    it("returns 'user-only' when disable-model-invocation=true and user-invocable is default", () => {
        expect(resolveInvocationMode({ "disable-model-invocation": true })).toBe("user-only");
    });

    it("returns 'user-only' when disable-model-invocation=true and user-invocable=true", () => {
        expect(
            resolveInvocationMode({ "disable-model-invocation": true, "user-invocable": true }),
        ).toBe("user-only");
    });

    it("returns 'model-only' when user-invocable=false and disable-model-invocation is default", () => {
        expect(resolveInvocationMode({ "user-invocable": false })).toBe("model-only");
    });

    it("returns 'model-only' when disable-model-invocation=false and user-invocable=false", () => {
        expect(
            resolveInvocationMode({ "disable-model-invocation": false, "user-invocable": false }),
        ).toBe("model-only");
    });

    it("returns 'disabled' when both flags disable", () => {
        expect(
            resolveInvocationMode({ "disable-model-invocation": true, "user-invocable": false }),
        ).toBe("disabled");
    });

    it("preserves other frontmatter fields", () => {
        const fm: SkillFrontmatter = {
            name: "test",
            description: "A test skill",
            "disable-model-invocation": true,
        };
        expect(resolveInvocationMode(fm)).toBe("user-only");
    });
});

describe("applyInvocationMode", () => {
    it("sets 'full' by removing both flags", () => {
        const fm: SkillFrontmatter = {
            name: "test",
            "disable-model-invocation": true,
            "user-invocable": false,
        };
        const result = applyInvocationMode(fm, "full");
        expect(result).toEqual({ name: "test" });
        expect(result).not.toHaveProperty("disable-model-invocation");
        expect(result).not.toHaveProperty("user-invocable");
    });

    it("sets 'user-only' with disable-model-invocation=true", () => {
        const result = applyInvocationMode({ name: "x" }, "user-only");
        expect(result["disable-model-invocation"]).toBe(true);
        expect(result).not.toHaveProperty("user-invocable");
    });

    it("sets 'model-only' with user-invocable=false", () => {
        const result = applyInvocationMode({ name: "x" }, "model-only");
        expect(result["user-invocable"]).toBe(false);
        expect(result).not.toHaveProperty("disable-model-invocation");
    });

    it("sets 'disabled' with both flags", () => {
        const result = applyInvocationMode({ name: "x" }, "disabled");
        expect(result["disable-model-invocation"]).toBe(true);
        expect(result["user-invocable"]).toBe(false);
    });

    it("does not mutate the original frontmatter", () => {
        const original: SkillFrontmatter = {
            name: "test",
            "disable-model-invocation": true,
            "user-invocable": false,
        };
        const copy = { ...original };
        applyInvocationMode(original, "full");
        expect(original).toEqual(copy);
    });

    it("preserves unrelated frontmatter keys", () => {
        const fm: SkillFrontmatter = {
            name: "test",
            description: "desc",
            "argument-hint": "[file]",
        };
        const result = applyInvocationMode(fm, "disabled");
        expect(result.name).toBe("test");
        expect(result.description).toBe("desc");
        expect(result["argument-hint"]).toBe("[file]");
        expect(result["disable-model-invocation"]).toBe(true);
        expect(result["user-invocable"]).toBe(false);
    });

    it("roundtrips: apply then resolve returns same mode", () => {
        const modes = ["full", "user-only", "model-only", "disabled"] as const;
        for (const mode of modes) {
            const fm = applyInvocationMode({}, mode);
            expect(resolveInvocationMode(fm)).toBe(mode);
        }
    });
});
