/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Next.js regenerates `next-env.d.ts` at the app root on every `next dev` and
// `next build`, and the file it writes is not stable: under `next dev` it
// imports `./.next/dev/types/routes.d.ts`, and under `next build` it imports
// `./.next/types/routes.d.ts`. Both live inside the gitignored `.next/`
// directory, so a committed copy either churns on every switch between the two
// commands or breaks `tsc --noEmit` on a fresh clone, where neither target
// exists. `validate` runs typecheck *before* build, so a fresh clone hit the
// second failure every time.
//
// The generated file is therefore gitignored, and this committed file carries
// the two reference directives that actually matter — the ambient Next types
// and the static-image module declarations. It is environment-independent, so
// it is safe to check in. The routes import is not reproduced here: this app
// sets `typedRoutes: false` in `next.config.ts`, so it declares nothing.
