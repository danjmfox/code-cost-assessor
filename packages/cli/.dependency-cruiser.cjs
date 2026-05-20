/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-core-imports-shell',
      severity: 'error',
      comment: 'Pure Core modules must not import from Imperative Shell',
      from: { path: '^src/core/' },
      to: { path: '^src/shell/' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    moduleSystems: ['es6', 'cjs'],
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
}
