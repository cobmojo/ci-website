#!/usr/bin/env bun
/**
 * Regenerate the video transcript cues from the author's published caption
 * track.
 *
 *     python -m pip install youtube-transcript-api
 *     bun run scripts/conditional-immortality/import-transcript.ts
 *
 * The plain timed-text endpoint no longer serves captions — it answers 200 with
 * an empty body — hence `youtube-transcript-api`, the only Python dependency in
 * the repository and needed for this script alone.
 *
 * The fetched cues are compared against the committed ones before writing. A
 * difference means the captions genuinely changed, and the chapter boundaries
 * in `packages/ci-content/src/video/index.ts` are expressed in seconds, so they
 * need checking too.
 */
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { TRANSCRIPT_CUES } from '../../packages/ci-content/src/video/transcript'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const OUT_FILE = join(REPO_ROOT, 'packages', 'ci-content', 'src', 'video', 'transcript.ts')

const YOUTUBE_ID = '9fevXbKUKmE'

interface RawCue {
  readonly text: string
  readonly start: number
  readonly duration: number
}

/**
 * Caption text arrives with non-breaking spaces and hard line breaks from the
 * renderer. They are presentation, not content. U+00A0 is spelled out rather
 * than written literally, since an invisible character in a regex invites an
 * accidental change.
 */
function normalise(text: string): string {
  return text.replace(/[\u00a0\s]+/g, ' ').trim()
}

function fetchCues(): RawCue[] {
  const program = [
    'import json',
    'from youtube_transcript_api import YouTubeTranscriptApi',
    'api = YouTubeTranscriptApi()',
    `data = api.fetch(${JSON.stringify(YOUTUBE_ID)}, languages=['en']).to_raw_data()`,
    // ASCII-escaped deliberately. Python's stdout follows the system codepage
    // on Windows, and emitting the caption text directly turned every
    // non-breaking space into U+FFFD before Bun ever saw it. Escaping keeps the
    // pipe pure ASCII, and JSON.parse restores the original characters.
    'print(json.dumps(data, ensure_ascii=True))',
  ].join('\n')

  const result = Bun.spawnSync(['python', '-c', program], { stdout: 'pipe', stderr: 'pipe' })
  if (result.exitCode !== 0) {
    const stderr = new TextDecoder().decode(result.stderr)
    process.stderr.write(`Could not fetch the caption track:\n${stderr}\n`)
    if (/ModuleNotFoundError|No module named/.test(stderr)) {
      process.stderr.write(
        '\nInstall the fetcher first:\n  python -m pip install youtube-transcript-api\n',
      )
    }
    process.exit(1)
  }
  return JSON.parse(new TextDecoder().decode(result.stdout)) as RawCue[]
}

function serialise(cues: readonly RawCue[]): string {
  const quote = (value: string) =>
    value.includes("'") && !value.includes('"')
      ? `"${value.replace(/\\/g, '\\\\')}"`
      : `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

  const body = cues
    .map(cue =>
      [
        '  {',
        `    start: ${cue.start},`,
        `    duration: ${cue.duration},`,
        `    text: ${quote(normalise(cue.text))},`,
        '  },',
      ].join('\n'),
    )
    .join('\n')

  return `import type { TranscriptCue } from '@ci/content-schema'

/**
 * Transcript cues for the featured video.
 *
 * Source: the author's own manually created English caption track published
 * with the video, retrieved 2026-07-29. These are the published caption times
 * and text, not estimates and not machine transcription. Cue text was checked
 * against the source document for Scripture references, section numbering and
 * theological terminology; only whitespace differs from the published track.
 *
 * GENERATED FILE — do not edit by hand. Regenerate with
 * \`bun run scripts/conditional-immortality/import-transcript.ts\` rather than
 * editing timings by hand.
 */
export const TRANSCRIPT_CUES: readonly TranscriptCue[] = [
${body}
]
`
}

const fetched = fetchCues()
process.stdout.write(`Fetched ${fetched.length} cue(s) for ${YOUTUBE_ID}\n`)

if (fetched.length === 0) {
  process.stderr.write('The caption track came back empty. Refusing to write.\n')
  process.exit(1)
}

/* Compare against what is committed before touching it. */
const differences: string[] = []
if (fetched.length !== TRANSCRIPT_CUES.length) {
  differences.push(`  cue count: ${TRANSCRIPT_CUES.length} committed, ${fetched.length} fetched`)
}
for (let index = 0; index < Math.min(fetched.length, TRANSCRIPT_CUES.length); index += 1) {
  const mine = TRANSCRIPT_CUES[index]
  const theirs = fetched[index]
  if (!mine || !theirs) continue
  if (normalise(theirs.text) !== mine.text) {
    differences.push(
      `  cue ${index} text:\n    committed: ${mine.text}\n    fetched:   ${normalise(theirs.text)}`,
    )
  }
  if (theirs.start !== mine.start || theirs.duration !== mine.duration) {
    differences.push(
      `  cue ${index} timing: committed ${mine.start}+${mine.duration}, ` +
        `fetched ${theirs.start}+${theirs.duration}`,
    )
  }
}

if (differences.length > 0) {
  process.stdout.write(
    `\n${differences.length} difference(s) from the committed transcript:\n${differences.slice(0, 20).join('\n')}\n`,
  )
  process.stdout.write(
    '\nThe published captions have changed. Chapter boundaries in\n' +
      'packages/ci-content/src/video/index.ts are expressed in seconds and may no\n' +
      'longer line up — check them, and `bun run content:validate` after writing.\n',
  )
} else {
  process.stdout.write('Every cue and every timing matches what is committed.\n')
}

writeFileSync(OUT_FILE, serialise(fetched), 'utf8')

const format = Bun.spawnSync(['bunx', 'biome', 'check', '--write', OUT_FILE], {
  cwd: REPO_ROOT,
  stdout: 'pipe',
  stderr: 'pipe',
})
if (format.exitCode !== 0) {
  process.stderr.write(`\nbiome could not format the generated file:\n${format.stderr}\n`)
  process.exit(1)
}

process.stdout.write(`\nWrote ${OUT_FILE}\n${fetched.length} cues\n`)
