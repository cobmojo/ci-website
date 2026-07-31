# Search operations checklist

For the owner, after the domain exists. Nothing here can be done from the
repository, and nothing here is a promise about rankings, indexing or search
appearance — those are Google's decisions, not this site's.

`docs/launch-runbook.md` covers the deployment itself. This covers search.

## 1. Before the first production build

- [ ] Register the domain. Decide **apex or `www`** and do not change it later:
      it is baked into every canonical URL at build time, so changing it needs a
      rebuild, not a redeploy.
- [ ] Build with `NEXT_PUBLIC_SITE_URL=https://<the domain>` and
      `SITE_ENV=production`. A build with neither that nor the localhost opt-out
      fails on purpose, with the reason.
- [ ] Confirm the non-canonical host redirects to the canonical one, in one hop.

## 2. Verify the property

- [ ] Create a **Domain property** in Google Search Console if you control DNS —
      it covers both hosts and both schemes, so it cannot disagree with itself.
      A URL-prefix property is the fallback and must name the exact canonical
      origin.
- [ ] Verify by DNS TXT record. If you must use an HTML file or meta tag, the
      token is the only value that belongs in the repository, and it is public.
- [ ] Submit `https://<the domain>/sitemap.xml`.

## 3. Inspect one URL from every family

Not just the homepage. One of each, because each is built by a different
template:

`/` · `/start/what-is-conditional-immortality/` · `/case/` · one `/case/…/`
section · one `/objections/…/` · one `/appendix/…/` · one `/passages/…/` ·
one `/topics/…/` · one `/changelog/…/` · `/watch/` · `/glossary/` · `/sources/` ·
`/about/` · `/method/`

For each, use URL Inspection and confirm: the page is crawlable, the
Google-selected canonical matches the declared canonical, and the rendered HTML
contains the main content.

Also confirm the two deliberate exclusions are **not** indexed: `/full-case/`
and `/search/` are `noindex` by design and are absent from the sitemap.

## 4. Reports to read, and what counts as a problem

| Report | A problem looks like |
| --- | --- |
| Page indexing | A canonical route in *Excluded*, especially "Duplicate, Google chose a different canonical" or "Crawled — currently not indexed" across a whole family |
| Sitemaps | Any status other than Success, or a read count far below the sitemap's entry count |
| Core Web Vitals | Any URL group falling out of *Good* at the 75th percentile |
| Video indexing | The watch page not recognised as a video page |
| Manual actions | Anything at all |
| Security issues | Anything at all |
| HTTPS | Any URL reported as not HTTPS |

Structured-data reports will show **Breadcrumbs**, **Videos** and **Articles**.
Valid markup is a precondition for a rich result, never a guarantee of one.

## 5. When to look

- **48 hours after launch** — property verified, sitemap read, homepage indexed.
- **2 weeks** — most of the 120 canonical routes discovered. Discovery is not
  indexing, and Google indexes on its own schedule.
- **6 weeks** — a first honest read of queries and pages. Before this, the data
  is too thin to act on.
- **After any substantive content change** — request re-indexing for the changed
  URL only, and let `lastmod` do the rest. `lastmod` is only useful while it
  stays truthful, so do not touch it for styling, metadata or test changes.

## 6. Bing and others

Bing Webmaster Tools can import the Search Console property. Worth doing once;
not worth maintaining separately unless the audience turns out to be there.
IndexNow was evaluated and rejected for a site that changes this rarely — see
the audit report.

## 7. The AI-crawler decision, which is yours

`robots.txt` currently allows every crawler except on `/api/`. That means AI
crawlers are allowed by default. Deciding otherwise means separating three
different things, which are not the same and should not be answered together:

- **search indexing** — being findable at all;
- **AI-search retrieval** — being quoted in an AI answer, with or without a
  link back;
- **model training** — the site's text becoming weights.

The site's own rights position is in `docs/rights-audit.md`: the prose is the
author's, Scripture is public-domain WEB text, and quoted sources are quoted
under fair use with attribution. Blocking a training crawler is not an SEO
defect and does not affect Google Search indexing. This decision was
deliberately left open rather than made on the owner's behalf.
