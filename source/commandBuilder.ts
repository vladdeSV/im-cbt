import { Geometry } from './geometry'

export { DrawBuilder, ImageMagickCommandBuilder }

class ImageMagickCommandBuilder {
  constructor(resource?: string | Buffer) {
    if (resource) {
      this.resource(resource)
    }
  }

  parts(): string[] {
    const a: string[] = []
    this.#commands.forEach((part) =>
      part instanceof ImageMagickCommandBuilder
        ? a.push(...part.parts())
        : a.push(String(part))
    )

    return a
  }

  fds(): Buffer[] {
    return [...this.#buffers]
  }

  command(...commands: (string | number)[]): this {
    this.#commands.push(...commands.map(String))

    return this
  }

  resource(input: string | Buffer): this {
    if (Buffer.isBuffer(input)) {
      const bufferStartIndex = 3
      const currentBufferLength = this.#buffers.length

      this.#buffers.push(input)
      const fdRef = `fd:${bufferStartIndex + currentBufferLength}`
      this.#commands.push(fdRef)
    } else {
      this.#commands.push(input)
    }

    return this
  }

  xc(): this
  xc(color: string): this
  xc(size: number): this
  xc(width: number, height: number): this
  xc(color: string, size: number): this
  xc(color: string, width: number, height: number): this
  xc(
    colorOrWidth?: string | number | undefined,
    widthOrHeight?: number,
    height?: number
  ): this {
    return this.#canvas('xc', colorOrWidth, widthOrHeight, height)
  }

  canvas(): this
  canvas(color: string): this
  canvas(size: number): this
  canvas(width: number, height: number): this
  canvas(color: string, size: number): this
  canvas(color: string, width: number, height: number): this
  canvas(
    colorOrWidth?: string | number | undefined,
    widthOrHeight?: number,
    height?: number
  ): this {
    return this.#canvas('canvas', colorOrWidth, widthOrHeight, height)
  }

  #canvas(
    methodName: string,
    colorOrWidth?: string | number | undefined,
    widthOrHeight?: number,
    height?: number
  ): this {
    let output = `${methodName}:`
    let color: string | undefined
    let width: number | undefined
    let finalHeight: number | undefined

    if (typeof colorOrWidth === 'string') {
      // color and dimensions
      color = colorOrWidth
      width = widthOrHeight
      finalHeight = height
    } else if (typeof colorOrWidth === 'number') {
      // no color, only dimensions
      color = undefined
      width = colorOrWidth
      finalHeight = widthOrHeight
    } else {
      // empty
      color = colorOrWidth
      width = widthOrHeight
      finalHeight = height
    }

    if (color) {
      output += color
    }

    const sizeParts: number[] = []
    if (width) {
      sizeParts.push(width)
    }
    if (finalHeight) {
      sizeParts.push(finalHeight)
    }

    if (sizeParts.length > 0) {
      output += '['
      output += sizeParts.join('x')
      if (sizeParts.length == 2) {
        output += '!'
      }
      output += ']'
    }

    this.#commands.push(output)

    return this
  }

  parens(im: this): this {
    this.#commands.push('(')
    this.#commands.push(im)
    this.#commands.push(')')

    return this
  }

  composite(): this {
    this.#commands.push('-composite')

    return this
  }

  gravity(gravity?: GravityType): this {
    if (gravity) {
      this.#commands.push('-gravity')
      this.#commands.push(gravity)
    } else {
      this.#commands.push('+gravity')
    }

    return this
  }

  geometry(x: number, y: number): this {
    const geo = new Geometry().offset(x, y)

    this.#commands.push('-geometry')
    this.#commands.push(geo.toString())

    return this
  }

  geometryExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-geometry')
    this.#commands.push(geometry.toString())

    return this
  }

  size(w?: number, h?: number): this {
    if (w === undefined && h === undefined) {
      this.#commands.push('+size')
    } else {
      this.#commands.push('-size')
      this.#commands.push(new Geometry().size(w, h).toString())
    }

    return this
  }

  clone(...indexes: number[]): ImageMagickCommandBuilder {
    if (indexes.length > 0) {
      this.#commands.push('-clone')
      this.#commands.push(indexes.join(','))
    } else {
      this.#commands.push('+clone')
    }

    return this
  }

  extent(w: number, h: number): this {
    this.#commands.push('-extent')
    this.#commands.push(new Geometry().size(w, h).toString())

    return this
  }

  extentExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-extent')
    this.#commands.push(geometry.toString())

    return this
  }

  resize(w?: number, h?: number): this {
    if (w === undefined && h === undefined) {
      // todo: noop?
    } else {
      this.#commands.push('-resize')
      this.#commands.push(new Geometry().size(w, h).toString())
    }

    return this
  }

  resizeExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-resize')
    this.#commands.push(geometry.toString())

    return this
  }

  crop(w: number, h: number, x?: number, y?: number): this {
    this.#commands.push('-crop')

    const geometry = new Geometry().size(w, h)
    if (x !== undefined && y !== undefined) {
      geometry.offset(x, y)
    }

    this.#commands.push(geometry.toString())

    return this
  }

  cropExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-crop')
    this.#commands.push(geometry.toString())

    return this
  }

  rotate(degrees: number, flag?: '<' | '>'): this {
    this.#commands.push('-rotate')

    const rotation = flag ? `${degrees}${flag}` : `${degrees}`
    this.#commands.push(rotation)

    return this
  }

  flip(): this {
    this.#commands.push('-flip')

    return this
  }

  flop(): this {
    this.#commands.push('-flop')

    return this
  }

  quality(value?: number): this {
    if (value === undefined) {
      this.#commands.push('+quality')
    } else {
      this.#commands.push('-quality')
      this.#commands.push(value)
    }

    return this
  }

  strip(): this {
    this.#commands.push('-strip')

    return this
  }

  blur(radius: number = 0, sigma?: number): this {
    this.#commands.push('-blur')

    if (sigma !== undefined) {
      this.#commands.push(new Geometry().size(radius, sigma).toString())
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  sharpen(radius: number = 0, sigma?: number): this {
    this.#commands.push('-sharpen')

    if (sigma !== undefined) {
      this.#commands.push(new Geometry().size(radius, sigma).toString())
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  background(background: string): this {
    this.#commands.push('-background')
    this.#commands.push(background)

    return this
  }

  trim(): this {
    this.#commands.push('-trim')

    return this
  }

  // FIXME: i think this is suspectable to injections, if the programmer uses `exectute`, with a label that comes from the user input
  label(input: string | number): this {
    this.#commands.push(`label:${input}`)

    return this
  }

  font(font: string): this {
    this.#commands.push('-font')
    this.#commands.push(font)

    return this
  }

  pointsize(size?: number): this {
    if (size) {
      this.#commands.push('-pointsize')
      this.#commands.push(size)
    } else {
      this.#commands.push('+pointsize')
    }

    return this
  }

  alpha(type: AlphaType): this {
    this.#commands.push('-alpha')
    this.#commands.push(type)

    return this
  }

  interpolate(type: InterpolateType): this {
    this.#commands.push('-interpolate')
    this.#commands.push(type)

    return this
  }

  filter(type: FilterType): this {
    this.#commands.push('-filter')
    this.#commands.push(type)

    return this
  }

  compose(type: ComposeType): this {
    this.#commands.push('-compose')
    this.#commands.push(type)

    return this
  }

  fill(color: string): this {
    this.#commands.push('-fill')
    this.#commands.push(color)

    return this
  }

  opaque(color: string, invert?: boolean): this {
    this.#commands.push(invert ? '+opaque' : '-opaque')
    this.#commands.push(color)

    return this
  }

  adaptiveBlur(radius: number = 0, sigma?: number): this {
    this.#commands.push('-adaptive-blur')

    if (sigma !== undefined) {
      this.#commands.push(`${radius}x${sigma}`)
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  adaptiveResize(w?: number, h?: number): this {
    if (w || h) {
      this.#commands.push('-adaptive-resize')
      this.#commands.push(new Geometry().size(w, h).toString())
    }

    return this
  }

  adaptiveResizeExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-adaptive-resize')
    this.#commands.push(geometry.toString())

    return this
  }

  adaptiveSharpen(radius: number = 0, sigma?: number): this {
    this.#commands.push('-adaptive-sharpen')

    if (sigma !== undefined) {
      this.#commands.push(`${radius}x${sigma}`)
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  adjoin(enable?: boolean): this {
    if (enable === false) {
      this.#commands.push('+adjoin')
    } else {
      this.#commands.push('-adjoin')
    }

    return this
  }

  antialias(enable?: boolean): this {
    if (enable === false) {
      this.#commands.push('+antialias')
    } else {
      this.#commands.push('-antialias')
    }

    return this
  }

  append(horizontal?: boolean): this {
    if (horizontal === true) {
      this.#commands.push('+append')
    } else {
      this.#commands.push('-append')
    }

    return this
  }

  colorize(red: number, green?: number, blue?: number): this {
    this.#commands.push('-colorize')

    if (green !== undefined && blue !== undefined) {
      this.#commands.push(`${red},${green},${blue}`)
    } else if (green !== undefined) {
      this.#commands.push(`${red},${green}`)
    } else {
      this.#commands.push(red)
    }

    return this
  }

  colorspace(type: ColorspaceType): this {
    this.#commands.push('-colorspace')
    this.#commands.push(type)

    return this
  }

  contrast(enable?: boolean): this {
    if (enable === false) {
      this.#commands.push('+contrast')
    } else {
      this.#commands.push('-contrast')
    }

    return this
  }

  enhance(): this {
    this.#commands.push('-enhance')

    return this
  }

  affine(
    sx: number,
    rx: number,
    ry: number,
    sy: number,
    tx?: number,
    ty?: number
  ): this {
    this.#commands.push('-affine')

    if (tx !== undefined && ty !== undefined) {
      this.#commands.push(`${sx},${rx},${ry},${sy},${tx},${ty}`)
    } else {
      this.#commands.push(`${sx},${rx},${ry},${sy}`)
    }

    return this
  }

  annotate(degrees: number, text: string): this {
    this.#commands.push('-annotate')
    this.#commands.push(degrees)
    this.#commands.push(text)

    return this
  }

  authenticate(password: string): this {
    this.#commands.push('-authenticate')
    this.#commands.push(password)

    return this
  }

  autoGamma(): this {
    this.#commands.push('-auto-gamma')

    return this
  }

  autoLevel(): this {
    this.#commands.push('-auto-level')

    return this
  }

  bias(value: string): this {
    this.#commands.push('-bias')
    this.#commands.push(value)

    return this
  }

  blackThreshold(value: string): this {
    this.#commands.push('-black-threshold')
    this.#commands.push(value)

    return this
  }

  border(width: number, height?: number): this {
    this.#commands.push('-border')

    if (height !== undefined) {
      this.#commands.push(new Geometry().size(width, height).toString())
    } else {
      this.#commands.push(width)
    }

    return this
  }

  bordercolor(color: string): this {
    this.#commands.push('-bordercolor')
    this.#commands.push(color)

    return this
  }

  despeckle(): this {
    this.#commands.push('-despeckle')

    return this
  }

  gaussianBlur(radius: number = 0, sigma?: number): this {
    this.#commands.push('-gaussian-blur')

    if (sigma !== undefined) {
      this.#commands.push(`${radius}x${sigma}`)
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  density(x: number, y?: number): this {
    this.#commands.push('-density')

    if (y !== undefined) {
      this.#commands.push(new Geometry().size(x, y).toString())
    } else {
      this.#commands.push(x)
    }

    return this
  }

  depth(value: number): this {
    this.#commands.push('-depth')
    this.#commands.push(value)

    return this
  }

  normalize(): this {
    this.#commands.push('-normalize')

    return this
  }

  negate(): this {
    this.#commands.push('-negate')

    return this
  }

  monochrome(): this {
    this.#commands.push('-monochrome')

    return this
  }

  equalize(): this {
    this.#commands.push('-equalize')

    return this
  }

  flatten(): this {
    this.#commands.push('-flatten')

    return this
  }

  ping(): this {
    this.#commands.push('-ping')

    return this
  }

  reverse(): this {
    this.#commands.push('-reverse')

    return this
  }

  brightnessContrast(brightness: number, contrast: number): this {
    this.#commands.push('-brightness-contrast')
    this.#commands.push(`${brightness}x${contrast}`)

    return this
  }

  channel(...types: ChannelType[]): this {
    if (types.length > 0) {
      this.#commands.push('-channel')
      this.#commands.push(types.join(','))
    } else {
      this.#commands.push('+channel')
    }

    return this
  }

  charcoal(radius: number = 0, sigma?: number): this {
    this.#commands.push('-charcoal')

    if (sigma !== undefined) {
      this.#commands.push(`${radius}x${sigma}`)
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  chop(width: number, height: number, x?: number, y?: number): this {
    this.#commands.push('-chop')

    const geometry = new Geometry().size(width, height)
    if (x !== undefined && y !== undefined) {
      geometry.offset(x, y)
    }

    this.#commands.push(geometry.toString())

    return this
  }

  compress(type: CompressType): this {
    this.#commands.push('-compress')
    this.#commands.push(type)

    return this
  }

  contrastStretch(blackPoint: number, whitePoint: number): this {
    this.#commands.push('-contrast-stretch')
    this.#commands.push(`${blackPoint}%x${whitePoint}%`)

    return this
  }

  cycle(amount: number): this {
    this.#commands.push('-cycle')
    this.#commands.push(amount)

    return this
  }

  edge(radius: number): this {
    this.#commands.push('-edge')
    this.#commands.push(radius)

    return this
  }

  emboss(radius: number = 0, sigma?: number): this {
    this.#commands.push('-emboss')

    if (sigma !== undefined) {
      this.#commands.push(`${radius}x${sigma}`)
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  gamma(value: number): this {
    this.#commands.push('-gamma')
    this.#commands.push(value)

    return this
  }

  grayscale(method: GrayscaleType): this {
    this.#commands.push('-grayscale')
    this.#commands.push(method)

    return this
  }

  help(): this {
    // if run, it must be the only option. fails otherwise
    this.#commands.push('-help')

    return this
  }

  implode(amount: number): this {
    this.#commands.push('-implode')
    this.#commands.push(amount)

    return this
  }

  median(radius: number = 0, sigma?: number): this {
    this.#commands.push('-median')

    if (sigma !== undefined) {
      this.#commands.push(`${radius}x${sigma}`)
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  autoOrient(): this {
    this.#commands.push('-auto-orient')

    return this
  }

  blackPointCompensation(): this {
    this.#commands.push('-black-point-compensation')

    return this
  }

  convolve(kernel: string): this {
    this.#commands.push('-convolve')
    this.#commands.push(kernel)

    return this
  }

  debug(...events: DebugType[]): this {
    if (events.length > 0) {
      this.#commands.push('-debug')
      this.#commands.push(events.join(','))
    } else {
      this.#commands.push('+debug')
    }

    return this
  }

  define(key: string, remove?: boolean): this {
    if (remove === true) {
      this.#commands.push('+define')
      this.#commands.push(key)
    } else {
      this.#commands.push('-define')
      this.#commands.push(key)
    }

    return this
  }

  delay(value: number | string, modifier?: '>' | '<'): this {
    this.#commands.push('-delay')

    if (modifier) {
      this.#commands.push(`${value}${modifier}`)
    } else {
      this.#commands.push(value)
    }

    return this
  }

  direction(type: DirectionType): this {
    this.#commands.push('-direction')
    this.#commands.push(type)

    return this
  }

  display(server: string): this {
    this.#commands.push('-display')
    this.#commands.push(server)

    return this
  }

  dispose(method: DisposeType): this {
    this.#commands.push('-dispose')
    this.#commands.push(method)

    return this
  }

  distort(type: DistortType, args: string): this {
    this.#commands.push('-distort')
    this.#commands.push(type)
    this.#commands.push(args)

    return this
  }

  dither(method?: DitherType): this {
    if (method) {
      this.#commands.push('-dither')
      this.#commands.push(method)
    } else {
      this.#commands.push('+dither')
    }

    return this
  }

  draw(fn: (draw: DrawBuilder) => DrawBuilder): this {
    this.#commands.push('-draw')

    const drawBuilder = fn(new DrawBuilder())
    this.#commands.push(drawBuilder.toString())

    return this
  }

  duplicate(count: number, ...indexes: number[]): this {
    this.#commands.push('-duplicate')

    if (indexes.length > 0) {
      this.#commands.push(`${count},${indexes.join(',')}`)
    } else {
      this.#commands.push(count)
    }

    return this
  }

  encoding(type: string): this {
    this.#commands.push('-encoding')
    this.#commands.push(type)

    return this
  }

  endian(type: EndianType): this {
    this.#commands.push('-endian')
    this.#commands.push(type)

    return this
  }

  evaluate(operator: EvaluateType, value: number): this {
    this.#commands.push('-evaluate')
    this.#commands.push(operator)
    this.#commands.push(value)

    return this
  }

  extract(geometry: string): this {
    this.#commands.push('-extract')
    this.#commands.push(geometry)

    return this
  }

  family(name: string): this {
    this.#commands.push('-family')
    this.#commands.push(name)

    return this
  }

  format(type: string): this {
    this.#commands.push('-format')
    this.#commands.push(type)

    return this
  }

  frame(
    width: number,
    height: number,
    outerBevel?: number,
    innerBevel?: number
  ): this {
    this.#commands.push('-frame')

    let frameSpec = `${width}x${height}`
    if (outerBevel !== undefined) {
      frameSpec += `+${outerBevel}`
      if (innerBevel !== undefined) {
        frameSpec += `+${innerBevel}`
      }
    }

    this.#commands.push(frameSpec)

    return this
  }

  fuzz(distance: string): this {
    this.#commands.push('-fuzz')
    this.#commands.push(distance)

    return this
  }

  fx(expression: string): this {
    this.#commands.push('-fx')
    this.#commands.push(expression)

    return this
  }

  identify(): this {
    this.#commands.push('-identify')

    return this
  }

  insert(index: number): this {
    this.#commands.push('-insert')
    this.#commands.push(index)

    return this
  }

  intent(type: IntentType): this {
    this.#commands.push('-intent')
    this.#commands.push(type)

    return this
  }

  interlace(type: InterlaceType): this {
    this.#commands.push('-interlace')
    this.#commands.push(type)

    return this
  }

  kerning(value: number): this {
    this.#commands.push('-kerning')
    this.#commands.push(value)

    return this
  }

  lat(width: number, height: number, offset: number, percent?: number): this {
    this.#commands.push('-lat')

    let latSpec = `${width}x${height}+${offset}`
    if (percent !== undefined) {
      latSpec += `%+${percent}%`
    }

    this.#commands.push(latSpec)

    return this
  }

  layers(method: LayersType): this {
    this.#commands.push('-layers')
    this.#commands.push(method)

    return this
  }

  level(blackPoint: number, whitePoint: number, gamma?: number): this {
    this.#commands.push('-level')

    let levelSpec = `${blackPoint},${whitePoint}`
    if (gamma !== undefined) {
      levelSpec += `,${gamma}`
    }

    this.#commands.push(levelSpec)

    return this
  }

  limit(type: LimitType, value: string): this {
    this.#commands.push('-limit')
    this.#commands.push(type)
    this.#commands.push(value)

    return this
  }

  linearStretch(blackPoint: number, whitePoint: number): this {
    this.#commands.push('-linear-stretch')
    this.#commands.push(`${blackPoint}%x${whitePoint}%`)

    return this
  }

  liquidRescale(
    width: number,
    height?: number,
    deltaX?: number,
    rigidity?: number
  ): this {
    this.#commands.push('-liquid-rescale')

    let rescaleSpec = `${width}`
    if (height !== undefined) {
      rescaleSpec += `x${height}`
      if (deltaX !== undefined) {
        rescaleSpec += `+${deltaX}`
        if (rigidity !== undefined) {
          rescaleSpec += `+${rigidity}`
        }
      }
    }

    this.#commands.push(rescaleSpec)

    return this
  }

  loop(iterations: number): this {
    this.#commands.push('-loop')
    this.#commands.push(iterations)

    return this
  }

  mattecolor(color: string): this {
    this.#commands.push('-mattecolor')
    this.#commands.push(color)

    return this
  }

  modulate(brightness?: number, saturation?: number, hue?: number): this {
    this.#commands.push('-modulate')

    let modulateSpec = '100'
    if (brightness !== undefined) {
      modulateSpec = `${brightness}`
      if (saturation !== undefined) {
        modulateSpec += `,${saturation}`
        if (hue !== undefined) {
          modulateSpec += `,${hue}`
        }
      }
    }

    this.#commands.push(modulateSpec)

    return this
  }

  monitor(enable?: boolean): this {
    if (enable === false) {
      this.#commands.push('+monitor')
    } else {
      this.#commands.push('-monitor')
    }

    return this
  }

  morphology(
    method: MorphologyType,
    kernel: string,
    iterations?: number
  ): this {
    this.#commands.push('-morphology')

    if (iterations !== undefined) {
      this.#commands.push(`${method}:${iterations}`)
    } else {
      this.#commands.push(method)
    }

    this.#commands.push(kernel)

    return this
  }

  mosaic(): this {
    this.#commands.push('-mosaic')

    return this
  }

  motionBlur(radius: number = 0, sigma: number, angle: number): this {
    this.#commands.push('-motion-blur')
    this.#commands.push(`${radius}x${sigma}+${angle}`)

    return this
  }

  noise(type?: NoiseType): this {
    if (type) {
      this.#commands.push('-noise')
      this.#commands.push(type)
    } else {
      this.#commands.push('+noise')
    }

    return this
  }

  orderedDither(threshold: string): this {
    this.#commands.push('-ordered-dither')
    this.#commands.push(threshold)

    return this
  }

  orient(type: OrientType): this {
    this.#commands.push('-orient')
    this.#commands.push(type)

    return this
  }

  page(geometry?: string): this {
    if (geometry) {
      this.#commands.push('-page')
      this.#commands.push(geometry)
    } else {
      this.#commands.push('+page')
    }

    return this
  }

  paint(radius: number): this {
    this.#commands.push('-paint')
    this.#commands.push(radius)

    return this
  }

  polaroid(angle: number): this {
    this.#commands.push('-polaroid')
    this.#commands.push(angle)

    return this
  }

  posterize(levels: number): this {
    this.#commands.push('-posterize')
    this.#commands.push(levels)

    return this
  }

  preview(type: PreviewType): this {
    this.#commands.push('-preview')
    this.#commands.push(type)

    return this
  }

  print(format: string): this {
    this.#commands.push('-print')
    this.#commands.push(format)

    return this
  }

  profile(filename?: string): this {
    if (filename) {
      this.#commands.push('-profile')
      this.#commands.push(filename)
    } else {
      this.#commands.push('+profile')
    }

    return this
  }

  quantize(colorspace: ColorspaceType): this {
    this.#commands.push('-quantize')
    this.#commands.push(colorspace)

    return this
  }

  quiet(enable?: boolean): this {
    if (enable === false) {
      this.#commands.push('+quiet')
    } else {
      this.#commands.push('-quiet')
    }

    return this
  }

  rotationalBlur(angle: number): this {
    this.#commands.push('-rotational-blur')
    this.#commands.push(angle)

    return this
  }

  raise(width: number, height?: number, lowered?: boolean): this {
    if (lowered === true) {
      this.#commands.push('+raise')
    } else {
      this.#commands.push('-raise')
    }

    if (height !== undefined) {
      this.#commands.push(new Geometry().size(width, height).toString())
    } else {
      this.#commands.push(width)
    }

    return this
  }

  randomThreshold(low: number, high: number): this {
    this.#commands.push('-random-threshold')
    this.#commands.push(`${low}%,${high}%`)

    return this
  }

  redPrimary(x: number, y: number): this {
    this.#commands.push('-red-primary')
    this.#commands.push(`${x},${y}`)

    return this
  }

  regardWarnings(enable?: boolean): this {
    if (enable === false) {
      this.#commands.push('+regard-warnings')
    } else {
      this.#commands.push('-regard-warnings')
    }

    return this
  }

  remap(filename?: string): this {
    if (filename) {
      this.#commands.push('-remap')
      this.#commands.push(filename)
    } else {
      this.#commands.push('+remap')
    }

    return this
  }

  render(enable?: boolean): this {
    if (enable === false) {
      this.#commands.push('+render')
    } else {
      this.#commands.push('-render')
    }

    return this
  }

  repage(geometry?: string): this {
    if (geometry) {
      this.#commands.push('-repage')
      this.#commands.push(geometry)
    } else {
      this.#commands.push('+repage')
    }

    return this
  }

  resample(density: string): this {
    this.#commands.push('-resample')
    this.#commands.push(density)

    return this
  }

  roll(x: number, y: number): this {
    this.#commands.push('-roll')
    this.#commands.push(`${x > 0 ? '+' : ''}${x}${y > 0 ? '+' : ''}${y}`)

    return this
  }

  sample(geometry: string): this {
    this.#commands.push('-sample')
    this.#commands.push(geometry)

    return this
  }

  samplingFactor(factors: string): this {
    this.#commands.push('-sampling-factor')
    this.#commands.push(factors)

    return this
  }

  scale(geometry: string): this {
    this.#commands.push('-scale')
    this.#commands.push(geometry)

    return this
  }

  scene(value: number): this {
    this.#commands.push('-scene')
    this.#commands.push(value)

    return this
  }

  seed(value: number): this {
    this.#commands.push('-seed')
    this.#commands.push(value)

    return this
  }

  segment(cluster: number, smoothing: number): this {
    this.#commands.push('-segment')
    this.#commands.push(`${cluster}x${smoothing}`)

    return this
  }

  selectiveBlur(radius: number = 0, sigma: number, threshold: string): this {
    this.#commands.push('-selective-blur')
    this.#commands.push(`${radius}x${sigma}+${threshold}`)

    return this
  }

  separate(): this {
    this.#commands.push('-separate')

    return this
  }

  sepiaTone(threshold: string): this {
    this.#commands.push('-sepia-tone')
    this.#commands.push(threshold)

    return this
  }

  set(attribute: string, value?: string): this {
    if (value !== undefined) {
      this.#commands.push('-set')
      this.#commands.push(attribute)
      this.#commands.push(value)
    } else {
      this.#commands.push('+set')
      this.#commands.push(attribute)
    }

    return this
  }

  shade(azimuth: number, elevation: number, gray?: boolean): this {
    if (gray === true) {
      this.#commands.push('+shade')
    } else {
      this.#commands.push('-shade')
    }
    this.#commands.push(`${azimuth}x${elevation}`)

    return this
  }

  shadow(radius: number = 0, sigma: number, x: number, y: number): this {
    this.#commands.push('-shadow')
    this.#commands.push(`${radius}x${sigma}+${x}+${y}`)

    return this
  }

  shave(width: number, height: number): this {
    this.#commands.push('-shave')
    this.#commands.push(new Geometry().size(width, height).toString())

    return this
  }

  shear(xDegrees: number, yDegrees: number): this {
    this.#commands.push('-shear')
    this.#commands.push(`${xDegrees}x${yDegrees}`)

    return this
  }

  sigmoidalContrast(
    contrast: number,
    midpoint: number,
    sharpen?: boolean
  ): this {
    if (sharpen === true) {
      this.#commands.push('+sigmoidal-contrast')
    } else {
      this.#commands.push('-sigmoidal-contrast')
    }
    this.#commands.push(`${contrast}x${midpoint}%`)

    return this
  }

  sketch(radius: number = 0, sigma: number, angle: number): this {
    this.#commands.push('-sketch')
    this.#commands.push(`${radius}x${sigma}+${angle}`)

    return this
  }

  smush(offset: number, vertical?: boolean): this {
    if (vertical === true) {
      this.#commands.push('-smush')
    } else {
      this.#commands.push('+smush')
    }
    this.#commands.push(offset)

    return this
  }

  solarize(threshold: string): this {
    this.#commands.push('-solarize')
    this.#commands.push(threshold)

    return this
  }

  splice(width: number, height: number, x: number, y: number): this {
    this.#commands.push('-splice')
    this.#commands.push(
      new Geometry().size(width, height).offset(x, y).toString()
    )

    return this
  }

  spread(radius: number): this {
    this.#commands.push('-spread')
    this.#commands.push(radius)

    return this
  }

  statistic(type: StatisticType, width: number, height: number): this {
    this.#commands.push('-statistic')
    this.#commands.push(type)
    this.#commands.push(`${width}x${height}`)

    return this
  }

  stretch(type: StretchType): this {
    this.#commands.push('-stretch')
    this.#commands.push(type)

    return this
  }

  stroke(color: string): this {
    this.#commands.push('-stroke')
    this.#commands.push(color)

    return this
  }

  strokewidth(value: number): this {
    this.#commands.push('-strokewidth')
    this.#commands.push(value)

    return this
  }

  style(type: StyleType): this {
    this.#commands.push('-style')
    this.#commands.push(type)

    return this
  }

  virtualPixel(method: VirtualPixelType): this {
    this.#commands.push('-virtual-pixel')
    this.#commands.push(method)

    return this
  }

  swirl(degrees: number): this {
    this.#commands.push('-swirl')
    this.#commands.push(degrees)

    return this
  }

  texture(filename: string): this {
    this.#commands.push('-texture')
    this.#commands.push(filename)

    return this
  }

  threshold(percentage?: number): this {
    if (percentage === undefined) {
      this.#commands.push('+threshold')
    } else {
      this.#commands.push('-threshold')
      this.#commands.push(percentage + '%')
    }

    return this
  }

  thumbnail(w?: number, h?: number): this {
    if (w || h) {
      this.#commands.push('-thumbnail')
      this.#commands.push(new Geometry().size(w, h).toString())
    }

    return this
  }

  thumbnailExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-thumbnail')
    this.#commands.push(geometry.toString())

    return this
  }

  tile(filename: string): this {
    this.#commands.push('-tile')
    this.#commands.push(filename)

    return this
  }

  tint(percentage: number): this {
    this.#commands.push('-tint')
    this.#commands.push(percentage + '%')

    return this
  }

  transform(): this {
    this.#commands.push('-transform')

    return this
  }

  transparent(color: string): this {
    this.#commands.push('-transparent')
    this.#commands.push(color)

    return this
  }

  transpose(): this {
    this.#commands.push('-transpose')

    return this
  }

  transverse(): this {
    this.#commands.push('-transverse')

    return this
  }

  treedepth(value: number): this {
    this.#commands.push('-treedepth')
    this.#commands.push(value)

    return this
  }

  type(type: string): this {
    this.#commands.push('-type')
    this.#commands.push(type)

    return this
  }

  undercolor(color: string): this {
    this.#commands.push('-undercolor')
    this.#commands.push(color)

    return this
  }

  uniqueColors(): this {
    this.#commands.push('-unique-colors')

    return this
  }

  units(type: string): this {
    this.#commands.push('-units')
    this.#commands.push(type)

    return this
  }

  unsharp(
    radius: number = 0,
    sigma: number,
    amount: number,
    threshold: number
  ): this {
    this.#commands.push('-unsharp')
    this.#commands.push(`${radius}x${sigma}+${amount}+${threshold}`)

    return this
  }

  verbose(enable: boolean = true): this {
    if (enable === true) {
      this.#commands.push('-verbose')
    } else {
      this.#commands.push('+verbose')
    }

    return this
  }

  version(): this {
    this.#commands.push('-version')

    return this
  }

  /*
  this command fails on my magick binary, v7.1.2
  view(string: string): this {
    this.#commands.push('-view')
    this.#commands.push((string))

    return this
  }
  */

  vignette(radius: number = 0, sigma: number, x?: number, y?: number): this {
    this.#commands.push('-vignette')

    let vignetteSpec = `${radius}x${sigma}`
    if (x !== undefined && y !== undefined) {
      vignetteSpec += `+${x}+${y}`
    }

    this.#commands.push(vignetteSpec)

    return this
  }

  wave(amplitude: number, wavelength: number): this {
    this.#commands.push('-wave')
    this.#commands.push(`${amplitude}x${wavelength}`)

    return this
  }

  weight(type: string): this {
    this.#commands.push('-weight')
    this.#commands.push(type)

    return this
  }

  whitePoint(x: number, y: number): this {
    this.#commands.push('-white-point')
    this.#commands.push(`${x},${y}`)

    return this
  }

  whiteThreshold(value: string): this {
    this.#commands.push('-white-threshold')
    this.#commands.push(value)

    return this
  }

  write(filename: string): this {
    this.#commands.push('-write')
    this.#commands.push(filename)

    return this
  }

  swap(index1: number, index2: number): this {
    this.#commands.push('-swap')
    this.#commands.push(`${index1},${index2}`)

    return this
  }

  attenuate(value: number): this {
    this.#commands.push('-attenuate')
    this.#commands.push(value)

    return this
  }

  bluePrimary(x: number, y: number): this {
    this.#commands.push('-blue-primary')
    this.#commands.push(`${x},${y}`)

    return this
  }

  caption(text: string): this {
    this.#commands.push('-caption')
    this.#commands.push(text)

    return this
  }

  clip(): this {
    this.#commands.push('-clip')

    return this
  }

  clipMask(filename: string): this {
    this.#commands.push('-clip-mask')
    this.#commands.push(filename)

    return this
  }

  clipPath(id: string): this {
    this.#commands.push('-clip-path')
    this.#commands.push(id)

    return this
  }

  comment(text: string): this {
    this.#commands.push('-comment')
    this.#commands.push(text)

    return this
  }

  features(distance: number): this {
    this.#commands.push('-features')
    this.#commands.push(distance)

    return this
  }

  greenPrimary(x: number, y: number): this {
    this.#commands.push('-green-primary')
    this.#commands.push(`${x},${y}`)

    return this
  }

  illuminant(type: IlluminantType): this {
    this.#commands.push('-illuminant')
    this.#commands.push(type)

    return this
  }

  intensity(method: IntensityType): this {
    this.#commands.push('-intensity')
    this.#commands.push(method)

    return this
  }

  interlineSpacing(value: number): this {
    this.#commands.push('-interline-spacing')
    this.#commands.push(value)

    return this
  }

  interwordSpacing(value: number): this {
    this.#commands.push('-interword-spacing')
    this.#commands.push(value)

    return this
  }

  matte(): this {
    this.#commands.push('-matte')

    return this
  }

  moments(): this {
    this.#commands.push('-moments')

    return this
  }

  precision(value: number): this {
    this.#commands.push('-precision')
    this.#commands.push(value)

    return this
  }

  readMask(filename: string): this {
    this.#commands.push('-read-mask')
    this.#commands.push(filename)

    return this
  }

  respectParentheses(): this {
    this.#commands.push('-respect-parentheses')

    return this
  }

  support(factor: number): this {
    this.#commands.push('-support')
    this.#commands.push(factor)

    return this
  }

  synchronize(): this {
    this.#commands.push('-synchronize')

    return this
  }

  taint(): this {
    this.#commands.push('-taint')

    return this
  }

  tileOffset(x: number, y: number): this {
    this.#commands.push('-tile-offset')
    this.#commands.push(new Geometry().offset(x, y).toString())

    return this
  }

  transparentColor(color: string): this {
    this.#commands.push('-transparent-color')
    this.#commands.push(color)

    return this
  }

  view(): this {
    this.#commands.push('-view')

    return this
  }

  writeMask(filename: string): this {
    this.#commands.push('-write-mask')
    this.#commands.push(filename)

    return this
  }

  autoThreshold(method: AutoThresholdType): this {
    this.#commands.push('-auto-threshold')
    this.#commands.push(method)

    return this
  }

  bench(iterations: number): this {
    this.#commands.push('-bench')
    this.#commands.push(iterations)

    return this
  }

  bilateralBlur(radius: number, sigma: number): this {
    this.#commands.push('-bilateral-blur')
    this.#commands.push(`${radius}x${sigma}`)

    return this
  }

  blueShift(factor: number): this {
    this.#commands.push('-blue-shift')
    this.#commands.push(factor)

    return this
  }

  canny(low: number, high: number): this {
    this.#commands.push('-canny')
    this.#commands.push(`${low}x${high}`)

    return this
  }

  cannyExt(low: number, high: number, radius: number, sigma: number): this {
    this.#commands.push('-canny')
    this.#commands.push(`${low}x${high}+${radius}+${sigma}`)

    return this
  }

  cdl(filename: string): this {
    this.#commands.push('-cdl')
    this.#commands.push(filename)

    return this
  }

  clahe(width: number, height: number): this {
    this.#commands.push('-clahe')
    this.#commands.push(`${width}x${height}`)

    return this
  }

  claheExt(width: number, height: number, tiles: number, limit: number): this {
    this.#commands.push('-clahe')
    this.#commands.push(`${width}x${height}+${tiles}+${limit}`)

    return this
  }

  clamp(): this {
    this.#commands.push('-clamp')

    return this
  }

  colorMatrix(matrix: string): this {
    this.#commands.push('-color-matrix')
    this.#commands.push(matrix)

    return this
  }

  colors(value: number): this {
    this.#commands.push('-colors')
    this.#commands.push(value)

    return this
  }

  connectedComponents(connectivity: number): this {
    this.#commands.push('-connected-components')
    this.#commands.push(connectivity)

    return this
  }

  decipher(filename: string): this {
    this.#commands.push('-decipher')
    this.#commands.push(filename)

    return this
  }

  deskew(threshold: number): this {
    this.#commands.push('-deskew')
    this.#commands.push(`${threshold}%`)

    return this
  }

  encipher(filename: string): this {
    this.#commands.push('-encipher')
    this.#commands.push(filename)

    return this
  }

  fft(): this {
    this.#commands.push('-fft')

    return this
  }

  floodfill(x: number, y: number, color: string): this {
    this.#commands.push('-floodfill')
    this.#commands.push(new Geometry().offset(x, y).toString())
    this.#commands.push(color)

    return this
  }

  function(name: FunctionType, ...parameters: number[]): this {
    this.#commands.push('-function')
    this.#commands.push(name)
    this.#commands.push(parameters.join(','))

    return this
  }

  houghLines(width: number, height: number, threshold?: number): this {
    let command = `${width}x${height}`
    if (threshold !== undefined) {
      command += `+${threshold}`
    }

    this.#commands.push('-hough-lines')
    this.#commands.push(command)

    return this
  }

  ift(): this {
    this.#commands.push('-ift')

    return this
  }

  integral(): this {
    this.#commands.push('-integral')

    return this
  }

  interpolativeResize(width: number, height?: number): this {
    this.#commands.push('-interpolative-resize')

    if (height !== undefined) {
      this.#commands.push(`${width}x${height}`)
    } else {
      this.#commands.push(width)
    }

    return this
  }

  kmeans(colors: number, iterations: number, tolerance: number): this {
    this.#commands.push('-kmeans')
    this.#commands.push(`${colors}x${iterations}+${tolerance}`)

    return this
  }

  kuwahara(radius: number, sigma?: number): this {
    this.#commands.push('-kuwahara')

    if (sigma !== undefined) {
      this.#commands.push(`${radius}x${sigma}`)
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  levelColors(blackColor: string, whiteColor: string): this {
    this.#commands.push('-level-colors')
    this.#commands.push(`${blackColor},${whiteColor}`)

    return this
  }

  localContrast(radius: number, strength: number): this {
    this.#commands.push('-local-contrast')
    this.#commands.push(`${radius}x${strength}`)

    return this
  }

  meanShift(width: number, height: number, distance: number): this {
    this.#commands.push('-mean-shift')
    this.#commands.push(`${width}x${height}+${distance}`)

    return this
  }

  mode(width: number, height?: number): this {
    this.#commands.push('-mode')

    if (height !== undefined) {
      this.#commands.push(`${width}x${height}`)
    } else {
      this.#commands.push(width)
    }

    return this
  }

  perceptible(epsilon: number): this {
    this.#commands.push('-perceptible')
    this.#commands.push(epsilon)

    return this
  }

  rangeThreshold(low: number, high: number): this {
    this.#commands.push('-range-threshold')
    this.#commands.push(`${low},${high}`)

    return this
  }

  region(width: number, height: number): this {
    this.#commands.push('-region')
    this.#commands.push(`${width}x${height}`)

    return this
  }

  regionExt(fn: (g: Geometry) => Geometry): this {
    this.#commands.push('-region')
    this.#commands.push(fn(new Geometry()).toString())

    return this
  }

  reshape(width: number, height: number): this {
    this.#commands.push('-reshape')
    this.#commands.push(new Geometry().size(width, height).toString())

    return this
  }

  reshapeExt(fn: (g: Geometry) => Geometry): this {
    this.#commands.push('-reshape')
    this.#commands.push(fn(new Geometry()).toString())

    return this
  }

  sortPixels(): this {
    this.#commands.push('-sort-pixels')

    return this
  }

  sparseColor(method: SparseColorMethodType, ...points: string[]): this {
    this.#commands.push('-sparse-color')
    this.#commands.push(method)
    this.#commands.push(points.join(' '))

    return this
  }

  waveletDenoise(threshold: number): this {
    this.#commands.push('-wavelet-denoise')
    this.#commands.push(`${threshold}%`)

    return this
  }

  whiteBalance(): this {
    this.#commands.push('-white-balance')

    return this
  }

  channelFx(expression: string): this {
    this.#commands.push('-channel-fx')
    this.#commands.push(expression)

    return this
  }

  clut(): this {
    this.#commands.push('-clut')

    return this
  }

  coalesce(): this {
    this.#commands.push('-coalesce')

    return this
  }

  combine(): this {
    this.#commands.push('-combine')

    return this
  }

  compare(): this {
    this.#commands.push('-compare')

    return this
  }

  complex(operator: ComplexOperatorType): this {
    this.#commands.push('-complex')
    this.#commands.push(operator)

    return this
  }

  copy(
    width: number,
    height: number,
    sourceX: number,
    sourceY: number,
    destX: number,
    destY: number
  ): this {
    this.#commands.push('-copy')
    this.#commands.push(
      // `${width}x${height}${sourceX >= 0 ? '+' : ''}${sourceX}${sourceY >= 0 ? '+' : ''}${sourceY}`
      new Geometry().size(width, height).offset(sourceX, sourceY).toString()
    )
    this.#commands.push(
      //`${destX >= 0 ? '+' : ''}${destX}${destY >= 0 ? '+' : ''}${destY}`
      new Geometry().offset(destX, destY).toString()
    )

    return this
  }

  deconstruct(): this {
    this.#commands.push('-deconstruct')

    return this
  }

  evaluateSequence(operator: EvaluateType): this {
    this.#commands.push('-evaluate-sequence')
    this.#commands.push(operator)

    return this
  }

  haldClut(): this {
    this.#commands.push('-hald-clut')

    return this
  }

  morph(value: number): this {
    this.#commands.push('-morph')
    this.#commands.push(value)

    return this
  }

  poly(...terms: number[]): this {
    this.#commands.push('-poly')
    this.#commands.push(terms.join(','))

    return this
  }

  process(...args: string[]): this {
    this.#commands.push('-process')
    this.#commands.push(args.join(' '))

    return this
  }

  delete(...indexes: number[]): this {
    this.#commands.push('-delete')
    this.#commands.push(indexes.join(','))

    return this
  }

  distributeCache(port: number): this {
    this.#commands.push('-distribute-cache')
    this.#commands.push(port)

    return this
  }

  list(type: ListType): this {
    this.#commands.push('-list')
    this.#commands.push(type)

    return this
  }

  log(format: string): this {
    this.#commands.push('-log')
    this.#commands.push(format)

    return this
  }

  usage(): this {
    this.#commands.push('-usage')

    return this
  }

  #escape(data: unknown): string {
    const input = String(data)

    return input

    // if single safe word, return it
    // if (input.match(/^[\w+-]+$/)) {
    //   return input
    // }

    // return `'${input.replace(/\\/g, '\\\\').replace(/'/, '\\\'')}'`
  }

  #commands: (string | number | ImageMagickCommandBuilder)[] = []
  #buffers: Buffer[] = []
}

class DrawBuilder {
  #primitives: string[] = []

  point(x: number, y: number): this {
    this.#primitives.push(`point ${x},${y}`)
    return this
  }

  line(x0: number, y0: number, x1: number, y1: number): this {
    this.#primitives.push(`line ${x0},${y0} ${x1},${y1}`)
    return this
  }

  rectangle(x0: number, y0: number, x1: number, y1: number): this {
    this.#primitives.push(`rectangle ${x0},${y0} ${x1},${y1}`)
    return this
  }

  roundRectangle(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    wc: number,
    hc: number
  ): this {
    this.#primitives.push(`roundRectangle ${x0},${y0} ${x1},${y1} ${wc},${hc}`)
    return this
  }

  arc(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    a0: number,
    a1: number
  ): this {
    this.#primitives.push(`arc ${x0},${y0} ${x1},${y1} ${a0},${a1}`)
    return this
  }

  ellipse(
    x0: number,
    y0: number,
    rx: number,
    ry: number,
    a0: number,
    a1: number
  ): this {
    this.#primitives.push(`ellipse ${x0},${y0} ${rx},${ry} ${a0},${a1}`)
    return this
  }

  circle(x0: number, y0: number, x1: number, y1: number): this {
    this.#primitives.push(`circle ${x0},${y0} ${x1},${y1}`)
    return this
  }

  polyline(...points: [number, number][]): this {
    const pointStr = points.map(([x, y]) => `${x},${y}`).join(' ')
    this.#primitives.push(`polyline ${pointStr}`)
    return this
  }

  polygon(...points: [number, number][]): this {
    const pointStr = points.map(([x, y]) => `${x},${y}`).join(' ')
    this.#primitives.push(`polygon ${pointStr}`)
    return this
  }

  bezier(...points: [number, number][]): this {
    const pointStr = points.map(([x, y]) => `${x},${y}`).join(' ')
    this.#primitives.push(`bezier ${pointStr}`)
    return this
  }

  path(specification: string): this {
    this.#primitives.push(`path '${specification}'`)
    return this
  }

  image(
    operator: string,
    x0: number,
    y0: number,
    w: number,
    h: number,
    filename: string
  ): this {
    this.#primitives.push(
      `image ${operator} ${x0},${y0} ${w},${h} '${filename}'`
    )
    return this
  }

  text(x0: number, y0: number, string: string): this {
    this.#primitives.push(`text ${x0},${y0} '${string}'`)
    return this
  }

  gravity(direction: DrawGravityType): this {
    this.#primitives.push(`gravity ${direction}`)
    return this
  }

  rotate(degrees: number): this {
    this.#primitives.push(`rotate ${degrees}`)
    return this
  }

  translate(dx: number, dy: number): this {
    this.#primitives.push(`translate ${dx},${dy}`)
    return this
  }

  scale(sx: number, sy: number): this {
    this.#primitives.push(`scale ${sx},${sy}`)
    return this
  }

  skewX(degrees: number): this {
    this.#primitives.push(`skewX ${degrees}`)
    return this
  }

  skewY(degrees: number): this {
    this.#primitives.push(`skewY ${degrees}`)
    return this
  }

  color(x0: number, y0: number, method: string): this {
    this.#primitives.push(`color ${x0},${y0} ${method}`)
    return this
  }

  matte(x0: number, y0: number, method: string): this {
    this.#primitives.push(`matte ${x0},${y0} ${method}`)
    return this
  }

  toString(): string {
    // FIXME: escaping required here?
    return this.#primitives.join(' ')
  }
}

type GravityType =
  | 'None'
  | 'Center'
  | 'East'
  | 'Forget'
  | 'NorthEast'
  | 'North'
  | 'NorthWest'
  | 'SouthEast'
  | 'South'
  | 'SouthWest'
  | 'West'
type FilterType =
  | 'Bartlett'
  | 'Blackman'
  | 'Bohman'
  | 'Box'
  | 'Catrom'
  | 'Cosine'
  | 'Cubic'
  | 'Gaussian'
  | 'Hamming'
  | 'Hann'
  | 'Hermite'
  | 'Jinc'
  | 'Kaiser'
  | 'Lagrange'
  | 'Lanczos'
  | 'Lanczos2'
  | 'Lanczos2Sharp'
  | 'LanczosRadius'
  | 'LanczosSharp'
  | 'Mitchell'
  | 'Parzen'
  | 'Point'
  | 'Quadratic'
  | 'Robidoux'
  | 'RobidouxSharp'
  | 'Sinc'
  | 'SincFast'
  | 'Spline'
  | 'CubicSpline'
  | 'Triangle'
  | 'Welch'
type InterpolateType =
  | 'Average'
  | 'Average4'
  | 'Average9'
  | 'Average16'
  | 'Background'
  | 'Bilinear'
  | 'Blend'
  | 'Catrom'
  | 'Integer'
  | 'Mesh'
  | 'Nearest'
  | 'Spline'
type AlphaType =
  | 'Activate'
  | 'Associate'
  | 'Background'
  | 'Copy'
  | 'Deactivate'
  | 'Discrete'
  | 'Disassociate'
  | 'Extract'
  | 'Off'
  | 'On'
  | 'Opaque'
  | 'Remove'
  | 'Set'
  | 'Shape'
  | 'Transparent'
type ComposeType =
  | 'Atop'
  | 'Blend'
  | 'Blur'
  | 'Bumpmap'
  | 'ChangeMask'
  | 'Clear'
  | 'ColorBurn'
  | 'ColorDodge'
  | 'Colorize'
  | 'CopyAlpha'
  | 'CopyBlack'
  | 'CopyBlue'
  | 'Copy'
  | 'CopyCyan'
  | 'CopyGreen'
  | 'CopyMagenta'
  | 'CopyRed'
  | 'CopyYellow'
  | 'Darken'
  | 'DarkenIntensity'
  | 'Difference'
  | 'Displace'
  | 'Dissolve'
  | 'Distort'
  | 'DivideDst'
  | 'DivideSrc'
  | 'DstAtop'
  | 'Dst'
  | 'DstIn'
  | 'DstOut'
  | 'DstOver'
  | 'Exclusion'
  | 'Freeze'
  | 'HardLight'
  | 'HardMix'
  | 'Hue'
  | 'In'
  | 'Intensity'
  | 'Interpolate'
  | 'LightenIntensity'
  | 'Lighten'
  | 'LinearBurn'
  | 'LinearDodge'
  | 'LinearLight'
  | 'Luminize'
  | 'Mathematics'
  | 'MinusDst'
  | 'MinusSrc'
  | 'Modulate'
  | 'ModulusAdd'
  | 'ModulusSubtract'
  | 'Multiply'
  | 'Negate'
  | 'None'
  | 'Out'
  | 'Overlay'
  | 'Over'
  | 'PegtopLight'
  | 'PinLight'
  | 'Plus'
  | 'Reflect'
  | 'Replace'
  | 'RMSE'
  | 'Saturate'
  | 'Screen'
  | 'SoftBurn'
  | 'SoftDodge'
  | 'SoftLight'
  | 'SrcAtop'
  | 'SrcIn'
  | 'SrcOut'
  | 'SrcOver'
  | 'Src'
  | 'Stamp'
  | 'Stereo'
  | 'VividLight'
  | 'Xor'
type DirectionType = 'left-to-right' | 'right-to-left'
type DisposeType = 'Background' | 'None' | 'Previous'
type DistortType =
  | 'Affine'
  | 'AffineProjection'
  | 'Arc'
  | 'Barrel'
  | 'BilinearForward'
  | 'BilinearReverse'
  | 'DePolar'
  | 'Perspective'
  | 'PerspectiveProjection'
  | 'Polar'
  | 'Polynomial'
  | 'Resize'
  | 'Rotate'
  | 'ScaleRotateTranslate'
  | 'Shepards'
type DitherType = 'FloydSteinberg' | 'Riemersma' | 'None'
type DebugType =
  | 'All'
  | 'Accelerate'
  | 'Annotate'
  | 'Blob'
  | 'Cache'
  | 'Coder'
  | 'Configure'
  | 'Deprecate'
  | 'Exception'
  | 'Locale'
  | 'None'
  | 'Render'
  | 'Resource'
  | 'Security'
  | 'TemporaryFile'
  | 'Trace'
  | 'Transform'
  | 'User'
  | 'X11'
type ColorspaceType =
  | 'CMY'
  | 'CMYK'
  | 'Gray'
  | 'HCL'
  | 'HCLp'
  | 'HSB'
  | 'HSI'
  | 'HSL'
  | 'HSV'
  | 'HWB'
  | 'Lab'
  | 'LCH'
  | 'LCHab'
  | 'LCHuv'
  | 'LMS'
  | 'Log'
  | 'Luv'
  | 'OHTA'
  | 'Rec601YCbCr'
  | 'Rec709YCbCr'
  | 'RGB'
  | 'scRGB'
  | 'sRGB'
  | 'Transparent'
  | 'XYZ'
  | 'YCbCr'
  | 'YCC'
  | 'YDbDr'
  | 'YIQ'
  | 'YPbPr'
  | 'YUV'
type CompressType =
  | 'B44'
  | 'B44A'
  | 'BZip'
  | 'DXT1'
  | 'DXT3'
  | 'DXT5'
  | 'Fax'
  | 'Group4'
  | 'JBIG1'
  | 'JBIG2'
  | 'JPEG'
  | 'JPEG2000'
  | 'Lossless'
  | 'LosslessJPEG'
  | 'LZMA'
  | 'LZW'
  | 'None'
  | 'Piz'
  | 'Pxr24'
  | 'RLE'
  | 'Zip'
  | 'ZipS'
type ChannelType =
  | 'Red'
  | 'Green'
  | 'Blue'
  | 'Alpha'
  | 'Gray'
  | 'Cyan'
  | 'Magenta'
  | 'Yellow'
  | 'Black'
  | 'Opacity'
  | 'Index'
  | 'RGB'
  | 'RGBA'
  | 'CMYK'
  | 'CMYKA'
  | number
type GrayscaleType =
  | 'average'
  | 'brightness'
  | 'lightness'
  | 'luma'
  | 'rec601luma'
  | 'rec709luma'
  | 'rms'
type EndianType = 'LSB' | 'MSB'
type EvaluateType =
  | 'Add'
  | 'AddModulus'
  | 'And'
  | 'Cos'
  | 'Cosine'
  | 'Divide'
  | 'Exp'
  | 'Gaussian'
  | 'LeftShift'
  | 'Log'
  | 'Max'
  | 'Mean'
  | 'Median'
  | 'Min'
  | 'Multiply'
  | 'Or'
  | 'Pow'
  | 'RightShift'
  | 'RMS'
  | 'Set'
  | 'Sin'
  | 'Sine'
  | 'Subtract'
  | 'Sum'
  | 'Threshold'
  | 'ThresholdBlack'
  | 'ThresholdWhite'
  | 'Uniform'
  | 'Xor'
type FunctionType = 'Polynomial' | 'Sinusoid' | 'ArcSin' | 'ArcTan'
type IntentType = 'Absolute' | 'Perceptual' | 'Relative' | 'Saturation'
type InterlaceType =
  | 'Line'
  | 'None'
  | 'Plane'
  | 'Partition'
  | 'JPEG'
  | 'GIF'
  | 'PNG'
type LayersType =
  | 'coalesce'
  | 'compare-any'
  | 'compare-clear'
  | 'compare-overlay'
  | 'composite'
  | 'dispose'
  | 'flatten'
  | 'merge'
  | 'mosaic'
  | 'optimize'
  | 'optimize-frame'
  | 'optimize-plus'
  | 'optimize-trans'
  | 'remove-dups'
  | 'remove-zero'
type LimitType =
  | 'disk'
  | 'file'
  | 'map'
  | 'memory'
  | 'thread'
  | 'throttle'
  | 'time'
type MorphologyType =
  | 'Convolve'
  | 'Correlate'
  | 'Erode'
  | 'Dilate'
  | 'ErodeIntensity'
  | 'DilateIntensity'
  | 'Distance'
  | 'Open'
  | 'Close'
  | 'OpenIntensity'
  | 'CloseIntensity'
  | 'Smooth'
  | 'EdgeIn'
  | 'EdgeOut'
  | 'Edge'
  | 'TopHat'
  | 'BottomHat'
  | 'HitAndMiss'
  | 'Thinning'
  | 'Thicken'
type NoiseType =
  | 'Gaussian'
  | 'Impulse'
  | 'Laplacian'
  | 'Multiplicative'
  | 'Poisson'
  | 'Random'
  | 'Uniform'
type OrientType =
  | 'TopLeft'
  | 'TopRight'
  | 'BottomRight'
  | 'BottomLeft'
  | 'LeftTop'
  | 'RightTop'
  | 'RightBottom'
  | 'LeftBottom'
type PreviewType =
  | 'Rotate'
  | 'Roll'
  | 'Hue'
  | 'Saturation'
  | 'Brightness'
  | 'Gamma'
  | 'Spiff'
  | 'Dull'
  | 'Grayscale'
  | 'Quantize'
  | 'Despeckle'
  | 'ReduceNoise'
  | 'AddNoise'
  | 'Sharpen'
  | 'Blur'
  | 'Threshold'
  | 'EdgeDetect'
  | 'Spread'
  | 'Solarize'
  | 'Shade'
  | 'Raise'
  | 'Segment'
  | 'Swirl'
  | 'Implode'
  | 'Wave'
  | 'OilPaint'
  | 'Charcoal'
  | 'JPEG'
type StatisticType =
  | 'Gradient'
  | 'Maximum'
  | 'Mean'
  | 'Median'
  | 'Minimum'
  | 'Mode'
  | 'Nonpeak'
  | 'RootMeanSquare'
  | 'StandardDeviation'
type StretchType =
  | 'Any'
  | 'Condensed'
  | 'Expanded'
  | 'ExtraCondensed'
  | 'ExtraExpanded'
  | 'Normal'
  | 'SemiCondensed'
  | 'SemiExpanded'
  | 'UltraCondensed'
  | 'UltraExpanded'
type StyleType = 'Any' | 'Italic' | 'Normal' | 'Oblique'
type VirtualPixelType =
  | 'Background'
  | 'Black'
  | 'CheckerTile'
  | 'Dither'
  | 'Edge'
  | 'Gray'
  | 'HorizontalTile'
  | 'HorizontalTileEdge'
  | 'Mirror'
  | 'None'
  | 'Random'
  | 'Tile'
  | 'Transparent'
  | 'VerticalTile'
  | 'VerticalTileEdge'
  | 'White'
type DrawGravityType = Omit<GravityType, 'None' | 'Forget'>
type IlluminantType =
  | 'A'
  | 'B'
  | 'C'
  | 'D50'
  | 'D55'
  | 'D65'
  | 'D75'
  | 'E'
  | 'F2'
  | 'F7'
  | 'F11'
type IntensityType =
  | 'Average'
  | 'Brightness'
  | 'Lightness'
  | 'Luma'
  | 'MS'
  | 'Rec601Luma'
  | 'Rec709Luma'
  | 'RMS'
type AutoThresholdType = 'OTSU' | 'Kapur' | 'Triangle'
type SparseColorMethodType =
  | 'Barycentric'
  | 'Bilinear'
  | 'Polynomial'
  | 'Shepards'
  | 'Voronoi'
type ComplexOperatorType =
  | 'Add'
  | 'Conjugate'
  | 'Divide'
  | 'MagnitudePhase'
  | 'Multiply'
  | 'RealImaginary'
  | 'Subtract'
type ListType =
  | 'Color'
  | 'Configure'
  | 'Delegate'
  | 'Font'
  | 'Format'
  | 'Locale'
  | 'Log'
  | 'Magic'
  | 'Module'
  | 'Policy'
  | 'Resource'
  | 'Threshold'
  | 'Type'
