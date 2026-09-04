export default {
  extends: ['stylelint-config-standard'],
  overrides: [
    {
      // The whole stylesheet lives in index.html's <style> block; there is no
      // separate CSS file to lint because Pages publishes only the one page.
      files: ['**/*.html'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    // Single-line rules (`a { color: var(--link); }`) are the deliberate house
    // style for this page - it is read top to bottom, not navigated.
    'declaration-block-single-line-max-declarations': null,
    // The footer link overrides sit at the bottom with their own :hover state
    // directly beneath them. Grouping them there reads better than hoisting
    // them above the generic anchor rules to satisfy source order.
    'no-descending-specificity': null,
  },
}
