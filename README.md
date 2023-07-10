# ImageMagick Command Builder Tool

## Examples

```ts
import IM from 'im-cbt'
import { spawn } from 'child_process' // prevent malicious input; use spawn (NOT `execute`/`executeSync`!!!)

const im = IM()
im.resource('logo:')
  .resize(400, 300)

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

### Advanced
There is a helper class to help when you need to provide unexpected amount of images as buffers.

This snippet is a bit of a hack, but I use this in a project.

<details>
  <sumamry>Boilerplate snippet</summary>

```ts
function bufferFromCommandBuilderFds(im: ImageMagickCommandBuilder, fds: Fds, filetype = 'PNG'): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const process = spawn('convert', [...im.parts(), filetype ? `${filetype}:-` : '-'], { stdio: ['pipe', 'pipe', 'pipe', ...(new Array(fds.fds().length).fill('pipe'))] })
    console.log('spawned a process', process.pid)

    const buffers: Buffer[] = []
    process.stdout.on('data', (data: Buffer) => {
      buffers.push(data)
    })
    process.stdout.on('end', () => {
      const buffer = Buffer.concat(buffers)
      console.log('ended a process', process.pid)
      resolve(buffer)
    })
    process.stderr.on('data', (data: Buffer) => {
      reject(data.toString())
    })

    for (const [index, fd] of fds.fds().entries()) {
      const a = process.stdio[index + 3]
      if (!(a instanceof Writable)) {
        console.error('not a writable stream', a)
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
  const ref: string = fds.fd(userUploadedImage)
  
  im.resource(ref)
    .composite()
}

const buffer = await bufferFromCommandBuilderFds(im, fds)

```

</details>

## Install
```sh
<package manager> add im-cbt
```
