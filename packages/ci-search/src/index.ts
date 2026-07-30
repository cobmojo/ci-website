export {
  type BuiltExcerpts,
  buildExcerpt,
  buildExcerptCandidate,
  buildExcerpts,
  CANDIDATE_MAX_LENGTH,
  CANDIDATE_MIN_LENGTH,
  collapseWhitespace,
  type ExcerptOptions,
  type ExcerptSource,
  excerptSources,
  type SearchExcerpt,
} from './excerpt'
export {
  findTermRanges,
  findTermRangesIn,
  type HighlightSegment,
  highlightSegments,
  mergeRanges,
  segmentByRanges,
} from './matches'
export {
  mapNormalizedRange,
  type NormalizedChunk,
  type NormalizedText,
  normalize,
  normalizeWithSourceMap,
  type TextRange,
  toGraphemes,
} from './normalize-with-source-map'
export { type SearchOptions, type SearchOutcome, scriptureQueryVariants, search } from './query'
export * from './synonyms'
export * from './types'
