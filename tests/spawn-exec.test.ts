import { spawnSync } from 'bun'
import { expect, test } from 'bun:test'
import { execSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import IM from '../source/index'

const files = (await readdir('tests/patterns')).filter(x => x.startsWith('seq-') && x.endsWith('.png'))

for (const filename of files) {
  const testseq = filename.slice(4, -4)
  const chunks: string[] = []

  for (let i = 0; i < testseq.length; i += 2) {
    chunks.push(testseq[i] + testseq[i + 1])
  }

  const seq = chunks
    .map(ab => {
      switch (ab) {
        case 'bs':
          return '\\x5C'
        case 'sq':
          return "'"
        case 'dq':
          return '"'
        case 'ab':
          return 'ab'
        default:
          throw 'unknown seq ' + ab
      }
    })
    .join('')

  test(`pattern: ${seq}`, () => {
    const im = IM()
      .size(200, 100)
      .xc('white')
      .font('DejaVu-Sans')
      .pointsize(20)
      .fill('black')
      .draw(draw => draw.text(10, 20, `hello ${seq} world`))

    const spawnOutFile = 'tests/patterns/test-spawn-' + chunks.join('') + '.png'
    const execOutFile = 'tests/patterns/test-exec-' + chunks.join('') + '.png'

    // Test spawn execution (no shell) - should not fail due to formatting
    const spawnResult = spawnSync(['magick', ...im.parts('allow-unsafe'), spawnOutFile])
    expect(spawnResult.exitCode).toBe(0)

    // Test exec execution (with shell) - should not fail due to formatting
    const execCmd = ['magick', ...im.parts('escape-shell'), execOutFile].join(' ')
    expect(() => execSync(execCmd)).not.toThrow()

    // Verify both outputs are identical to each other
    const { stdout: spawnHash } = spawnSync(['md5sum', spawnOutFile])
    const execHash = execSync(`md5sum '${execOutFile}'`)

    expect(spawnHash.toString().slice(0, 32)).toBe(execHash.toString().slice(0, 32))

    // Clean up test files
    spawnSync(['rm', '-f', spawnOutFile, execOutFile])
  })
}
