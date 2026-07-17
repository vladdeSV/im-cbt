# ImageMagick Command Builder Tool

build ImageMagick v7 commands programmatically. tested against `v7.1.2-27`.

```sh
<package manager> add im-cbt
```

## examples

```ts
import { wand, run } from 'im-cbt'

const im = wand('logo:')
im.resize(100, 200)
  .gravity('Center')
  .resource('rose:')
  .geometry(-2, -10)
  .composite()
  .fill('green')
  .colorize(30)

const image: Buffer = await run(im, 'png')
```

```ts
const photo: Buffer = await readFile('photo.jpg')
const im = wand().resource(photo).resize(100, 100)

const thumbnail: Buffer = await run(im, 'jpg')
```

my personal convention is to create the wand and call it `im`, but you can choose whatever you want.

every non-deprecated option has a method. if something is missing, you can run special commands with eg. `im.command('-some-option', 50)`.

`run(...)` needs ImageMagick installed. it runs `magick` from your PATH (override with `run(im, 'png', { binary: 'my-magick-binary' })`). rejects with an `ImageMagickError` if something goes wrong.

geometry flags have descriptive aliases: `.flag('fill-area')` is the same as `.flag('^')`. the others are `exact` (`!`), `enlarge-only` (`<`), `shrink-only` (`>`), and `pad` (`#`).

```ts
const im = wand('wizard:')

const smallLogo = wand('logo:')
  .resize(g => g.size(200, 300).flag('^'))

im.parens(smallLogo)
  .gravity('SouthEast')
  .composite()

const image = await run(im, 'png')
```

## advanced: spawning yourself

`run(...)` covers the normal case. to run manually you have to do the following:

- `im.args()` returns all arguments for use with `spawn(...)`
- `im.buffers()` returns all `Buffer`s, when you've passed in images in-memory.

the arguments work with any imagemagick tool. a wand holding only options doubles as a mogrify option set:

```ts
import { spawn } from 'node:child_process' // do not use `execute`, risk for injection attacks

const im = wand().resize(200, 200).strip().quality(80)

// magick expands the glob itself; no shell is involved
spawn('magick', ['mogrify', ...im.args(), 'photos/*.jpg'])
```

if you passed in images in-memory, they are stored as `Buffer` resources. map each buffer into `fd:(3+N)` argument. example comparing two images in-memory:

```ts
import { spawn } from 'node:child_process'
import type { Writable } from 'node:stream'

const before: Buffer = // some binary data ...
const after: Buffer = // ... and an edited version of it

const im = wand().metric('AE').resource(before).resource(after)

const buffers = im.buffers()
// note: `magick compare` exits with 0 for identical images and 1 for differing ones
const child = spawn('magick', ['compare', ...im.args(), 'diff.png'], {
  stdio: ['ignore', 'inherit', 'inherit', ...buffers.map(() => 'pipe' as const)],
})

for (const [index, buffer] of buffers.entries()) {
  const stream = child.stdio[3 + index] as Writable
  stream.on('error', () => {}) // magick may exit before reading every input
  stream.end(buffer)
}

child.on('close', code => {
  console.log(`compare exited with ${code}`)
})
```
