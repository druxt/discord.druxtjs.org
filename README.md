# discord.druxtjs.org

A simple redirector to the Druxt Discord invite, which is hard to remember.
<https://discord.gg/QnZD46c>

---

Deployed to Netlify via `netlify-cli` in CI (`.gitlab-ci.yml`) — not Netlify's own git
integration, since it can't reach this internal gitlab.local instance. Requires masked
`NETLIFY_AUTH_TOKEN` / `NETLIFY_SITE_ID` CI/CD variables on this project.

Previously hosted on RealityLoop's self-hosted GitLab Pages
(`realityloop.pages.rl.cm`), which was decommissioned in 2026 — the dangling CNAME to
that dead domain is what let a domain-parking service serve ads at
`discord.druxtjs.org` for a while. Full incident writeup: `druxt/workspace` wiki,
"Discord Community" page.
