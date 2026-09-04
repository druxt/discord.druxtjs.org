// The private-host rule is the one lint whose failure mode is a public leak,
// so it gets tests of its own rather than trusting a clean run to mean it
// works. The hosts below are examples, never anything real.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { findPrivateRefs, lintPrivateRefs } from '../../scripts/lint-private-refs.mjs'

describe('findPrivateRefs', () => {
  test('flags a .local host', () => {
    assert.deepEqual(findPrivateRefs('see http://example.local/a/b'), [
      { line: 1, host: 'example.local' },
    ])
  })

  test('flags private IPv4 ranges', () => {
    const hosts = findPrivateRefs(
      ['http://10.1.2.3/x', 'http://192.168.0.9/y', 'http://172.16.4.5/z'].join('\n'),
    ).map((hit) => hit.host)
    assert.deepEqual(hosts, ['10.1.2.3', '192.168.0.9', '172.16.4.5'])
  })

  test('steps over userinfo to reach the host', () => {
    assert.deepEqual(findPrivateRefs('https://oauth2:TOKEN@example.internal/repo.git'), [
      { line: 1, host: 'example.internal' },
    ])
  })

  test('reads the host from an scp-style git remote', () => {
    assert.deepEqual(findPrivateRefs('git@example.lan:group/project.git'), [
      { line: 1, host: 'example.lan' },
    ])
  })

  test('reports the line the reference sits on', () => {
    assert.deepEqual(findPrivateRefs('ok\nok\nhttp://example.corp/'), [
      { line: 3, host: 'example.corp' },
    ])
  })

  test('allows public hosts and local development domains', () => {
    const text = [
      'https://discord.gg/abc',
      'https://druxtjs.org',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      'https://site.ddev.site',
    ].join('\n')
    assert.deepEqual(findPrivateRefs(text), [])
  })
})

describe('lintPrivateRefs', () => {
  test('the repository itself is clean', () => {
    assert.deepEqual(lintPrivateRefs(), [])
  })
})
