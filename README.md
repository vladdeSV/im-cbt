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

The most common options are supported. If you need something missing, you can do `im.command('-colorize', 50)`

### Special case: Whack Edition™
This snippet of code is for you when needing to…
- generate an image async with Node.js
- provide additional images as `Buffer`s
- return output as `Buffer`

Providing `Buffer`s for images is now directly supported by the command builder. Simply pass buffers to the `resource()` method and they will be automatically converted to file descriptor references.

