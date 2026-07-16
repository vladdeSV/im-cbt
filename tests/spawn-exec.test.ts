import { spawnSync } from 'bun'
import { expect, test } from 'bun:test'
import { execSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import IM from '../source/index.ts'

const files = (await readdir('tests/patterns')).filter(x => x.startsWith('seq-') && x.endsWith('.png'))

for (const filename of files) {
  const testseq = filename.slice(4, -4)
  const chunks: string[] = []

  for (let i = 0; i < testseq.length; i += 2) {
    chunks.push(testseq.slice(i, i + 2))
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
          throw `unknown seq ${ab}`
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

    const spawnOutFile = `tests/patterns/test-spawn-${chunks.join('')}.png`
    const execOutFile = `tests/patterns/test-exec-${chunks.join('')}.png`

    const spawnResult = spawnSync(['magick', ...im.parts('allow-unsafe'), spawnOutFile])
    expect(spawnResult.exitCode).toBe(0)

    const execCmd = ['magick', ...im.parts('escape-shell'), execOutFile].join(' ')
    expect(() => execSync(execCmd)).not.toThrow()

    const compareResult = spawnSync(['magick', 'compare', '-metric', 'AE', spawnOutFile, execOutFile, 'null:'])
    const diffPixelCount = parseInt((compareResult.stderr ?? Buffer.from('')).toString().trim(), 10)
    expect(diffPixelCount).toBe(0)

    spawnSync(['rm', '-f', spawnOutFile, execOutFile])
  })
}
