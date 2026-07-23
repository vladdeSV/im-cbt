# magick-wand 🪄

build ImageMagick v7 commands programmatically. for server-side TypeScript/JavaScript on Node.js. tested against ImageMagick `v7.1.2-27`.

```sh
<package manager> add @vladdesv/magick-wand
```

## examples

```ts
import { wand, run } from '@vladdesv/magick-wand'

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
const im = wand('wizard:')

const photo: Buffer = await readFile('./photo.jpg')
const smallLogo = wand(photo)
  .resize(g => g.size(200, 300).flag('^'))

im.parens(smallLogo)
  .gravity('SouthEast')
  .composite()

const image = await run(im, 'png', { binary: '/usr/local/bin/magick' })
```

my personal convention is to create the wand and call it `im`, but you can choose whatever you want.

every option has a method. if something is missing, you can run special commands with eg. `im.command('-some-option', 42)`.

`run(...)` needs ImageMagick installed. it runs `magick` from your PATH (override with `run(im, 'png', { binary: 'my-magick-binary' })`). rejects with an `ImageMagickError` if something goes wrong.

geometry flags have descriptive aliases: `.flag('fill-area')` is the same as `.flag('^')`. the others are `exact` (`!`), `enlarge-only` (`<`), `shrink-only` (`>`), and `pad` (`#`).


## advanced: spawning yourself

`run(...)` covers the normal case. to run manually you have to do the following:

- `im.args()` returns all arguments for use with `spawn(...)`
- `im.buffers()` returns all `Buffer`s, when you've passed in images in-memory.

the arguments work with any imagemagick tool. example for `mogrify`:

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
const child = spawn('magick', ['compare', ...im.args(), 'diff.png'], {
  stdio: [
    // stdin, stdout, stderr
    'ignore', 'inherit', 'inherit',
    // for every other resource, pass as pipe
    ...buffers.map(() => 'pipe' as const)
    ],
})

for (const [index, buffer] of buffers.entries()) {
  const stream = child.stdio[3 + index] as Writable
  stream.on('error', () => {})
  stream.end(buffer)
}

child.on('close', code => {
  console.log(`compare exited with ${code}`)
})
```

## previous versions

this library was published as `im-cbt` through 0.2.0. `@vladdesv/magick-wand@1.0.0` has the same api as `im-cbt@0.2.0`, so migrating is renaming the dependency. coming from `im-cbt@0.1.x`, `parts()`/`fds()` are now `args()`/`buffers()`.

## license
MIT © [Vladimirs Nordholm](https://github.com/vladdeSV)
