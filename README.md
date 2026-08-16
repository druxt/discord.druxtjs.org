# discord.druxtjs.org

A simple redirector to the Druxt Discord invite, which is hard to remember.
<https://discord.gg/QnZD46c>

---

Deployed via **GitHub Pages, "deploy from branch"** — no build step, no CI, no deploy
tokens. GitHub serves `index.html` directly and auto-provisions TLS for the custom
domain from the `CNAME` file in this repo.

Setup once this repo is on `github.com/druxt/discord.druxtjs.org`:

1. Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/(root)`
2. Settings → Pages → Custom domain: `discord.druxtjs.org` (picks up the `CNAME` file)
3. Wait for the cert to provision, then enable **Enforce HTTPS**
4. Namecheap: CNAME `discord` → `druxt.github.io`

Previously hosted on RealityLoop's self-hosted GitLab Pages
(`realityloop.pages.rl.cm`), which was decommissioned in 2026 — the dangling CNAME to
that dead domain is what let a domain-parking service serve ads at
`discord.druxtjs.org` for a while. Full incident writeup: `druxt/workspace` wiki,
"Discord Community" page.
