import { caseSections, getSection, PRINCIPAL_CLAIMS } from '@ci/content/case'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The case map.
 *
 * A static diagram showing how the six principal claims connect to the pages
 * that argue them, followed by the same information as a nested list of links.
 * The list is not a fallback: it is the accessible equivalent, and it carries
 * every node and every edge the diagram carries.
 *
 * Nothing here is interactive. There is no animation, no dragging and no
 * pointer-only affordance, so the diagram behaves identically in print, in a
 * screen reader, and on a touch device.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/start/', label: 'Start Here' },
  { href: '/start/case-map/', label: 'Case Map' },
]

export const metadata: Metadata = pageMetadata({
  title: 'Case Map',
  description:
    'How the six principal claims of the case connect to the sections that argue them, as a simple diagram and as a complete nested list of links.',
  route: '/start/case-map/',
})

/* ------------------------------------------------------------------ *
 * Diagram model
 *
 * Geometry is expressed once, in the viewBox coordinate system, and both the
 * nodes and the connectors read from it. Row centres are shared by the
 * cluster column and the claim column so the common case is a straight line.
 * ------------------------------------------------------------------ */

const ROW_1 = 90
const ROW_2 = 186
const ROW_3 = 282
const ROW_4 = 378
const ROW_5 = 474
const ROW_6 = 570
const ROW_CENTRES: readonly number[] = [ROW_1, ROW_2, ROW_3, ROW_4, ROW_5, ROW_6]

interface SectionCluster {
  readonly id: string
  /** Label as drawn inside the node, hand-wrapped because SVG does not wrap. */
  readonly labelLines: readonly string[]
  /** Same label as one string, used in the list equivalent. */
  readonly label: string
  readonly sectionIds: readonly string[]
  /** Claim numbers this cluster supplies evidence for. Empty means all of them. */
  readonly claimNumbers: readonly number[]
  readonly cy: number
}

const CLUSTERS: readonly SectionCluster[] = [
  {
    id: 'human-mortality',
    labelLines: ['Human mortality'],
    label: 'Human mortality',
    sectionIds: ['RB2', 'S21', 'S22'],
    claimNumbers: [1],
    cy: ROW_1,
  },
  {
    id: 'penalty-of-sin',
    labelLines: ['The penalty of sin'],
    label: 'The penalty of sin',
    sectionIds: ['S07', 'S10', 'S16', 'S17', 'S18'],
    claimNumbers: [2, 5],
    cy: ROW_2,
  },
  {
    id: 'destruction-language',
    labelLines: ['Destruction language'],
    label: 'Destruction language',
    sectionIds: ['S08', 'S11', 'S12'],
    claimNumbers: [3],
    cy: ROW_3,
  },
  {
    id: 'difficult-passages',
    labelLines: ['Difficult passages'],
    label: 'Difficult passages',
    sectionIds: ['S01', 'S02', 'S03', 'S04', 'S05', 'S06'],
    claimNumbers: [4, 6],
    cy: ROW_4,
  },
  {
    id: 'judgment-patterns',
    labelLines: ['Biblical judgment patterns'],
    label: 'Biblical judgment patterns',
    sectionIds: ['S13', 'S14', 'S15'],
    claimNumbers: [5],
    cy: ROW_5,
  },
  {
    id: 'final-order',
    labelLines: ['Final-order coherence', 'and objections'],
    label: 'Final-order coherence and objections',
    sectionIds: [
      'S19',
      'S20',
      'S23',
      'S24',
      'S25',
      'S26',
      'S27',
      'S28',
      'S29',
      'S30',
      'S31',
      'S32',
      'S33',
      'S34',
    ],
    claimNumbers: [],
    cy: ROW_6,
  },
]

/**
 * Short handles for the claim nodes. The full claim titles come from the
 * registry and are far too long to set inside a 280 unit box, so the diagram
 * carries a handle and the list below carries the wording that counts.
 */
const CLAIM_HANDLES: Readonly<Record<string, readonly string[]>> = {
  'immortality-is-given': ['Immortality is given,', 'not innately possessed'],
  'wage-of-sin-is-death': ['The final wage of sin', 'is death'],
  'language-of-destruction': ['Scripture names the end', 'as destruction'],
  'eternal-describes-result': ['Eternal punishment can', 'name a permanent result'],
  'patterns-end-in-death': ['Patterns of judgment', 'end in death'],
  'difficult-texts-fit': ['The difficult texts fit', 'this framework'],
}

/** Connectors from a cluster to the claim or claims it supplies. */
const CLUSTER_EDGES: readonly { readonly id: string; readonly d: string }[] = [
  { id: 'human-mortality-1', d: 'M 296 90 H 380' },
  { id: 'penalty-2', d: 'M 296 186 H 380' },
  { id: 'penalty-5', d: 'M 296 186 H 330 V 450 H 380' },
  { id: 'destruction-3', d: 'M 296 282 H 380' },
  { id: 'passages-4', d: 'M 296 378 H 380' },
  { id: 'passages-6', d: 'M 296 378 H 352 V 555 H 380' },
  { id: 'patterns-5', d: 'M 296 474 H 380' },
]

const CLUSTER_X = 16
const CLUSTER_WIDTH = 280
const CLAIM_X = 380
const CLAIM_WIDTH = 280
const NODE_HEIGHT = 66
const CLUSTER_CENTRE_X = CLUSTER_X + CLUSTER_WIDTH / 2
const CLAIM_CENTRE_X = CLAIM_X + CLAIM_WIDTH / 2
const CLAIM_RIGHT_X = CLAIM_X + CLAIM_WIDTH

/* ------------------------------------------------------------------ *
 * Derived content
 * ------------------------------------------------------------------ */

function resolveSections(ids: readonly string[]) {
  return ids
    .map(id => getSection(id))
    .filter((section): section is NonNullable<typeof section> => Boolean(section))
}

const CLUSTERED_IDS = new Set(CLUSTERS.flatMap(cluster => cluster.sectionIds))
const UNCLUSTERED_SECTIONS = caseSections.filter(section => !CLUSTERED_IDS.has(section.id))

function clustersForClaim(claimNumber: number): readonly SectionCluster[] {
  return CLUSTERS.filter(cluster => cluster.claimNumbers.includes(claimNumber))
}

/** Node subtitle. Short groups name their sections; long ones give a count. */
function sectionIdSummary(cluster: SectionCluster): string {
  return cluster.sectionIds.length <= 6
    ? `Sections ${cluster.sectionIds.join(', ')}`
    : `${cluster.sectionIds.length} sections`
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function CaseMapPage() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Breadcrumbs trail={CRUMBS} />

      <div className="max-w-[var(--spacing-measure)]">
        <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
          Orientation
        </p>
        <h1 className="mt-0 mb-4">Case Map</h1>
        <p className="m-0 mb-4 text-[1.13rem] leading-[1.6] text-ink-muted">
          The case for conditional immortality (CI) is cumulative. Six principal claims are argued
          separately and then taken together. This page shows which pages supply the evidence for
          which claim.
        </p>
        <p className="m-0">
          The diagram and the list below it carry the same information. If the diagram is hard to
          read at your text size, or you are using a screen reader, the list is the map and loses
          nothing.
        </p>
      </div>

      <figure className="mt-8 mb-0 max-w-[62rem]">
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 960 700"
            role="img"
            aria-labelledby="case-map-title case-map-desc"
            fontFamily="var(--font-sans)"
            className="h-auto w-full max-w-full min-w-[44rem]"
          >
            <title id="case-map-title">Map of the case for conditional immortality</title>
            <desc id="case-map-desc">
              Three columns. On the left, six rounded boxes group the sections of the case by what
              they establish: human mortality, the penalty of sin, destruction language, difficult
              passages, biblical judgment patterns, and final-order coherence and objections. In the
              middle, six square-cornered boxes hold the six principal claims. Lines run from each
              group of sections to the claim or claims it supplies. On the right, a six-sided box
              holds the cumulative conclusion, which every claim feeds into. The
              final-order-coherence group connects to the conclusion directly, because it tests and
              defends all six claims rather than supplying one of them.
            </desc>

            <defs>
              <marker
                id="case-map-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--color-border-strong)" />
              </marker>
            </defs>

            {/* Column labels, inside the graphic rather than in a separate key. */}
            <text
              x={CLUSTER_CENTRE_X}
              y={26}
              textAnchor="middle"
              fontSize="13"
              fill="var(--color-ink-subtle)"
            >
              Sections, grouped by what they show
            </text>
            <text
              x={CLAIM_CENTRE_X}
              y={26}
              textAnchor="middle"
              fontSize="13"
              fill="var(--color-ink-subtle)"
            >
              The six principal claims
            </text>
            <text x={836} y={26} textAnchor="middle" fontSize="13" fill="var(--color-ink-subtle)">
              Taken together
            </text>

            {/* Connectors are drawn first so nodes sit above them. */}
            {CLUSTER_EDGES.map(edge => (
              <path
                key={edge.id}
                d={edge.d}
                fill="none"
                stroke="var(--color-border-strong)"
                strokeWidth="1.6"
                markerEnd="url(#case-map-arrow)"
              />
            ))}

            {ROW_CENTRES.map(cy => (
              <path
                key={`claim-feed-${cy}`}
                d={`M ${CLAIM_RIGHT_X} ${cy} H 700`}
                fill="none"
                stroke="var(--color-border-strong)"
                strokeWidth="1.6"
              />
            ))}
            <path
              d="M 700 90 V 570"
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth="1.6"
            />
            <path
              d="M 700 330 H 726"
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth="1.6"
              markerEnd="url(#case-map-arrow)"
            />

            {/* The final-order group tests the whole case, so it joins the conclusion. */}
            <path
              d="M 156 603 V 652 H 836 V 392"
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth="1.6"
              strokeDasharray="5 4"
              markerEnd="url(#case-map-arrow)"
            />
            <text x={470} y={644} textAnchor="middle" fontSize="12.5" fill="var(--color-ink-muted)">
              Tests and defends all six claims
            </text>

            {/* Cluster nodes: rounded, and every one begins with the word Sections. */}
            {CLUSTERS.map(cluster => {
              const twoLineLabel = cluster.labelLines.length > 1
              const labelStart = twoLineLabel ? cluster.cy - 12 : cluster.cy - 4
              const idsY = twoLineLabel ? cluster.cy + 25 : cluster.cy + 16
              return (
                <g key={cluster.id}>
                  <rect
                    x={CLUSTER_X}
                    y={cluster.cy - NODE_HEIGHT / 2}
                    width={CLUSTER_WIDTH}
                    height={NODE_HEIGHT}
                    rx={NODE_HEIGHT / 2}
                    fill="var(--color-panel)"
                    stroke="var(--color-border-strong)"
                    strokeWidth="1.4"
                  />
                  {cluster.labelLines.map((line, index) => (
                    <text
                      key={line}
                      x={CLUSTER_CENTRE_X}
                      y={labelStart + index * 18}
                      textAnchor="middle"
                      fontSize="14.5"
                      fontWeight="600"
                      fill="var(--color-ink)"
                    >
                      {line}
                    </text>
                  ))}
                  <text
                    x={CLUSTER_CENTRE_X}
                    y={idsY}
                    textAnchor="middle"
                    fontSize="11.5"
                    fill="var(--color-ink-muted)"
                  >
                    {sectionIdSummary(cluster)}
                  </text>
                </g>
              )
            })}

            {/* Claim nodes: square corners, and every one begins with the word Claim. */}
            {PRINCIPAL_CLAIMS.map((claim, index) => {
              const cy = ROW_CENTRES[index] ?? ROW_6
              const handle = CLAIM_HANDLES[claim.id] ?? [claim.title]
              return (
                <g key={claim.id}>
                  <rect
                    x={CLAIM_X}
                    y={cy - NODE_HEIGHT / 2}
                    width={CLAIM_WIDTH}
                    height={NODE_HEIGHT}
                    rx="3"
                    fill="var(--color-paper-raised)"
                    stroke="var(--color-navy)"
                    strokeWidth="1.4"
                  />
                  <text
                    x={CLAIM_CENTRE_X}
                    y={cy - 17}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    letterSpacing="0.08em"
                    fill="var(--color-copper-deep)"
                  >
                    CLAIM {claim.number}
                  </text>
                  {handle.map((line, lineIndex) => (
                    <text
                      key={line}
                      x={CLAIM_CENTRE_X}
                      y={cy + 2 + lineIndex * 18}
                      textAnchor="middle"
                      fontSize="14"
                      fill="var(--color-ink)"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}

            {/* Conclusion node: six-sided, and labelled Conclusion. */}
            <polygon
              points="726,330 766,268 906,268 946,330 906,392 766,392"
              fill="var(--color-ochre-soft)"
              stroke="var(--color-copper-deep)"
              strokeWidth="1.4"
            />
            <text
              x={836}
              y={306}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.08em"
              fill="var(--color-copper-deep)"
            >
              CONCLUSION
            </text>
            <text x={836} y={328} textAnchor="middle" fontSize="13.5" fill="var(--color-ink)">
              The cumulative case for
            </text>
            <text x={836} y={348} textAnchor="middle" fontSize="13.5" fill="var(--color-ink)">
              conditional immortality
            </text>
          </svg>
        </div>
        <figcaption className="mt-3 font-sans text-[0.88rem] text-ink-muted">
          Rounded boxes group sections. Square boxes hold claims. The six-sided box holds the
          conclusion the claims are offered in support of. Shape and wording carry the distinction,
          so nothing depends on colour.
        </figcaption>
      </figure>

      <section aria-labelledby="map-as-list" className="mt-12">
        <h2 id="map-as-list" className="mt-0 mb-3 border-b border-border pb-2">
          The same map as a list
        </h2>
        <p className="m-0 mb-6 max-w-[var(--spacing-measure)]">
          Every node in the diagram appears below, and every section is a link to its page. The
          claims come first with the pages that argue them, then the groups with everything they
          contain.
        </p>

        <h3 className="mt-0 mb-4 text-[1.12rem]">
          The six principal claims and the pages behind them
        </h3>
        <ol className="m-0 space-y-6 pl-6">
          {PRINCIPAL_CLAIMS.map(claim => {
            const clusters = clustersForClaim(claim.number)
            return (
              <li key={claim.id}>
                <span className="block font-sans text-[1rem] font-semibold text-navy">
                  {claim.title}
                </span>
                <span className="mt-1 block text-[1.02rem] text-ink-muted">{claim.summary}</span>
                <span className="mt-2 block font-sans text-[0.9rem] text-ink-subtle">
                  Drawn from:{' '}
                  {clusters.length > 0
                    ? clusters.map(cluster => cluster.label).join(', and ')
                    : 'the case as a whole'}
                </span>
                <ul className="mt-1 space-y-1 pl-6 font-sans text-[0.94rem]">
                  {resolveSections(claim.sectionIds).map(section => (
                    <li key={section.id}>
                      <Link href={section.route}>
                        {section.id}. {section.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>

        <h3 className="mt-10 mb-4 text-[1.12rem]">The six groups of sections</h3>
        <ol className="m-0 space-y-6 pl-6">
          {CLUSTERS.map(cluster => (
            <li key={cluster.id}>
              <span className="block font-sans text-[1rem] font-semibold text-navy">
                {cluster.label}
              </span>
              <span className="mt-1 block font-sans text-[0.9rem] text-ink-subtle">
                {cluster.claimNumbers.length > 0
                  ? `Supplies the evidence for ${
                      cluster.claimNumbers.length === 1
                        ? `claim ${cluster.claimNumbers[0]}`
                        : `claims ${cluster.claimNumbers.join(' and ')}`
                    }.`
                  : 'Tests and defends all six claims rather than supplying any one of them.'}
              </span>
              <ul className="mt-2 space-y-1 pl-6 font-sans text-[0.94rem]">
                {resolveSections(cluster.sectionIds).map(section => (
                  <li key={section.id}>
                    <Link href={section.route}>
                      {section.id}. {section.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {UNCLUSTERED_SECTIONS.length > 0 ? (
        <section aria-labelledby="outside-the-map" className="mt-12">
          <h2 id="outside-the-map" className="mt-0 mb-3 border-b border-border pb-2">
            Sections that sit outside the six groups
          </h2>
          <p className="m-0 mb-4 max-w-[var(--spacing-measure)]">
            These pages are part of the case without belonging to one of the six groups above. They
            set up the question, clear away obstacles to hearing it, or work through an illustration
            at length.
          </p>
          <ul className="m-0 space-y-1 pl-6 font-sans text-[0.94rem]">
            {UNCLUSTERED_SECTIONS.map(section => (
              <li key={section.id}>
                <Link href={section.route}>
                  {section.id}. {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="map-next" className="mt-12 max-w-[var(--spacing-measure)]">
        <h2 id="map-next" className="mt-0 mb-3 border-b border-border pb-2">
          Where to go next
        </h2>
        <ul className="m-0 space-y-2 pl-6 font-sans text-[0.98rem]">
          <li>
            <Link href="/start/">Start Here</Link> for the claims stated in full with a reading
            path.
          </li>
          <li>
            <Link href="/start/compare-the-views/">Compare the Views</Link> for how eternal
            conscious torment, conditional immortality and universal reconciliation differ.
          </li>
          <li>
            <Link href="/case/">The Case</Link> to read the sections in their intended order.
          </li>
        </ul>
      </section>
    </div>
  )
}
