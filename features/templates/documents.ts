import type { Messages } from '@/locales';

/** Page order on the hub. Typed against the catalogue, so a document without copy is a compile error. */
export const TEMPLATE_DOCS = ['lease', 'handover', 'houseRules'] as const satisfies ReadonlyArray<
  keyof Messages['templates']['docs']
>;

export type TemplateDoc = (typeof TEMPLATE_DOCS)[number];

/** URL slugs; the catalogue keys are camelCase. */
export const TEMPLATE_SLUGS: Record<TemplateDoc, string> = {
  lease: 'lease',
  handover: 'handover',
  houseRules: 'house-rules',
};

export function templateFromSlug(slug: string): TemplateDoc | null {
  return TEMPLATE_DOCS.find((doc) => TEMPLATE_SLUGS[doc] === slug) ?? null;
}

/** Signature lines per label: one per party, or one per flatmate for house rules. */
export const SIGNATURE_REPEAT: Record<TemplateDoc, number> = {
  lease: 1,
  handover: 1,
  houseRules: 4,
};

/**
 * The shape the renderer understands. Each section holds any of: labelled blanks
 * (`fields`), numbered paragraphs (`clauses`), a table (`rows` gives the first column;
 * without it the rows are left blank to fill in), or a prompt with lines to write on.
 */
export type TemplateSection = {
  title: string;
  fields?: Record<string, string>;
  clauses?: Record<string, string>;
  table?: { columns: Record<string, string>; rows?: Record<string, string> };
  writeIn?: string;
};

export type TemplateContent = {
  title: string;
  preamble: string;
  sections: Record<string, TemplateSection>;
  signatures: Record<string, string>;
};
