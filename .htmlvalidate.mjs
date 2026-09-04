export default {
  extends: ['html-validate:recommended'],
  rules: {
    // The timed redirect is a deliberate, documented WCAG 2.2.1 exception.
    // It is not silently dropped: the Playwright suite tracks it as a named
    // axe exception, and fails if it ever stops being needed. See README.
    'meta-refresh': 'off',
    // Nothing is loaded from a CDN; the page has no external assets at all,
    // which the unit suite asserts directly.
    'require-sri': 'off',
  },
}
