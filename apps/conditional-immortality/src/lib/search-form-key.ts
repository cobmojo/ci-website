/**
 * A key that changes whenever the search form's defaults would change.
 *
 * The form's controls are uncontrolled: `defaultChecked` and `defaultValue` are
 * applied once and never reapplied, so on a soft navigation React keeps the DOM
 * state a reader last left. Keying the form on the parameters it was rendered
 * from remounts it, which is what makes those defaults mean what they say.
 *
 * The key must be injective, and a separator-joined one is not. Joining with
 * commas made `q=hell,objection` and `q=hell&type=objection` produce the same
 * string, so the form did not remount and a reader searching for the phrase got
 * the filtered form over unfiltered results — the exact defect the key exists
 * to prevent. `JSON.stringify` escapes separators inside the values, so no
 * parameter set can spell another's key.
 */
export function searchFormKey(
  query: string,
  types: readonly string[],
  groups: readonly string[],
  books: readonly string[],
): string {
  return JSON.stringify([query, types, groups, books])
}
