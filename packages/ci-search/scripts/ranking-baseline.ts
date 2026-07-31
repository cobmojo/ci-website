/**
 * Report what moved in the pinned ranking snapshot.
 *
 * `src/__tests__/ranking-invariants.test.ts` allows exactly one reason to
 * regenerate: the content going into the index was wrong. It also requires the
 * diff to be inspected and explained, and doing that by hand meant reading a
 * thirty-query failure through a test reporter, one score at a time.
 *
 *   bun run packages/ci-search/scripts/ranking-baseline.ts
 *
 * Reports only, by design. Rewriting the file wholesale reformats 4,000 lines
 * of JSON and buries the change that matters — the first attempt turned one
 * moved score into a 3,322-line diff. Apply what this prints by hand, so the
 * commit shows exactly what moved and a reviewer can hold it to the rule.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSearchIndex } from '../src/build-index'
import { search } from '../src/query'

// `import.meta.url`, not Bun's `import.meta.dir`: the latter is not in the
// TypeScript lib this workspace compiles against, so it fails `bun run
// typecheck` even though it runs.
const HERE = path.dirname(fileURLToPath(import.meta.url))
const BASELINE = path.join(HERE, '..', 'src', '__tests__', 'ranking-baseline.json')

interface Row {
  readonly id: string
  readonly score: number
  readonly matchedFields: readonly string[]
  readonly matchedTerms: readonly string[]
}
interface Outcome {
  readonly total: number
  readonly usedTerms: readonly string[]
  readonly results: readonly Row[]
}

const index = buildSearchIndex()

function shape(query: string): Outcome {
  const outcome = search(index.docs, query, { limit: 12 })
  return {
    total: outcome.total,
    usedTerms: [...outcome.usedTerms],
    results: outcome.results.map(result => ({
      id: result.doc.id,
      score: Number(result.score.toFixed(6)),
      matchedFields: [...result.matchedFields],
      matchedTerms: [...result.matchedTerms].sort(),
    })),
  }
}

const recorded = JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, unknown>
const queries = Object.keys(recorded).filter(key => !key.startsWith('__'))

let moved = 0

for (const query of queries) {
  const before = recorded[query] as Outcome
  const after = shape(query)

  const changes: string[] = []
  if (before.total !== after.total) changes.push(`total ${before.total} -> ${after.total}`)
  if (before.usedTerms.join('|') !== after.usedTerms.join('|')) {
    changes.push(`usedTerms [${before.usedTerms}] -> [${after.usedTerms}]`)
  }
  const beforeOrder = before.results.map(row => row.id).join('|')
  const afterOrder = after.results.map(row => row.id).join('|')
  if (beforeOrder !== afterOrder) changes.push('ORDER CHANGED')

  for (const [position, row] of after.results.entries()) {
    const was = before.results[position]
    if (!was) continue
    if (was.id === row.id) {
      if (was.matchedFields.join('|') !== row.matchedFields.join('|')) {
        changes.push(`${row.id}: fields [${was.matchedFields}] -> [${row.matchedFields}]`)
      }
      if (was.matchedTerms.join('|') !== row.matchedTerms.join('|')) {
        changes.push(`${row.id}: terms [${was.matchedTerms}] -> [${row.matchedTerms}]`)
      }
      if (was.score !== row.score) changes.push(`${row.id}: score ${was.score} -> ${row.score}`)
    }
  }

  if (changes.length > 0) {
    moved += 1
    console.log(`\n${JSON.stringify(query)}`)
    for (const change of changes) console.log(`    ${change}`)
  }
}

console.log(`\n${moved} of ${queries.length} pinned queries moved.`)
if (moved > 0) {
  console.log('Apply these by hand, and say in the commit why the content going in was wrong.')
}
