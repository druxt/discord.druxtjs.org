// The redirect page is a single hand-edited file that ships straight to
// production with no build step, so these tests guard the things a human
// editing it would plausibly get wrong: an invite updated in three of its
// four places, an external asset that breaks when the CDN moves, a missing
// head tag. They parse the real index.html - there is no fixture to drift.

import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { parse } from 'node-html-parser'

import { ALLOWED_HOSTS, canonicalInvite, inviteCodesIn, readRepoFile } from '../helpers/page.js'

const html = readRepoFile('index.html')
const readme = readRepoFile('README.md')
const doc = parse(html)

const attrValues = (selector, attr) =>
  doc.querySelectorAll(selector).map((el) => el.getAttribute(attr)).filter(Boolean)

describe('discord invite', () => {
  test('index.html agrees with itself about the invite code', () => {
    const codes = new Set(inviteCodesIn(html))
    assert.equal(
      codes.size,
      1,
      `index.html should reference exactly one invite, found: ${[...codes].join(', ')}`,
    )
  })

  test('the meta refresh, the button and the footer all use it', () => {
    const invite = canonicalInvite()
    const refresh = doc.querySelector('meta[http-equiv="refresh"]').getAttribute('content')
    const button = doc.querySelector('a.invite').getAttribute('href')
    const footer = doc.querySelector('footer').text

    assert.match(refresh, new RegExp(`url=https://discord\\.gg/${invite}$`))
    assert.equal(button, `https://discord.gg/${invite}`)
    assert.ok(footer.includes(`discord.gg/${invite}`), 'footer should quote the invite')
  })

  test('README documents the same invite the page redirects to', () => {
    const codes = new Set(inviteCodesIn(readme))
    assert.deepEqual([...codes], [canonicalInvite()])
  })

  test('the redirect is delayed briefly, not indefinitely', () => {
    const content = doc.querySelector('meta[http-equiv="refresh"]').getAttribute('content')
    const delay = Number.parseFloat(content.split(';')[0])
    assert.ok(Number.isFinite(delay), `refresh delay is not a number: ${content}`)
    assert.ok(delay <= 3, `redirect delay of ${delay}s keeps visitors waiting`)
  })
})

describe('deployment contract', () => {
  test('CNAME is the single domain GitHub Pages serves', () => {
    assert.equal(readRepoFile('CNAME').trim(), 'discord.druxtjs.org')
  })

  test('the page is self-contained - Pages publishes no other asset', () => {
    assert.deepEqual(attrValues('link[rel="stylesheet"]', 'href'), [])
    assert.deepEqual(attrValues('script', 'src'), [])
    assert.deepEqual(attrValues('img', 'src'), [])
  })

  test('every external host is on the allowlist', () => {
    const hosts = [...attrValues('[href]', 'href'), ...attrValues('[src]', 'src')]
      .filter((value) => /^https?:\/\//.test(value))
      .map((value) => new URL(value).host)
    const unexpected = [...new Set(hosts)].filter((host) => !ALLOWED_HOSTS.includes(host))
    assert.deepEqual(unexpected, [], `unexpected external host(s): ${unexpected.join(', ')}`)
  })
})

describe('markup', () => {
  test('carries no script and no inline event handlers', () => {
    assert.equal(doc.querySelectorAll('script').length, 0)
    const handlers = doc.querySelectorAll('*').flatMap((el) =>
      Object.keys(el.attributes).filter((name) => name.toLowerCase().startsWith('on')),
    )
    assert.deepEqual(handlers, [])
  })

  test('declares the head tags the page depends on', () => {
    assert.equal(doc.querySelector('html').getAttribute('lang'), 'en')
    assert.ok(doc.querySelector('meta[charset]'), 'missing charset')
    assert.ok(doc.querySelector('meta[name="viewport"]'), 'missing viewport')
    assert.match(doc.querySelector('meta[name="robots"]').getAttribute('content'), /noindex/)
    assert.ok(doc.querySelector('title').text.trim().length > 0, 'empty title')
  })

  test('the logo has an accessible name and the progress bar is hidden', () => {
    const logo = doc.querySelector('svg.logo')
    assert.equal(logo.getAttribute('role'), 'img')
    assert.ok(logo.getAttribute('aria-label')?.trim(), 'logo needs an aria-label')
    assert.equal(doc.querySelector('.bar').getAttribute('aria-hidden'), 'true')
  })

  test('any new-tab link is protected against reverse tabnabbing', () => {
    const unprotected = doc
      .querySelectorAll('a[target="_blank"]')
      .filter((el) => !(el.getAttribute('rel') || '').includes('noopener'))
      .map((el) => el.getAttribute('href'))
    assert.deepEqual(unprotected, [])
  })
})
