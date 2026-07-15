import { spawnSync } from 'bun'
import { expect, test } from 'bun:test'
import { execSync } from 'node:child_process'
import { readdirSync, rmSync } from 'node:fs'
import IM from '../source/index'

// clean up any existing injection test files
try {
  rmSync('tests/injections', { recursive: true, force: true })
} catch {}

import { mkdirSync } from 'node:fs'

// create injections directory for testing
mkdirSync('tests/injections', { recursive: true })

// test that spawn and exec produce identical results
test('spawn vs exec consistency', () => {
  const testCases = [
    'hello world',
    "text with 'single quotes'",
    'text with "double quotes"',
    'text with spaces and symbols: !@#$&*()',
    'path\\with\\backslashes',
    'mixed \'quotes\\" and \\ backslashes',
    'newline\ntext',
    'tab\ttext',
    // todo: drawing text with `%^` gives warning
  ]

  testCases.forEach((text, index) => {
    const im = IM()
      .size(200, 100)
      .xc('white')
      .font('DejaVu-Sans')
      .pointsize(12)
      .fill('black')
      .draw(draw => draw.text(10, 20, text))

    const spawnOut = `tests/injections/test-spawn-${index}.png`
    const execOut = `tests/injections/test-exec-${index}.png`

    const spawnCmd = ['magick', ...im.parts('allow-unsafe'), spawnOut]
    const spawnResult = spawnSync(spawnCmd)
    expect(spawnResult.exitCode).toBe(0)

    const execCmd = ['magick', ...im.parts('escape-shell'), execOut].join(' ')
    expect(() => execSync(execCmd)).not.toThrow()

    // verify files are identical (with md5 lol)
    const spawnHash = spawnSync(['md5sum', spawnOut])
    const execHash = execSync(`md5sum ${execOut}`)

    const md5spawn = spawnHash.stdout.toString().slice(0, 32)
    const md5exec = execHash.toString().slice(0, 32)
    expect(md5spawn).toBe(md5exec)

    // clean up
    rmSync(spawnOut, { force: true })
    rmSync(execOut, { force: true })
  })
})

// test command injection prevention
test('command injection prevention', () => {
  const injectionAttempts = [
    '"; touch tests/injections/inject-1; echo "',
    "'; touch tests/injections/inject-2; echo '",
    '`touch tests/injections/inject-3`',
    '$(touch tests/injections/inject-4)',
    '; touch tests/injections/inject-5',
    '&& touch tests/injections/inject-6',
    '| touch tests/injections/inject-7',
    '|| touch tests/injections/inject-8',
    '\n touch tests/injections/inject-9',
    '\r touch tests/injections/inject-10',
    '\\"; touch tests/injections/inject-11; echo "',
    "\\'; touch tests/injections/inject-12; echo '",
  ]

  injectionAttempts.forEach(maliciousInput => {
    const im = IM()
      .size(100, 100)
      .xc('white')
      .font('DejaVu-Sans')
      .draw(draw => draw.text(10, 10, maliciousInput))
      .command('info:')

    const cmd = ['magick', ...im.parts('escape-shell')].join(' ')

    // must not throw (not malformed)
    expect(() => execSync(cmd)).not.toThrow()
  })

  // ensure no injection files were created
  const injectionFiles = readdirSync('tests/injections').filter(f => f.startsWith('inject-'))
  expect(injectionFiles).toHaveLength(0)
})

// test weird strings
test('formatting never causes failures', () => {
  const problematicInputs = [
    '',
    ' ',
    '  multiple   spaces  ',
    '\t\n\r',
    '🚀🎉✨',
    'very long text '.repeat(100),
    '\\\\\\\\',
    '""""""""',
    "''''''''",
    `\x5C"\x5C\x5C"\x5C'\x5C\x5C'\x5C\x5C\x5C'\x5C\x5C\x5C\x5C'\x5C\x5C\x5C\x5C"\x5C\x5C\x5C\x5C"`,
    '()[]{}',
    '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ]

  problematicInputs.forEach(input => {
    const im = IM()
      .size(200, 100)
      .xc('white')
      .font('DejaVu-Sans')
      .draw(draw => draw.text(10, 20, input))
      .command('info:')

    expect(() => {
      const spawnCmd = ['magick', ...im.parts('allow-unsafe')]
      spawnSync(spawnCmd)
    }).not.toThrow()

    expect(() => {
      const execCmd = ['magick', ...im.parts('escape-shell')].join(' ')
      execSync(execCmd)
    }).not.toThrow()
  })
})

// test draw parameter escaping
test('draw parameter escaping', () => {
  const drawInputs = [
    'simple text',
    'text with "quotes"',
    "text with 'quotes'",
    'text with \\ backslash',
    'text with \\\\ double backslash',
    'text with \\n newline escape',
    'complex: "hello \'world\'" test',
  ]

  drawInputs.forEach(text => {
    const im = IM()
      .size(200, 100)
      .xc('white')
      .font('DejaVu-Sans')
      .draw(draw => draw.text(10, 20, text))
      .command('info:')

    // test that draw content is properly escaped
    const parts = im.parts('escape-shell')
    const drawParam = parts[parts.indexOf('-draw') + 1]

    // should be wrapped in single quotes for shell safety
    expect(drawParam.startsWith("'")).toBe(true)
    expect(drawParam.endsWith("'")).toBe(true)

    // should execute successfully
    const cmd = ['magick', ...parts].join(' ')
    expect(() => execSync(cmd)).not.toThrow()
  })
})

// test file path escaping
test('file path escaping', () => {
  const problematicPaths = [
    'file with spaces.png',
    'file"with"quotes.png',
    'file\\with\\backslashes.png',
    'file-with-many-hyphens.png',
    'file.with.dots.png',
  ]

  problematicPaths.forEach(filename => {
    const im = IM().size(100, 100).xc('red').resource(filename)

    // should handle problematic filenames safely
    expect(() => {
      const parts = im.parts('escape-shell')
      // just verify that we get parts without throwing
      expect(Array.isArray(parts)).toBe(true)
      expect(parts.length).toBeGreaterThan(0)
    }).not.toThrow()
  })

  // test single quotes specifically (they get special escaping)
  const im = IM().size(100, 100).xc('red').resource("file'with'quotes.png")

  const parts = im.parts('escape-shell')
  // single quotes should be escaped as '\''
  expect(parts).toContain("'file'\\''with'\\''quotes.png'")
})

// clean up at the end
test('cleanup', () => {
  try {
    rmSync('tests/injections', { recursive: true, force: true })
  } catch {}
  expect(true).toBe(true)
})
