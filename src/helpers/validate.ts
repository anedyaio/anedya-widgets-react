export function validateRequiredProps(
  componentName: string,
  props: Record<string, any>,
  required: string[]
): void {
  const missing = required.filter((key) => props[key] === undefined);

  if (missing.length === 0) return;

  const message = `Missing required props for ${componentName}: ${missing.join(
    ", "
  )}`;

  console.error(message);
}