import { type TopicRecord, TopicRecordSchema } from '@ci/content-schema'
import { TOPIC_RECORDS } from './topics'

export const topics: readonly TopicRecord[] = TOPIC_RECORDS.map(record => {
  const parsed = TopicRecordSchema.safeParse(record)
  if (!parsed.success) {
    throw new Error(
      `Invalid topic "${record.id}":\n${parsed.error.issues
        .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`,
    )
  }
  return parsed.data
}).sort((a, b) => a.title.localeCompare(b.title))

const BY_SLUG = new Map(topics.map(topic => [topic.slug, topic]))

export function getTopic(slug: string): TopicRecord | undefined {
  return BY_SLUG.get(slug)
}

export function topicRoute(topic: TopicRecord): string {
  return `/topics/${topic.slug}/`
}

export function topicsForSection(sectionId: string): readonly TopicRecord[] {
  return topics.filter(topic => topic.relatedSections.includes(sectionId))
}

export { TOPIC_RECORDS }
