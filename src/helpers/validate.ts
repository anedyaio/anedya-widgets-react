export function validateRequiredProps(
  componentName: string,
  props: Record<string, any>,
  required: string[]
) {
  const missing = required.filter((key) => props[key] === undefined);

  if (missing.length === 0) return;

  const message = `[${componentName}] Missing required prop(s): ${missing.join(
    ", "
  )}`;



    console.error(message);
  
}
