// Shared accessors so the unit suite and the Playwright suite agree on what
// "the invite" is without either of them hardcoding the code - the invite
// changes, and a test that needs editing when it does would just be a second
// place for the drift to hide.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const readRepoFile = (name) => readFileSync(join(repoRoot, name), 'utf8')

const INVITE_PATTERN = /discord\.gg\/([A-Za-z0-9]+)/g

/** Every Discord invite code mentioned in a blob of text, in order. */
export const inviteCodesIn = (text) =>
  [...text.matchAll(INVITE_PATTERN)].map((match) => match[1])

/**
 * The one invite code the whole repo points at.
 *
 * Throws when index.html disagrees with itself, so callers can rely on there
 * being a single answer.
 */
export const canonicalInvite = () => {
  const codes = new Set(inviteCodesIn(readRepoFile('index.html')))
  if (codes.size !== 1) {
    throw new Error(`index.html references ${codes.size} invite codes: ${[...codes].join(', ')}`)
  }
  return [...codes][0]
}

/** Hosts the page is allowed to reference. Anything else is a review question. */
export const ALLOWED_HOSTS = ['discord.gg', 'druxtjs.org']
