import { expect, test } from 'bun:test'
import { ImageMagickError, run, wand } from '../source/index.ts'

// these tests spawn the real magick binary, like execution-safety.test.ts

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff])

test('resolves with the rendered image as a buffer', async () => {
  const image = await run(wand().xc('red', 8, 8), 'png')

  expect(image.subarray(0, 4).equals(PNG_MAGIC)).toBe(true)
  expect(image.length).toBeGreaterThan(PNG_MAGIC.length)
})

test('format option selects the output encoding', async () => {
  const image = await run(wand().xc('red', 8, 8), 'jpeg')

  expect(image.subarray(0, 3).equals(JPEG_MAGIC)).toBe(true)
})

test('buffer resources are streamed into the spawned process', async () => {
  const red = await run(wand().xc('red', 8, 8), 'png')
  const pixels = await run(wand(red).resize(4, 4), 'txt')

  expect(pixels.toString()).toContain('red')
})

test('buffers in nested builders reach their fd slots', async () => {
  const red = await run(wand().xc('red', 8, 8), 'png')
  const blue = await run(wand().xc('blue', 4, 4), 'png')

  const composed = wand(red)
  composed.parens(wand(blue)).gravity('Center').composite()
  const pixels = (await run(composed, 'txt')).toString()

  expect(pixels).toContain('  red')
  expect(pixels).toContain('  blue')
})

test('nonzero exit rejects with ImageMagickError', async () => {
  const missing = wand('this-file-does-not-exist.png')

  await expect(run(missing, 'png')).rejects.toBeInstanceOf(ImageMagickError)
})

test('ImageMagickError carries argv, exit code, and stderr', async () => {
  try {
    await run(wand('this-file-does-not-exist.png'), 'png')
    expect.unreachable()
  } catch (error) {
    if (!(error instanceof ImageMagickError)) {
      throw error
    }
    expect(error.exitCode).not.toBe(0)
    expect(error.stderr).toContain('this-file-does-not-exist.png')
    expect(error.argv).toContain('png:-')
    expect(error.message.length).toBeGreaterThan(0)
  }
})

test('early magick failure does not crash on unread buffer input', async () => {
  // larger than the pipe capacity, so the write is still pending when magick
  // rejects the bogus option and exits without ever reading fd:3
  const big = Buffer.alloc(1024 * 1024, 7)
  const failing = wand().command('--no-such-option').resource(big)

  await expect(run(failing, 'png')).rejects.toBeInstanceOf(ImageMagickError)
})

test('missing binary rejects with a spawn error', async () => {
  const command = wand().xc('red')

  await expect(run(command, 'png', { binary: 'magick-wand-no-such-binary' })).rejects.toThrow('failed to spawn')
})

test('running the same builder twice works', async () => {
  const command = wand().xc('red', 8, 8)

  const first = await run(command, 'png')
  const second = await run(command, 'png')

  expect(first.equals(second)).toBe(true)
})
