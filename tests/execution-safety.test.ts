import { afterAll, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'bun'
import { wand } from '../source/index.ts'

// these tests spawn the real magick binary and render text, so they need a
// system font (DejaVu-Sans); failures here on font-less hosts are unrelated
// to library correctness

const dir = mkdtempSync(join(tmpdir(), 'im-cbt-draw-'))
afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

const FONT = 'DejaVu-Sans'
const POINTSIZE = 24

/**
 * renders `text` via `label:@file`: the file bytes reach the renderer with no
 * escape processing of any kind, so this is the ground truth for what the
 * drawn text must look like
 */
const renderReference = (name: string, text: string): string => {
  const textFile = join(dir, `${name}.txt`)
  const out = join(dir, `ref-${name}.png`)
  writeFileSync(textFile, text)

  const result = spawnSync([
    'magick',
    '-background',
    'white',
    '-fill',
    'black',
    '-font',
    FONT,
    '-pointsize',
    String(POINTSIZE),
    `label:@${textFile}`,
    '-trim',
    '+repage',
    out,
  ])
  expect(result.exitCode).toBe(0)

  return out
}

/** renders `text` through the builder's draw().text() and trims to the glyphs */
const renderDrawn = (name: string, text: string): string => {
  const out = join(dir, `drawn-${name}.png`)
  const im = wand()
    .size(600, 80)
    .xc('white')
    .font(FONT)
    .pointsize(POINTSIZE)
    .fill('black')
    .draw(d => d.text(10, 50, text))
    .command('-trim', '+repage')

  const result = spawnSync(['magick', ...im.parts(), out])
  expect(result.exitCode).toBe(0)

  return out
}

const pixelDiff = (a: string, b: string): number => {
  const result = spawnSync(['magick', 'compare', '-metric', 'AE', a, b, 'null:'])
  return Number.parseFloat(result.stderr.toString().trim().split(' ')[0] ?? 'NaN')
}

// every entry must render, through draw escaping, to exactly the glyphs the
// raw string contains
const roundTrips: Record<string, string> = {
  plain: 'hello world',
  'single quote': "it's here",
  'double quote': 'say "hi"',
  'both quotes': 'a\'"b',
  backslash: 'a\\b',
  'windows path': 'C:\\dir\\file',
  'backslash then quote': 'a\\"b',
  'quote then backslash': 'a"\\b',
  'trailing backslash': 'ab\\',
  'double backslash': 'a\\\\b',
  symbols: '!@#$&*()=[]{},.<>?',
}

for (const [name, text] of Object.entries(roundTrips)) {
  test(`drawn text matches raw glyphs: ${name}`, () => {
    const slug = name.replace(/[^a-z]+/g, '-')
    const reference = renderReference(slug, text)
    const drawn = renderDrawn(slug, text)

    expect(pixelDiff(reference, drawn)).toBe(0)
  })
}

// hostile and degenerate inputs must never make the spawned command fail;
// with an argv array there is no shell, so metacharacters are plain text
test('hostile and degenerate inputs render without failing', () => {
  const inputs = [
    '"; touch injected-file; echo "',
    "'; touch injected-file; echo '",
    '`touch injected-file`',
    '$(touch injected-file)',
    '&& touch injected-file ||',
    '| touch injected-file',
    ' ',
    '  multiple   spaces  ',
    'newline\ntext',
    'tab\ttext',
    '🚀🎉✨',
    'very long text '.repeat(100),
    '\\\\\\\\',
    '""""""""',
    "''''''''",
  ]

  for (const text of inputs) {
    const im = wand()
      .size(400, 100)
      .xc('white')
      .font(FONT)
      .pointsize(POINTSIZE)
      .fill('black')
      .draw(d => d.text(10, 50, text))
      .command('info:')

    const result = spawnSync(['magick', ...im.parts()])
    expect(result.exitCode).toBe(0)
  }

  // and nothing escaped the argv into the filesystem
  expect(spawnSync(['ls', 'injected-file']).exitCode).not.toBe(0)
})
