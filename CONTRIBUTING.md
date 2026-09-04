# Contributing

This repository is one static page. GitHub Pages serves it straight from the
default branch, so a merge is a deploy and every check has to run before it.

## Getting set up

```sh
pnpm install
mise run hooks:install   # once per clone
```

Node 22 and pnpm 10. `mise run install` provides both if you use mise.

## Before you push

```sh
mise run ci
```

That is lint, the fast tests, and the Playwright suite, exactly what CI runs.
If you only touched prose, `pnpm lint` is enough.

## What the checks are for

| Check | Guards against |
| ----- | -------------- |
| `lint:html` | Invalid or inaccessible markup |
| `lint:style` | Mistakes in the stylesheet inside `index.html` |
| `lint:md` | Malformed Markdown |
| `lint:spell` | Typos, including in the page copy people read |
| `lint:private` | Publishing a URL that only resolves on a private network |
| `test` | The invite drifting apart across the four places it is written |
| `test:e2e` | The redirect not firing, and accessibility regressions |

## Seeing the change

The GitLab pipeline has a manual `preview` job. Run it from the pipeline view
and watch its log for a `https://*.trycloudflare.com` URL, which serves the
page for as long as the job runs. Worth doing for anything visual: a diff of
inline CSS does not tell you how the page looks on a phone, and following the
redirect is the one behaviour a diff cannot show at all.

## Commits

[Conventional Commits](https://www.conventionalcommits.org). The commit-msg
hook checks the format, and CI checks it again on every pull request.

Pull request titles have to be conventional too. This repository squash-merges,
so the title becomes the commit subject on the default branch.

## Changing the page

`index.html` is hand-edited and has no build step. Two things to know:

- The stylesheet, the logo, and everything else are inline on purpose. Pages
  publishes exactly one file, so an external asset is a new point of failure
  and a new privacy consideration. `test` fails if one appears.
- The invite code is written four times. Change all four. `test` will tell you
  if you missed one.

## Accessibility

`test:e2e` runs axe against WCAG 2.1 A and AA. One violation is recorded as a
named exception in the spec, with the reasoning next to it. If you change the
page so that violation no longer fires, a test fails to tell you to delete the
exception. Do not add to that list without saying why in the pull request.
