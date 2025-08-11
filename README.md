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

## Coverage

The most common options are supported. If you need something missing, you can do `im.command('-colorize', 50)`

- [x] `-adaptive-blur` - Adaptive blur filter
- [x] `-adaptive-resize` - Adaptive resize using triangulation
- [x] `-adaptive-sharpen` - Adaptive sharpen near edges
- [x] `-adjoin` - Join images into single multi-image file
- [ ] `-affine`
- [x] `-alpha` - Alpha channel operations
- [ ] `-annotate`
- [x] `-antialias` - Enable/disable antialiasing
- [x] `-append` - Append images vertically or horizontally
- [ ] `-authenticate`
- [ ] `-auto-gamma`
- [ ] `-auto-level`
- [ ] `-auto-orient`
- [x] `-background` - Set background color
- [ ] `-bias`
- [ ] `-black-point-compensation`
- [ ] `-black-threshold`
- [x] `-blur` - Apply blur effect
- [ ] `-border`
- [ ] `-bordercolor`
- [ ] `-brightness-contrast`
- [ ] `-channel`
- [ ] `-charcoal`
- [ ] `-chop`
- [x] `-clone` - Clone image
- [x] `-colorize` - Colorize image with fill color
- [x] `-colorspace` - Set color space
- [x] `-compose` - Composition operator
- [x] `-composite` - Composite images
- [ ] `-compress`
- [x] `-contrast` - Adjust contrast
- [ ] `-contrast-stretch`
- [ ] `-convolve`
- [x] `-crop` - Crop image region
- [ ] `-cycle`
- [ ] `-debug`
- [ ] `-define`
- [ ] `-delay`
- [ ] `-density`
- [ ] `-depth`
- [ ] `-despeckle`
- [ ] `-direction`
- [ ] `-display`
- [ ] `-dispose`
- [ ] `-distort`
- [ ] `-dither`
- [ ] `-draw`
- [ ] `-duplicate`
- [ ] `-edge`
- [ ] `-emboss`
- [ ] `-encoding`
- [ ] `-endian`
- [x] `-enhance` - Enhance image
- [ ] `-equalize`
- [ ] `-evaluate`
- [x] `-extent` - Extend image canvas
- [ ] `-extract`
- [ ] `-family`
- [x] `-fill` - Set fill color
- [x] `-filter` - Resize filter
- [ ] `-flatten`
- [x] `-flip` - Vertical flip
- [x] `-flop` - Horizontal flip
- [x] `-font` - Set font family
- [ ] `-format`
- [ ] `-frame`
- [ ] `-function`
- [ ] `-fuzz`
- [ ] `-fx`
- [ ] `-gamma`
- [ ] `-gaussian-blur`
- [x] `-geometry` - Position geometry
- [x] `-gravity` - Set positioning gravity
- [ ] `-grayscale`
- [ ] `-help`
- [ ] `-identify`
- [ ] `-implode`
- [ ] `-insert`
- [ ] `-intent`
- [ ] `-interlace`
- [x] `-interpolate` - Interpolation method
- [ ] `-kerning`
- [x] `-label` - Create text label
- [ ] `-lat`
- [ ] `-layers`
- [ ] `-level`
- [ ] `-limit`
- [ ] `-linear-stretch`
- [ ] `-liquid-rescale`
- [ ] `-loop`
- [ ] `-map`
- [ ] `-mattecolor`
- [ ] `-median`
- [ ] `-modulate`
- [ ] `-monitor`
- [ ] `-monochrome`
- [ ] `-morphology`
- [ ] `-mosaic`
- [ ] `-motion-blur`
- [ ] `-negate`
- [ ] `-noise`
- [ ] `-normalize`
- [x] `-opaque` - Color replacement
- [ ] `-ordered-dither`
- [ ] `-orient`
- [ ] `-page`
- [ ] `-paint`
- [ ] `-ping`
- [x] `-pointsize` - Set text size
- [ ] `-polaroid`
- [ ] `-posterize`
- [ ] `-preview`
- [ ] `-print`
- [ ] `-profile`
- [x] `-quality` - Set compression quality
- [ ] `-quantize`
- [ ] `-quiet`
- [ ] `-radial-blur`
- [ ] `-raise`
- [ ] `-random-threshold`
- [ ] `-red-primary`
- [ ] `-regard-warnings`
- [ ] `-remap`
- [ ] `-render`
- [ ] `-repage`
- [ ] `-resample`
- [x] `-resize` - Resize image
- [ ] `-reverse`
- [ ] `-roll`
- [x] `-rotate` - Rotate image by degrees
- [ ] `-sample`
- [ ] `-sampling-factor`
- [ ] `-scale`
- [ ] `-scene`
- [ ] `-seed`
- [ ] `-segment`
- [ ] `-selective-blur`
- [ ] `-separate`
- [ ] `-sepia-tone`
- [ ] `-set`
- [ ] `-shade`
- [ ] `-shadow`
- [x] `-sharpen` - Apply sharpen effect
- [ ] `-shave`
- [ ] `-shear`
- [ ] `-sigmoidal-contrast`
- [x] `-size` - Set image dimensions
- [ ] `-sketch`
- [ ] `-smush`
- [ ] `-solarize`
- [ ] `-splice`
- [ ] `-spread`
- [ ] `-statistic`
- [ ] `-stretch`
- [x] `-strip` - Remove metadata
- [ ] `-stroke`
- [ ] `-strokewidth`
- [ ] `-style`
- [ ] `-swap`
- [ ] `-swirl`
- [ ] `-texture`
- [ ] `-threshold`
- [ ] `-thumbnail`
- [ ] `-tile`
- [ ] `-tint`
- [ ] `-transform`
- [ ] `-transparent`
- [ ] `-transpose`
- [ ] `-transverse`
- [ ] `-treedepth`
- [x] `-trim` - Remove edges
- [ ] `-type`
- [ ] `-undercolor`
- [ ] `-unique-colors`
- [ ] `-units`
- [ ] `-unsharp`
- [ ] `-verbose`
- [ ] `-version`
- [ ] `-view`
- [ ] `-vignette`
- [ ] `-virtual-pixel`
- [ ] `-wave`
- [ ] `-weight`
- [ ] `-white-point`
- [ ] `-white-threshold`
- [ ] `-write`

### Special case: Whack Edition™
This snippet of code is for you when needing to…
- generate an image async with Node.js
- provide additional images as `Buffer`s
- return output as `Buffer`

Providing `Buffer`s for images is a challenge, and a helper class `Fds` is provided to help create a reference to the data. See example below.

This is a bit of a hack, but I use this code in a project.

<details>
  <summary>Boilerplate snippet</summary>

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
