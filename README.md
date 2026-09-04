# discord.druxtjs.org

A redirector from <https://discord.druxtjs.org> to the DruxtJS Discord invite,
which is hard to remember.

<https://discord.gg/hndGTbyA92>

## How it deploys

GitHub Pages serves `index.html` from the default branch. There is no build
step, no deploy token, and no deploy job: merging is the deploy. The `CNAME`
file holds the custom domain, and GitHub provisions the certificate from it.

| Setting | Value |
| ------- | ----- |
| Source | Deploy from a branch, `main`, folder `/` |
| Custom domain | `discord.druxtjs.org` |
| HTTPS | Enforced |
| DNS | CNAME `discord` to `druxt.github.io` |

Because the deploy is just the branch, everything that guards the page has to
run before merge. See [CONTRIBUTING.md](CONTRIBUTING.md).

The site used to run on a self-hosted GitLab Pages instance that was
decommissioned in 2026. Its CNAME was left pointing at the dead domain, which
let a domain parking service serve ads on `discord.druxtjs.org` for a while.
The incident writeup is in the internal project wiki.

## Changing the invite

The invite code is written in four places: the meta refresh, the button link,
the footer text, and this README. Change all four. `pnpm test` fails if any of
them disagree, so you do not have to remember which is which.

## Development

Node 22 and pnpm 10. With [mise](https://mise.jdx.dev), `mise run install`
sets both up.

| Command | What it checks |
| ------- | -------------- |
| `pnpm lint` | HTML, the inline stylesheet, Markdown, spelling, private hosts |
| `pnpm test` | Markup and invite consistency. Fast, no browser |
| `pnpm test:e2e` | Redirect, keyboard, reduced motion, axe. Needs Chromium |
| `pnpm test:visual` | Four viewports against committed screenshots |

`mise run ci` runs all of it the way CI does. Install the commit hooks once
per clone with `mise run hooks:install`.

## Accessibility

Every run scans the page with axe against WCAG 2.1 A and AA. One violation is
recorded as a known exception rather than suppressed: a timed
`<meta http-equiv="refresh">` fails 2.2.1 Timing Adjustable, which allows a
redirect delay of zero or over twenty hours and nothing in between. The 1.5
second pause is deliberate, and Pages cannot issue a real 301 in its place. The
invite is also an ordinary link, so nobody is stuck waiting on the timer.
Setting the delay to `0` would clear the exception and remove the pause.
