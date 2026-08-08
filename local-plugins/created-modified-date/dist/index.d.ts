import type { QuartzTransformerPlugin } from "@quartz-community/types";

export interface CreatedModifiedDateOptions {
  priority: ("frontmatter" | "git" | "filesystem")[];
  defaultDateType: "created" | "modified" | "published";
}

export declare const CreatedModifiedDate: QuartzTransformerPlugin<Partial<CreatedModifiedDateOptions>>;
