// Empty stub used in vitest to satisfy `import "server-only";` from real
// server modules under test. The real "server-only" package throws when
// imported in a non-RSC environment; in tests we want server modules to
// import without exploding.
export {};
