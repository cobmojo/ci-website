# Launch runbook

Everything needed to put this site into production, verify it, and take it back
out again. Short on purpose: a runbook nobody can follow at three in the
morning is decoration.

The companion document is
[Production-readiness QA](production-readiness-qa.md), which records what was
reviewed and what is still an external decision. This one is the procedure.

## Before anything: the two decisions only a person can make

The site is code-complete and gated. Two things cannot be settled in this
repository, and both block a real launch:

1. **The canonical domain.** Apex or `www`, registered and pointed. The build
   refuses to run without it (see below), on purpose.
2. **Where reader corrections are stored.** The correction form is the only
   write this site performs. Pick a store, provision it, and set the variables
   in §2. Until then the endpoint answers 503 and tells the reader nothing was
   recorded — which is correct behaviour, and not a launched state.

## 1. Build

```bash
bun install --frozen-lockfile
NEXT_PUBLIC_SITE_URL=https://your-domain.example SITE_ENV=production bun run build
```

`NEXT_PUBLIC_SITE_URL` is **required**. Without it — and without the localhost
opt-out the test suites use — the build fails with an actionable message,
because a build that guesses it is silently wrong in 604 output files at once:
every canonical link, all 118 sitemap entries, `Host` and `Sitemap` in
robots.txt, every Open Graph URL, the address printed on the three downloads,
and the destination encoded in the printed handout's QR code.

It is baked at build time. Setting it on a running server afterwards changes
nothing; it needs a rebuild.

Rules the value must satisfy, all enforced:

| Rule | Why |
|---|---|
| Absolute URL | Anything else is not an origin |
| `https` | A release site is not served in clear |
| No path component | It would appear twice in every URL the site builds |
| No query or fragment | Same |
| No credentials | It is published in the sitemap |
| Trailing slashes are stripped | So nothing concatenates a double slash |

Decide apex versus `www` **before** the first build and do not change it
casually: every canonical URL, every sitemap entry and the printed QR code
carry it.

## 2. Environment

Names, purposes and safe values are in [`.env.example`](../.env.example). The
short version of what production needs:

| Variable | Required | Scope | If it is wrong |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | build **and** runtime | Build fails; and the server refuses to boot, because `next.config.ts` resolves the origin when it loads |
| `SITE_ENV` | yes | build | A preview becomes indexable and competes with production |
| `FEEDBACK_STORE` | yes | runtime | Defaults to `filesystem` |
| `FEEDBACK_STORE_DIR` | filesystem only | runtime | Endpoint answers 503 |
| `FEEDBACK_STORE_DURABLE` | filesystem only | runtime | Endpoint answers 503 |
| `FEEDBACK_STORE_URL` | http only | runtime | Endpoint answers 503 |
| `FEEDBACK_STORE_FIRST_PARTY` | http only | runtime | Endpoint answers 503 |
| `FEEDBACK_STORE_TOKEN` | http, if the endpoint needs it | runtime | Collector rejects the write |
| `FEEDBACK_TRUSTED_PROXY_HOPS` | no (default 1) | runtime | Rate limiting keyed wrongly |
| `FEEDBACK_NOTIFY_EMAIL` | no | runtime | One log line per submission, or none |

No secret ever goes in a `NEXT_PUBLIC_` variable: those are inlined into the
browser bundle. `FEEDBACK_STORE_TOKEN` is the only secret here.

## 3. Choose the feedback store

The code cannot tell a durable directory from an ephemeral one — a volume that
survives a redeploy and one that evaporates behave identically to a file write
— so the deployment has to say which it has.

**On a serverless or containerised host** (Vercel, Netlify, Cloud Run, Fly,
anything that replaces the filesystem on deploy) the filesystem store is not an
option. Use:

```
FEEDBACK_STORE=http
FEEDBACK_STORE_URL=https://your-collector.example/feedback
FEEDBACK_STORE_FIRST_PARTY=1
FEEDBACK_STORE_TOKEN=…
```

The collector is any endpoint that accepts `POST` of one JSON record and stores
it durably — a serverless function writing to a managed database, a small
service of your own — and it must answer 2xx only when the record is safe. The
site treats any other status, and any timeout beyond five seconds, as a failure
and tells the reader nothing was stored.

**It has to be yours.** `FEEDBACK_STORE_FIRST_PARTY=1` is you stating that,
and it is required in production for the same reason `FEEDBACK_STORE_DURABLE`
is: the code cannot check it. Every submission goes to that URL in full — the
message, and the reader's name and email address if they gave them — while
`/corrections/` tells them "no third party is contacted" and that submissions
are "stored on the site's own server", and `/privacy/` says "there is no third
party involved in receiving, storing or reading a submission".

So a hosted form product, a spreadsheet webhook, or anything else run by
somebody else is **not** an option here without first changing those two pages.
That is a real decision and it is available — but it is a decision, not a
configuration detail, and the endpoint refuses to start until one of the two
has been made. `resolveFeedbackConfig` holds the gate and
`config.test.ts` holds the pages to the promise it protects, so the pair cannot
drift apart quietly.

**On a persistent server with a real volume**, prove all of the following
before setting the acknowledgement:

- the directory is on a volume that is not part of the deployment artefact
- a deploy does not replace or empty it
- the service user can write to it
- it is included in whatever backs the machine up
- a restore has actually been performed once

Then:

```
FEEDBACK_STORE=filesystem
FEEDBACK_STORE_DIR=/var/lib/conditional-immortality/feedback
FEEDBACK_STORE_DURABLE=1
```

`FEEDBACK_STORE_DURABLE=1` is you asserting the list above. Nothing checks it.

## 4. Deploy

The site needs a Node runtime; it is not a static export. Three routes are
server-rendered: `/api/feedback/`, `/og/` and `/search/`.

```
install:  bun install --frozen-lockfile
build:    bun run build         (with the variables from §1 set)
start:    bun run start         (with the same variables set)
root:     the repository root, not apps/conditional-immortality
node:     22 or later
```

`start` needs `NEXT_PUBLIC_SITE_URL` too, not only `build`. `next.config.ts`
resolves the canonical origin when it loads, and `next start` loads it on every
boot, so a server started without it stops with the same message the build
gives. The value must be the one the build used: it is baked into the output,
and setting a different one at start changes nothing but the header policy.

`next start` takes its port from `PORT` when the platform sets one, and 3000
otherwise. Nothing passes `--port`, so a platform-assigned port works.

If the platform serves headers of its own, check §6 afterwards: the security
headers are set by `next.config.ts`, and a platform is free to strip or
override them.

## 5. Verify the deployment before pointing the domain at it

Against the preview or staging URL, not production:

```bash
PLAYWRIGHT_BASE_URL=https://preview.example bun run test:preview
```

That runs the origin-agnostic suite — smoke flows and the whole header
contract — against the real edge, with no local server. It is the only thing
that can tell you about TLS, CDN behaviour, compression and the platform's own
header handling; a localhost run cannot.

Then by hand, once:

- [ ] `curl -I https://preview.example/` — `Strict-Transport-Security` present
- [ ] `curl -I https://preview.example/` — `X-Robots-Tag: noindex, nofollow` on a
      preview. This is the directive that keeps a preview out of the index
- [ ] `curl https://preview.example/robots.txt` — a preview **allows** crawling
      and names no sitemap and no host. The allow is deliberate: a crawler that
      is blocked never reads the `X-Robots-Tag` above, and an already-discovered
      URL then stays eligible for a URL-only result
- [ ] `https://preview.example/sitemap.xml` — entries use the canonical origin
- [ ] Open the print dialog on `/full-case/` — disclosures are open on paper
- [ ] Submit one correction, and confirm the record arrives in the real store
- [ ] Check the logs for that submission: the id and the type, nothing else

## 6. After the domain is live

- [ ] HTTPS certificate issued and auto-renewing
- [ ] `http://` redirects to `https://`
- [ ] The non-canonical host redirects to the canonical one (`www` → apex, or
      the reverse — whichever `NEXT_PUBLIC_SITE_URL` names)
- [ ] `SITE_ENV=production`, and `robots.txt` allows crawling
- [ ] Submit the sitemap to Search Console
- [ ] Run `bun run content:links:external` once, and note the date

`Strict-Transport-Security` is sent with `max-age=63072000; includeSubDomains`
and deliberately **without** `preload`. Preloading is close to irreversible and
commits every future subdomain; add it, if at all, after the domain has been
serving HTTPS for months.

## 7. Rollback

The site is stateless apart from the feedback store, so a rollback is a
redeploy of the previous build.

1. Redeploy the last known-good commit with the same environment variables.
2. If the rollback is because of a bad `NEXT_PUBLIC_SITE_URL`, it must be a
   **rebuild**, not a restart: the value is baked in.
3. The feedback store is unaffected by a rollback. Records written by the newer
   build are still there and still readable — the format is append-only JSON
   Lines with no schema version, so an older build reads them unchanged.
4. If the store configuration was the problem, the endpoint was answering 503
   and refusing submissions. Nothing was silently lost, and nothing needs
   reconciling.

## 8. Reader corrections: the operations

**Read them.** Filesystem store: one JSON Lines file per calendar month,
`feedback-YYYY-MM.jsonl`, mode 0600.

```bash
jq -s 'sort_by(.createdAt)' /var/lib/conditional-immortality/feedback/feedback-*.jsonl
```

With the http store, read them wherever the collector puts them.

**Export.** Concatenate the files; every line is a complete record.

```bash
cat feedback-*.jsonl > export-$(date -u +%Y-%m-%d).jsonl
```

**Delete on request.** The privacy page promises this. A record is one line, so
deletion is a filter:

```bash
jq -c 'select(.email != "person@example.org")' feedback-2026-07.jsonl > tmp \
  && mv tmp feedback-2026-07.jsonl
```

Deleting by `id` is the same with `select(.id != "…")`. Keep a note of what was
deleted and when, outside the store.

**Retention.** The privacy page says submissions are deleted within
twenty-four months of being resolved. Nothing enforces that automatically;
it is a calendar task. A month older than twenty-four months whose records are
all resolved can be deleted whole.

**Backups.** Whatever backs up the volume backs up the store. Test a restore
once, before launch, and note the date here. With the http store this is the
collector's problem and has to be answered there.

## 9. Ongoing

| What | When | Command |
|---|---|---|
| Full gate | Every push | CI, automatically |
| External links | Monthly | `bun run content:links:external`, or the scheduled workflow |
| Dependency updates | Weekly | Dependabot opens them; CI judges them |
| Core Web Vitals | Monthly after launch | See below |

**Field performance.** The site has never been served to the public, so it has
no field data, and lab numbers are not field numbers. After launch, read Core
Web Vitals from Search Console: it is already collected, needs no script on the
page, and adding an analytics product to measure performance would contradict
the privacy page and the no-third-party rule the whole site is built on.

## 10. Who owns what

Fill this in before launch. An unowned line is an outage nobody answers.

| Area | Owner |
|---|---|
| Domain and DNS | |
| TLS certificate | |
| Hosting account | |
| Feedback store and its backups | |
| Incident response | |
| Theological review decisions | |
