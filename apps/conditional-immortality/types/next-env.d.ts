/// <reference types="next" />
/// <reference types="next/image-types/global" />

// The `next-env.d.ts` Next generates at the app root is gitignored: it imports
// a routes file from inside `.next/`, which differs between `next dev` and
// `next build` and is absent on a fresh clone, where `validate` typechecks
// before it builds. These two directives are the environment-independent half,
// so they live here instead. The routes import is not reproduced: this app sets
// `typedRoutes: false`, so it declares nothing.
