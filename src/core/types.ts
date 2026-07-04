export type SkillSource = "copilot" | "claude" | "agents";

export type SkillScope = "local" | "global";

export type InvocationMode = "full" | "user-only" | "model-only" | "disabled";

export interface SkillFrontmatter {
    name?: string;
    description?: string;
    "disable-model-invocation"?: boolean;
    "user-invocable"?: boolean;
    [key: string]: unknown;
}

export interface SkillEntry {
    name: string;
    description: string;
    source: SkillSource;
    scope: SkillScope;
    filePath: string;
    frontmatter: SkillFrontmatter;
    invocationMode: InvocationMode;
}

export interface CliOptions {
    scope: SkillScope;
    cwd: string;
}

export interface SkillChange {
    skill: SkillEntry;
    newMode: InvocationMode;
}
