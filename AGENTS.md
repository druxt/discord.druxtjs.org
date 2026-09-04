# Agent notes

A single static page that redirects <https://discord.druxtjs.org> to the
DruxtJS Discord invite. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. This
file covers the things that are easy to get wrong here.

## The deploy is the branch

GitHub Pages serves `index.html` from the default branch with no build step.
There is no staging step between merge and production, so never merge on a red
pipeline, and never treat a check as advisory because the change looks small.

## This repository is public

Everything committed here is published. Do not add a URL, hostname, project
name, or issue link that only makes sense inside a private network.
`pnpm lint:private` catches the URL-shaped cases. It cannot catch a bare
internal project name written as prose, so that one is on you.

## Keep the page self-contained

The stylesheet and the logo are inline deliberately. Do not introduce an
external stylesheet, script, font, or image. `pnpm test` fails if you do, and
the allowlist in `tests/helpers/page.js` is the place to argue about it, not
somewhere to quietly extend.

## Do not silence a11y findings

`tests/e2e/redirect.spec.js` records known axe violations as a named list, so
new ones still fail. Widening that list is a decision to discuss in the pull
request, not a way to get green.

## Keep the two pipelines in step

`.github/workflows/ci.yml` guards the branch Pages deploys from.
`.gitlab-ci.yml` runs the same checks where review happens. A check added to
one belongs in the other.

## Visual baselines are per architecture

There are two committed baseline sets, `arm64` and `x64`, because Chromium's
text rendering differs between them. Regenerating one and committing it alone
turns the other pipeline red, and regenerating both from the same machine is
worse, because it looks correct and is not. Each set comes from a job running
on that architecture. See CONTRIBUTING.md.

## Commands

| Command | What it does |
| ------- | ------------ |
| `mise run ci` | Everything CI runs |
| `pnpm lint` | HTML, stylesheet, Markdown, spelling, private hosts |
| `pnpm test` | Markup and invite consistency, no browser |
| `pnpm test:e2e` | Playwright: redirect, keyboard, reduced motion, axe |
| `pnpm test:visual` | Four viewports against this architecture's baselines |
