import type { Session, ExerciseCorrection } from './types'

// Fixed display order for every exercise page. Groups with nothing for a given
// exercise are simply skipped — this is not a per-exercise ranking, it's one
// constant order applied everywhere.
export const THEME_ORDER = [
  'Technique',
  'Weight placement and balance',
  'Pelvic tilt and core engagement',
  'Standing-leg stability',
  'Retiré and passé mechanics',
  'Hip lifting in développé/battement',
  'Pirouette axis and preparation',
  'Feet and arch strength',
  'Shoulders and épaulement',
  'Upper back and shoulder mobility',
  'Dynamic quality and accent',
] as const

// Musicality and expression corrections display under Dynamic quality and
// accent rather than as their own group.
const THEME_ALIASES: Record<string, string> = {
  'Musicality and expression': 'Dynamic quality and accent',
}

// CSS custom property (defined in globals.css) carrying this theme's dot
// color. Technique has none — it renders as neutral grey, not a bold color,
// since it's deliberately not one of the tracked patterns.
const THEME_COLOR_VAR: Record<string, string> = {
  'Weight placement and balance': '--theme-weight',
  'Pelvic tilt and core engagement': '--theme-pelvic',
  'Standing-leg stability': '--theme-standing',
  'Retiré and passé mechanics': '--theme-retire',
  'Hip lifting in développé/battement': '--theme-hip',
  'Pirouette axis and preparation': '--theme-pirouette',
  'Feet and arch strength': '--theme-feet',
  'Shoulders and épaulement': '--theme-shoulders',
  'Upper back and shoulder mobility': '--theme-thoracic',
  'Dynamic quality and accent': '--theme-dynamic',
}

export function themeColorVar(theme: string): string | null {
  return THEME_COLOR_VAR[theme] ?? null
}

function displayTheme(theme: string): string {
  return THEME_ALIASES[theme] ?? theme
}

// All corrections logged against a given exercise code, verbatim session
// wording, newest session first (getSessions() is already sorted that way).
export function getExerciseCorrections(sessions: Session[], code: string): ExerciseCorrection[] {
  const results: ExerciseCorrection[] = []
  for (const session of sessions) {
    for (const correction of session.corrections) {
      if (correction.exercise === code) {
        results.push({ text: correction.text, theme: displayTheme(correction.theme) })
      }
    }
  }
  return results
}

export interface ThemeGroup {
  theme: string
  colorVar: string | null
  items: ExerciseCorrection[]
}

// Buckets corrections by theme, in THEME_ORDER, dropping any theme with
// nothing for this exercise. Order within a group is preserved from the input
// (i.e. newest first, if that's how the corrections were passed in).
export function groupByTheme(corrections: ExerciseCorrection[]): ThemeGroup[] {
  const byTheme = new Map<string, ExerciseCorrection[]>()
  for (const c of corrections) {
    const list = byTheme.get(c.theme)
    if (list) {
      list.push(c)
    } else {
      byTheme.set(c.theme, [c])
    }
  }
  return THEME_ORDER
    .filter((theme) => byTheme.has(theme))
    .map((theme) => ({
      theme,
      colorVar: themeColorVar(theme),
      items: byTheme.get(theme)!,
    }))
}
