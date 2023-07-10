# ImageMagick Command Builder Tool

Build ImageMagick commands progmatically. Execute yourself.

## Install
```sh
<package manager> add im-cbt
```

## Examples

```ts
import IM from 'im-cbt'
import { spawn } from 'child_process' // prevent malicious input; use spawn (NOT `execute`/`executeSync`!!!)

const im = IM()
im.resource('logo:')
  .resize(100, 200)
  .gravity('Center')
  .resource('rose:')
  .geometry(-2, -10)
  .composite()
  .fill('green')
  .command('-colorize', 30) // run special commands

// run imagemagick yourself ('magick' / 'convert' / etc.)
spawn('magick', [...im.parts(), 'output.png'])
```

```ts
const im = IM('rose:')

const smallLogo = IM('logo:')
  .resizeExt(g => g.size(200, 300).flag('^'))

im.parens(smallLogo)
  .gravity('SouthEast')
  .composite()
```

### Special case: Whack Edition™
This snippet of code is for you when needing to…
- generate an image async with Node.js
- provide additional images as `Buffer`s
- return output as `Buffer`

Providing `Buffer`s for images is a challenge, and a helper class `Fds` is provided to help create a reference to the data. See example below.

This is a bit of a hack, but I use this code in a project.

<details>
  <sumamry>Boilerplate snippet</summary>

```ts
function bufferFromCommandBuilderFds(im: ImageMagickCommandBuilder, fds: Fds, filetype = 'PNG'): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const process = spawn('convert', [...im.parts(), filetype ? `${filetype}:-` : '-'], { stdio: ['pipe', 'pipe', 'pipe', ...(new Array(fds.fds().length).fill('pipe'))] })

    const buffers: Buffer[] = []
    process.stderr.on('data', (data: Buffer) => { reject(data.toString()) })
    process.stdout.on('data', (data: Buffer) => { buffers.push(data) })
    process.stdout.on('end', () => {
      const buffer = Buffer.concat(buffers)
      resolve(buffer)
    })

    for (const [index, fd] of fds.fds().entries()) {
      const a = process.stdio[index + 3]
      if (!(a instanceof Writable)) {
        continue
      }

      a.end(fd)
    }
    process.stdin.end()
  })
}
```

```ts
import IM, { Fds } from 'im-cbt'

const im = IM('logo:')
const fds = Fds()

const userUploadedImage: Buffer | undefined = ... // some user uplaoded image

if (userUploadedImage) {
  const ref: string = fds.fd(userUploadedImage) // create reference to buffer
  
  im.resource(ref).composite()
}

const buffer = await bufferFromCommandBuilderFds(im, fds)
```

</details>
