import {
  type CommentLedgerEntry,
  CommentLedgerEntrySchema,
  type MediaDisposition,
  MediaDispositionSchema,
  type MigrationLedgerEntry,
  MigrationLedgerEntrySchema,
} from '@ci/content-schema'
import { COMMENT_LEDGER } from './comments'
import { LEDGER_ENTRIES, LEDGER_SUMMARY, type LedgerSummary } from './ledger'
import { MEDIA_DISPOSITIONS } from './media'

function validate<T>(
  records: readonly unknown[],
  schema: {
    safeParse: (value: unknown) => {
      success: boolean
      data?: T
      error?: { issues: { path: (string | number | symbol)[]; message: string }[] }
    }
  },
  label: string,
): readonly T[] {
  return records.map((record, index) => {
    const parsed = schema.safeParse(record)
    if (!parsed.success || !parsed.data) {
      throw new Error(
        `Invalid ${label} at index ${index}:\n${(parsed.error?.issues ?? [])
          .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
          .join('\n')}`,
      )
    }
    return parsed.data
  })
}

export const commentLedger: readonly CommentLedgerEntry[] = validate(
  COMMENT_LEDGER,
  CommentLedgerEntrySchema,
  'comment ledger entry',
)

export const mediaDispositions: readonly MediaDisposition[] = validate(
  MEDIA_DISPOSITIONS,
  MediaDispositionSchema,
  'media disposition',
)

export const migrationLedger: readonly MigrationLedgerEntry[] = validate(
  LEDGER_ENTRIES,
  MigrationLedgerEntrySchema,
  'migration ledger entry',
)

export { LEDGER_SUMMARY, type LedgerSummary }

/** Counts used by the content audit and the original-document page. */
export interface MigrationTotals {
  readonly totalElements: number
  readonly mapped: number
  readonly privateOnly: number
  readonly omittedFormattingOnly: number
  readonly unmapped: number
  readonly comments: number
  readonly commentsWithDisposition: number
  readonly media: number
  readonly hyperlinks: number
}

export function migrationTotals(): MigrationTotals {
  const substantive = migrationLedger.filter(
    entry => entry.treatment !== 'omitted-as-formatting-only',
  )
  return {
    totalElements: migrationLedger.length,
    mapped: substantive.filter(entry => Boolean(entry.destinationRoute)).length,
    privateOnly: migrationLedger.filter(entry => entry.treatment === 'private-source-only').length,
    omittedFormattingOnly: migrationLedger.filter(
      entry => entry.treatment === 'omitted-as-formatting-only',
    ).length,
    unmapped: substantive.filter(
      entry => !entry.destinationRoute && entry.treatment !== 'private-source-only',
    ).length,
    comments: commentLedger.length,
    commentsWithDisposition: commentLedger.filter(entry => Boolean(entry.disposition)).length,
    media: mediaDispositions.length,
    hyperlinks: LEDGER_SUMMARY.hyperlinkCount,
  }
}

export { COMMENT_LEDGER, MEDIA_DISPOSITIONS }
