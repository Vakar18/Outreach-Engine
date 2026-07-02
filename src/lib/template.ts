export function renderTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export const TEMPLATE_VARIABLES = ["name", "brand", "niche", "followers"] as const;