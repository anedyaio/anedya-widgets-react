/**
 * Builds a three-tier CSS var() fallback chain for automatic theme
 * detection:
 *
 *   1. shadcn/ui convention   (e.g. --card, --border, --primary)
 *   2. MUI CSS-variables mode (e.g. --mui-palette-background-paper)
 *   3. our own built-in default (--anedya-fallback-*)
 *
 * Whichever variable actually exists first (top to bottom) wins. If none
 * exist, the fallback color is used. See README "Automatic theme
 * detection" for the full explanation and scope.
 *
 * @param shadcnVar   e.g. "--card"
 * @param muiVar      e.g. "--mui-palette-background-paper"
 * @param fallbackVar e.g. "--anedya-fallback-bg"
 */
export const themeVar = (
  shadcnVar: string,
  muiVar: string,
  fallbackVar: string
): string => `var(${shadcnVar},var(${muiVar},var(${fallbackVar})))`;