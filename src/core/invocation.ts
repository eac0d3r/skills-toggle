import type { InvocationMode, SkillFrontmatter } from "./types.js";

export function resolveInvocationMode(frontmatter: SkillFrontmatter): InvocationMode {
    const disableModel = frontmatter["disable-model-invocation"] === true;
    const userInvocable = frontmatter["user-invocable"] !== false;

    if (!disableModel && userInvocable) return "full";
    if (disableModel && userInvocable) return "user-only";
    if (!disableModel && !userInvocable) return "model-only";
    return "disabled";
}

export function applyInvocationMode(
    frontmatter: SkillFrontmatter,
    mode: InvocationMode,
): SkillFrontmatter {
    const updated = { ...frontmatter };

    switch (mode) {
        case "full":
            delete updated["disable-model-invocation"];
            delete updated["user-invocable"];
            break;
        case "user-only":
            updated["disable-model-invocation"] = true;
            delete updated["user-invocable"];
            break;
        case "model-only":
            delete updated["disable-model-invocation"];
            updated["user-invocable"] = false;
            break;
        case "disabled":
            updated["disable-model-invocation"] = true;
            updated["user-invocable"] = false;
            break;
    }

    return updated;
}
