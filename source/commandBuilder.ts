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
    this.#commands.forEach(part => part instanceof ImageMagickCommandBuilder ? a.push(...part.parts()) : a.push(part))

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
      this.#commands.push(this.#escape(fdRef))
    } else {
      this.#commands.push(this.#escape(input))
    }

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
      this.#commands.push(this.#escape(gravity))
    } else {
      this.#commands.push('+gravity')
    }

    return this
  }

  geometry(x: number, y: number): this {
    this.#commands.push('-geometry')
    this.#commands.push(this.#escape(new Geometry().offset(x, y).toString()))

    return this
  }

  size(w?: number, h?: number): this {
    if (w === undefined && h === undefined) {
      this.#commands.push('+size')
    } else {
      this.#commands.push('-size')
      this.#commands.push(this.#escape(new Geometry().size(w, h).toString()))
    }

    return this
  }

  clone(...indexes: number[]): ImageMagickCommandBuilder {
    if (indexes.length > 0) {
      this.#commands.push('-clone')
      this.#commands.push(indexes.map(idx => this.#escape(idx)).join(','))
    } else {
      this.#commands.push('+clone')
    }

    return this
  }

  extent(w: number, h: number): this {
    this.#commands.push('-extent')
    this.#commands.push(this.#escape(new Geometry().size(w, h).toString()))

    return this
  }

  resize(w?: number, h?: number): this {
    if (w === undefined && h === undefined) {
      // todo: noop?
    } else {
      this.#commands.push('-resize')
      this.#commands.push(this.#escape(new Geometry().size(w, h).toString()))
    }

    return this
  }

  resizeExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-resize')
    this.#commands.push(this.#escape(geometry.toString()))

    return this
  }

  crop(w: number, h: number, x?: number, y?: number): this {
    this.#commands.push('-crop')

    const geometry = new Geometry().size(w, h)
    if (x !== undefined && y !== undefined) {
      geometry.offset(x, y)
    }

    this.#commands.push(this.#escape(geometry.toString()))

    return this
  }

  cropExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-crop')
    this.#commands.push(this.#escape(geometry.toString()))

    return this
  }

  rotate(degrees: number, flag?: '<' | '>'): this {
    this.#commands.push('-rotate')

    const rotation = flag ? `${degrees}${flag}` : `${degrees}`
    this.#commands.push(this.#escape(rotation))

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
      this.#commands.push(this.#escape(value))
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
      this.#commands.push(this.#escape(`${radius}x${sigma}`))
    } else {
      this.#commands.push(this.#escape(radius))
    }

    return this
  }

  sharpen(radius: number = 0, sigma?: number): this {
    this.#commands.push('-sharpen')

    if (sigma !== undefined) {
      this.#commands.push(this.#escape(`${radius}x${sigma}`))
    } else {
      this.#commands.push(this.#escape(radius))
    }

    return this
  }

  background(background: string): this {
    this.#commands.push('-background')
    this.#commands.push(this.#escape(background))

    return this
  }

  trim(): this {
    this.#commands.push('-trim')

    return this
  }

  label(input: string | number): this {
    this.#commands.push(`label:${this.#escape(input)}`)

    return this
  }

  font(font: string): this {
    this.#commands.push('-font')
    this.#commands.push(this.#escape(font))

    return this
  }

  pointsize(size?: number): this {
    if (size) {
      this.#commands.push('-pointsize')
      this.#commands.push(this.#escape(size))
    } else {
      this.#commands.push('+pointsize')
    }

    return this
  }

  alpha(type: AlphaType): this {
    this.#commands.push('-alpha')
    this.#commands.push(this.#escape(type))

    return this
  }

  interpolate(type: InterpolateType): this {
    this.#commands.push('-interpolate')
    this.#commands.push(this.#escape(type))

    return this
  }

  filter(type: FilterType): this {
    this.#commands.push('-filter')
    this.#commands.push(this.#escape(type))

    return this
  }

  compose(type: ComposeType): this {
    this.#commands.push('-compose')
    this.#commands.push(this.#escape(type))

    return this
  }

  fill(color: string): this {
    this.#commands.push('-fill')
    this.#commands.push(this.#escape(color))

    return this
  }

  opaque(color: string, invert?: boolean): this {
    this.#commands.push(invert ? '+opaque' : '-opaque')
    this.#commands.push(this.#escape(color))

    return this
  }

  adaptiveBlur(radius: number = 0, sigma?: number): this {
    this.#commands.push('-adaptive-blur')

    if (sigma !== undefined) {
      this.#commands.push(this.#escape(`${radius}x${sigma}`))
    } else {
      this.#commands.push(this.#escape(radius))
    }

    return this
  }

  adaptiveResize(w?: number, h?: number): this {
    if (w || h) {
      this.#commands.push('-adaptive-resize')
      this.#commands.push(this.#escape(new Geometry().size(w, h).toString()))
    }

    return this
  }

  adaptiveResizeExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-adaptive-resize')
    this.#commands.push(this.#escape(geometry.toString()))

    return this
  }

  adaptiveSharpen(radius: number = 0, sigma?: number): this {
    this.#commands.push('-adaptive-sharpen')

    if (sigma !== undefined) {
      this.#commands.push(this.#escape(`${radius}x${sigma}`))
    } else {
      this.#commands.push(this.#escape(radius))
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
      this.#commands.push(this.#escape(`${red},${green},${blue}`))
    } else if (green !== undefined) {
      this.#commands.push(this.#escape(`${red},${green}`))
    } else {
      this.#commands.push(this.#escape(red))
    }

    return this
  }

  colorspace(type: ColorspaceType): this {
    this.#commands.push('-colorspace')
    this.#commands.push(this.#escape(type))

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

  affine(sx: number, rx: number, ry: number, sy: number, tx?: number, ty?: number): this {
    this.#commands.push('-affine')

    if (tx !== undefined && ty !== undefined) {
      this.#commands.push(this.#escape(`${sx},${rx},${ry},${sy},${tx},${ty}`))
    } else {
      this.#commands.push(this.#escape(`${sx},${rx},${ry},${sy}`))
    }

    return this
  }

  annotate(degrees: number, text: string): this {
    this.#commands.push('-annotate')
    this.#commands.push(this.#escape(degrees))
    this.#commands.push(this.#escape(text))

    return this
  }

  authenticate(password: string): this {
    this.#commands.push('-authenticate')
    this.#commands.push(this.#escape(password))

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
    this.#commands.push(this.#escape(value))

    return this
  }

  blackThreshold(value: string): this {
    this.#commands.push('-black-threshold')
    this.#commands.push(this.#escape(value))

    return this
  }

  border(width: number, height?: number): this {
    this.#commands.push('-border')

    if (height !== undefined) {
      this.#commands.push(this.#escape(new Geometry().size(width, height).toString()))
    } else {
      this.#commands.push(this.#escape(width))
    }

    return this
  }

  bordercolor(color: string): this {
    this.#commands.push('-bordercolor')
    this.#commands.push(this.#escape(color))

    return this
  }

  despeckle(): this {
    this.#commands.push('-despeckle')

    return this
  }

  gaussianBlur(radius: number = 0, sigma?: number): this {
    this.#commands.push('-gaussian-blur')

    if (sigma !== undefined) {
      this.#commands.push(this.#escape(`${radius}x${sigma}`))
    } else {
      this.#commands.push(this.#escape(radius))
    }

    return this
  }

  density(x: number, y?: number): this {
    this.#commands.push('-density')

    if (y !== undefined) {
      this.#commands.push(this.#escape(new Geometry().size(x, y).toString()))
    } else {
      this.#commands.push(this.#escape(x))
    }

    return this
  }

  depth(value: number): this {
    this.#commands.push('-depth')
    this.#commands.push(this.#escape(value))

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
    this.#commands.push(this.#escape(`${brightness}x${contrast}`))

    return this
  }

  channel(...types: ChannelType[]): this {
    if (types.length > 0) {
      this.#commands.push('-channel')
      this.#commands.push(types.map(type => this.#escape(type)).join(','))
    } else {
      this.#commands.push('+channel')
    }

    return this
  }

  charcoal(radius: number = 0, sigma?: number): this {
    this.#commands.push('-charcoal')

    if (sigma !== undefined) {
      this.#commands.push(this.#escape(`${radius}x${sigma}`))
    } else {
      this.#commands.push(this.#escape(radius))
    }

    return this
  }

  chop(width: number, height: number, x?: number, y?: number): this {
    this.#commands.push('-chop')

    const geometry = new Geometry().size(width, height)
    if (x !== undefined && y !== undefined) {
      geometry.offset(x, y)
    }

    this.#commands.push(this.#escape(geometry.toString()))

    return this
  }

  compress(type: CompressType): this {
    this.#commands.push('-compress')
    this.#commands.push(this.#escape(type))

    return this
  }

  contrastStretch(blackPoint: number, whitePoint: number): this {
    this.#commands.push('-contrast-stretch')

    if (blackPoint === 0 && whitePoint === 0) {
      this.#commands.push(this.#escape('0x0'))
    } else {
      this.#commands.push(this.#escape(`${blackPoint}%x${whitePoint}%`))
    }

    return this
  }

  cycle(amount: number): this {
    this.#commands.push('-cycle')
    this.#commands.push(this.#escape(amount))

    return this
  }

  edge(radius: number): this {
    this.#commands.push('-edge')
    this.#commands.push(this.#escape(radius))

    return this
  }

  emboss(radius: number = 0, sigma?: number): this {
    this.#commands.push('-emboss')

    if (sigma !== undefined) {
      this.#commands.push(this.#escape(`${radius}x${sigma}`))
    } else {
      this.#commands.push(this.#escape(radius))
    }

    return this
  }

  gamma(value: number): this {
    this.#commands.push('-gamma')
    this.#commands.push(this.#escape(value))

    return this
  }

  grayscale(method: GrayscaleType): this {
    this.#commands.push('-grayscale')
    this.#commands.push(this.#escape(method))

    return this
  }

  help(): this {
    // if run, it must be the only option. fails otherwise
    this.#commands.push('-help')

    return this
  }

  implode(amount: number): this {
    this.#commands.push('-implode')
    this.#commands.push(this.#escape(amount))

    return this
  }

  median(radius: number = 0, sigma?: number): this {
    this.#commands.push('-median')

    if (sigma !== undefined) {
      this.#commands.push(this.#escape(`${radius}x${sigma}`))
    } else {
      this.#commands.push(this.#escape(radius))
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
    this.#commands.push(this.#escape(kernel))

    return this
  }

  debug(...events: DebugType[]): this {
    if (events.length > 0) {
      this.#commands.push('-debug')
      this.#commands.push(events.map(event => this.#escape(event)).join(','))
    } else {
      this.#commands.push('+debug')
    }

    return this
  }

  define(key: string, remove?: boolean): this {
    if (remove === true) {
      this.#commands.push('+define')
      this.#commands.push(this.#escape(key))
    } else {
      this.#commands.push('-define')
      this.#commands.push(this.#escape(key))
    }

    return this
  }

  delay(value: number | string, modifier?: '>' | '<'): this {
    this.#commands.push('-delay')

    if (modifier) {
      this.#commands.push(this.#escape(`${value}${modifier}`))
    } else {
      this.#commands.push(this.#escape(value))
    }

    return this
  }

  direction(type: DirectionType): this {
    this.#commands.push('-direction')
    this.#commands.push(this.#escape(type))

    return this
  }

  display(server: string): this {
    this.#commands.push('-display')
    this.#commands.push(this.#escape(server))

    return this
  }

  dispose(method: DisposeType): this {
    this.#commands.push('-dispose')
    this.#commands.push(this.#escape(method))

    return this
  }

  distort(type: DistortType, args: string): this {
    this.#commands.push('-distort')
    this.#commands.push(this.#escape(type))
    this.#commands.push(this.#escape(args))

    return this
  }

  dither(method?: DitherType): this {
    if (method) {
      this.#commands.push('-dither')
      this.#commands.push(this.#escape(method))
    } else {
      this.#commands.push('+dither')
    }

    return this
  }

  draw(fn: (draw: DrawBuilder) => DrawBuilder): this {
    this.#commands.push('-draw')

    const drawBuilder = fn(new DrawBuilder())
    this.#commands.push(this.#escape(drawBuilder.toString()))

    return this
  }

  duplicate(count: number, ...indexes: number[]): this {
    this.#commands.push('-duplicate')

    if (indexes.length > 0) {
      this.#commands.push(this.#escape(`${count},${indexes.map(idx => this.#escape(idx)).join(',')}`))
    } else {
      this.#commands.push(this.#escape(count))
    }

    return this
  }

  encoding(type: string): this {
    this.#commands.push('-encoding')
    this.#commands.push(this.#escape(type))

    return this
  }

  endian(type: EndianType): this {
    this.#commands.push('-endian')
    this.#commands.push(this.#escape(type))

    return this
  }

  evaluate(operator: EvaluateType, value: number): this {
    this.#commands.push('-evaluate')
    this.#commands.push(this.#escape(operator))
    this.#commands.push(this.#escape(value))

    return this
  }

  extract(geometry: string): this {
    this.#commands.push('-extract')
    this.#commands.push(this.#escape(geometry))

    return this
  }

  family(name: string): this {
    this.#commands.push('-family')
    this.#commands.push(this.#escape(name))

    return this
  }

  format(type: string): this {
    this.#commands.push('-format')
    this.#commands.push(this.#escape(type))

    return this
  }

  frame(width: number, height: number, outerBevel?: number, innerBevel?: number): this {
    this.#commands.push('-frame')

    let frameSpec = `${width}x${height}`
    if (outerBevel !== undefined) {
      frameSpec += `+${outerBevel}`
      if (innerBevel !== undefined) {
        frameSpec += `+${innerBevel}`
      }
    }

    this.#commands.push(this.#escape(frameSpec))

    return this
  }

  /// -function
  func(type: FunctionType, parameters: string): this {
    this.#commands.push('-function')
    this.#commands.push(this.#escape(type))
    this.#commands.push(this.#escape(parameters))

    return this
  }

  fuzz(distance: string): this {
    this.#commands.push('-fuzz')
    this.#commands.push(this.#escape(distance))

    return this
  }

  fx(expression: string): this {
    this.#commands.push('-fx')
    this.#commands.push(this.#escape(expression))

    return this
  }

  identify(): this {
    this.#commands.push('-identify')

    return this
  }

  insert(index: number): this {
    this.#commands.push('-insert')
    this.#commands.push(this.#escape(index))

    return this
  }

  intent(type: IntentType): this {
    this.#commands.push('-intent')
    this.#commands.push(this.#escape(type))

    return this
  }

  interlace(type: InterlaceType): this {
    this.#commands.push('-interlace')
    this.#commands.push(this.#escape(type))

    return this
  }

  kerning(value: number): this {
    this.#commands.push('-kerning')
    this.#commands.push(this.#escape(value))

    return this
  }

  lat(width: number, height: number, offset: number, percent?: number): this {
    this.#commands.push('-lat')

    let latSpec = `${width}x${height}+${offset}`
    if (percent !== undefined) {
      latSpec += `%+${percent}%`
    }

    this.#commands.push(this.#escape(latSpec))

    return this
  }

  layers(method: LayersType): this {
    this.#commands.push('-layers')
    this.#commands.push(this.#escape(method))

    return this
  }

  level(blackPoint: number, whitePoint: number, gamma?: number): this {
    this.#commands.push('-level')

    let levelSpec = `${blackPoint},${whitePoint}`
    if (gamma !== undefined) {
      levelSpec += `,${gamma}`
    }

    this.#commands.push(this.#escape(levelSpec))

    return this
  }

  limit(type: LimitType, value: string): this {
    this.#commands.push('-limit')
    this.#commands.push(this.#escape(type))
    this.#commands.push(this.#escape(value))

    return this
  }

  linearStretch(blackPoint: number, whitePoint: number): this {
    this.#commands.push('-linear-stretch')
    this.#commands.push(this.#escape(`${blackPoint}%x${whitePoint}%`))

    return this
  }

  liquidRescale(width: number, height?: number, deltaX?: number, rigidity?: number): this {
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

    this.#commands.push(this.#escape(rescaleSpec))

    return this
  }

  loop(iterations: number): this {
    this.#commands.push('-loop')
    this.#commands.push(this.#escape(iterations))

    return this
  }

  mattecolor(color: string): this {
    this.#commands.push('-mattecolor')
    this.#commands.push(this.#escape(color))

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

    this.#commands.push(this.#escape(modulateSpec))

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

  morphology(method: MorphologyType, kernel: string, iterations?: number): this {
    this.#commands.push('-morphology')

    if (iterations !== undefined) {
      this.#commands.push(this.#escape(`${method}:${iterations}`))
    } else {
      this.#commands.push(this.#escape(method))
    }

    this.#commands.push(this.#escape(kernel))

    return this
  }

  mosaic(): this {
    this.#commands.push('-mosaic')

    return this
  }

  motionBlur(radius: number = 0, sigma: number, angle: number): this {
    this.#commands.push('-motion-blur')
    this.#commands.push(this.#escape(`${radius}x${sigma}+${angle}`))

    return this
  }

  noise(type?: NoiseType): this {
    if (type) {
      this.#commands.push('-noise')
      this.#commands.push(this.#escape(type))
    } else {
      this.#commands.push('+noise')
    }

    return this
  }

  orderedDither(threshold: string): this {
    this.#commands.push('-ordered-dither')
    this.#commands.push(this.#escape(threshold))

    return this
  }

  orient(type: OrientType): this {
    this.#commands.push('-orient')
    this.#commands.push(this.#escape(type))

    return this
  }

  page(geometry?: string): this {
    if (geometry) {
      this.#commands.push('-page')
      this.#commands.push(this.#escape(geometry))
    } else {
      this.#commands.push('+page')
    }

    return this
  }

  paint(radius: number): this {
    this.#commands.push('-paint')
    this.#commands.push(this.#escape(radius))

    return this
  }

  polaroid(angle: number): this {
    this.#commands.push('-polaroid')
    this.#commands.push(this.#escape(angle))

    return this
  }

  posterize(levels: number): this {
    this.#commands.push('-posterize')
    this.#commands.push(this.#escape(levels))

    return this
  }

  preview(type: PreviewType): this {
    this.#commands.push('-preview')
    this.#commands.push(this.#escape(type))

    return this
  }

  print(format: string): this {
    this.#commands.push('-print')
    this.#commands.push(this.#escape(format))

    return this
  }

  profile(filename?: string): this {
    if (filename) {
      this.#commands.push('-profile')
      this.#commands.push(this.#escape(filename))
    } else {
      this.#commands.push('+profile')
    }

    return this
  }

  quantize(colorspace: ColorspaceType): this {
    this.#commands.push('-quantize')
    this.#commands.push(this.#escape(colorspace))

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
    this.#commands.push(this.#escape(angle))

    return this
  }

  raise(width: number, height?: number, lowered?: boolean): this {
    if (lowered === true) {
      this.#commands.push('+raise')
    } else {
      this.#commands.push('-raise')
    }

    if (height !== undefined) {
      this.#commands.push(this.#escape(new Geometry().size(width, height).toString()))
    } else {
      this.#commands.push(this.#escape(width))
    }

    return this
  }

  randomThreshold(low: number, high: number): this {
    this.#commands.push('-random-threshold')
    this.#commands.push(this.#escape(`${low}%,${high}%`))

    return this
  }

  redPrimary(x: number, y: number): this {
    this.#commands.push('-red-primary')
    this.#commands.push(this.#escape(`${x},${y}`))

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
      this.#commands.push(this.#escape(filename))
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
      this.#commands.push(this.#escape(geometry))
    } else {
      this.#commands.push('+repage')
    }

    return this
  }

  resample(density: string): this {
    this.#commands.push('-resample')
    this.#commands.push(this.#escape(density))

    return this
  }

  roll(x: number, y: number): this {
    this.#commands.push('-roll')
    this.#commands.push(this.#escape(`${x > 0 ? '+' : ''}${x}${y > 0 ? '+' : ''}${y}`))

    return this
  }

  sample(geometry: string): this {
    this.#commands.push('-sample')
    this.#commands.push(this.#escape(geometry))

    return this
  }

  samplingFactor(factors: string): this {
    this.#commands.push('-sampling-factor')
    this.#commands.push(this.#escape(factors))

    return this
  }

  scale(geometry: string): this {
    this.#commands.push('-scale')
    this.#commands.push(this.#escape(geometry))

    return this
  }

  scene(value: number): this {
    this.#commands.push('-scene')
    this.#commands.push(this.#escape(value))

    return this
  }

  seed(value: number): this {
    this.#commands.push('-seed')
    this.#commands.push(this.#escape(value))

    return this
  }

  segment(cluster: number, smoothing: number): this {
    this.#commands.push('-segment')
    this.#commands.push(this.#escape(`${cluster}x${smoothing}`))

    return this
  }

  selectiveBlur(radius: number = 0, sigma: number, threshold: string): this {
    this.#commands.push('-selective-blur')
    this.#commands.push(this.#escape(`${radius}x${sigma}+${threshold}`))

    return this
  }

  separate(): this {
    this.#commands.push('-separate')

    return this
  }

  sepiaTone(threshold: string): this {
    this.#commands.push('-sepia-tone')
    this.#commands.push(this.#escape(threshold))

    return this
  }

  set(attribute: string, value?: string): this {
    if (value !== undefined) {
      this.#commands.push('-set')
      this.#commands.push(this.#escape(attribute))
      this.#commands.push(this.#escape(value))
    } else {
      this.#commands.push('+set')
      this.#commands.push(this.#escape(attribute))
    }

    return this
  }

  shade(azimuth: number, elevation: number, gray?: boolean): this {
    if (gray === true) {
      this.#commands.push('+shade')
    } else {
      this.#commands.push('-shade')
    }
    this.#commands.push(this.#escape(`${azimuth}x${elevation}`))

    return this
  }

  shadow(radius: number = 0, sigma: number, x: number, y: number): this {
    this.#commands.push('-shadow')
    this.#commands.push(this.#escape(`${radius}x${sigma}+${x}+${y}`))

    return this
  }

  shave(width: number, height: number): this {
    this.#commands.push('-shave')
    this.#commands.push(this.#escape(new Geometry().size(width, height).toString()))

    return this
  }

  shear(xDegrees: number, yDegrees: number): this {
    this.#commands.push('-shear')
    this.#commands.push(this.#escape(`${xDegrees}x${yDegrees}`))

    return this
  }

  sigmoidalContrast(contrast: number, midpoint: number, sharpen?: boolean): this {
    if (sharpen === true) {
      this.#commands.push('+sigmoidal-contrast')
    } else {
      this.#commands.push('-sigmoidal-contrast')
    }
    this.#commands.push(this.#escape(`${contrast}x${midpoint}%`))

    return this
  }

  sketch(radius: number = 0, sigma: number, angle: number): this {
    this.#commands.push('-sketch')
    this.#commands.push(this.#escape(`${radius}x${sigma}+${angle}`))

    return this
  }

  smush(offset: number, vertical?: boolean): this {
    if (vertical === true) {
      this.#commands.push('-smush')
    } else {
      this.#commands.push('+smush')
    }
    this.#commands.push(this.#escape(offset))

    return this
  }

  solarize(threshold: string): this {
    this.#commands.push('-solarize')
    this.#commands.push(this.#escape(threshold))

    return this
  }

  splice(width: number, height: number, x: number, y: number): this {
    this.#commands.push('-splice')
    this.#commands.push(this.#escape(new Geometry().size(width, height).offset(x, y).toString()))

    return this
  }

  spread(radius: number): this {
    this.#commands.push('-spread')
    this.#commands.push(this.#escape(radius))

    return this
  }

  statistic(type: StatisticType, width: number, height: number): this {
    this.#commands.push('-statistic')
    this.#commands.push(this.#escape(type))
    this.#commands.push(this.#escape(`${width}x${height}`))

    return this
  }

  stretch(type: StretchType): this {
    this.#commands.push('-stretch')
    this.#commands.push(this.#escape(type))

    return this
  }

  stroke(color: string): this {
    this.#commands.push('-stroke')
    this.#commands.push(this.#escape(color))

    return this
  }

  strokewidth(value: number): this {
    this.#commands.push('-strokewidth')
    this.#commands.push(this.#escape(value))

    return this
  }

  style(type: StyleType): this {
    this.#commands.push('-style')
    this.#commands.push(this.#escape(type))

    return this
  }

  virtualPixel(method: VirtualPixelType): this {
    this.#commands.push('-virtual-pixel')
    this.#commands.push(this.#escape(method))

    return this
  }

  swirl(degrees: number): this {
    this.#commands.push('-swirl')
    this.#commands.push(this.#escape(degrees))

    return this
  }

  texture(filename: string): this {
    this.#commands.push('-texture')
    this.#commands.push(this.#escape(filename))

    return this
  }

  threshold(percentage?: number): this {
    if (percentage === undefined) {
      this.#commands.push('+threshold')
    } else {
      this.#commands.push('-threshold')
      this.#commands.push(this.#escape(percentage) + "%")
    }

    return this
  }

  thumbnail(w?: number, h?: number): this {
    if (w || h) {
      this.#commands.push('-thumbnail')
      this.#commands.push(this.#escape(new Geometry().size(w, h).toString()))
    }

    return this
  }

  thumbnailExt(fn: (g: Geometry) => Geometry): this {
    const geometry = fn(new Geometry())

    this.#commands.push('-thumbnail')
    this.#commands.push(this.#escape(geometry.toString()))

    return this
  }

  tile(filename: string): this {
    this.#commands.push('-tile')
    this.#commands.push(this.#escape(filename))

    return this
  }

  tint(percentage: number): this {
    this.#commands.push('-tint')
    this.#commands.push(this.#escape(percentage) + '%')

    return this
  }

  transform(): this {
    this.#commands.push('-transform')

    return this
  }

  transparent(color: string): this {
    this.#commands.push('-transparent')
    this.#commands.push(this.#escape(color))

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
    this.#commands.push(this.#escape(value))

    return this
  }

  type(type: string): this {
    this.#commands.push('-type')
    this.#commands.push(this.#escape(type))

    return this
  }

  undercolor(color: string): this {
    this.#commands.push('-undercolor')
    this.#commands.push(this.#escape(color))

    return this
  }

  uniqueColors(): this {
    this.#commands.push('-unique-colors')

    return this
  }

  units(type: string): this {
    this.#commands.push('-units')
    this.#commands.push(this.#escape(type))

    return this
  }

  unsharp(radius: number = 0, sigma: number, amount: number, threshold: number): this {
    this.#commands.push('-unsharp')
    this.#commands.push(this.#escape(`${radius}x${sigma}+${amount}x${threshold}`))

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
    this.#commands.push(this.#escape(string))

    return this
  }
  */

  vignette(radius: number = 0, sigma: number, x?: number, y?: number): this {
    this.#commands.push('-vignette')

    let vignetteSpec = `${radius}x${sigma}`
    if (x !== undefined && y !== undefined) {
      vignetteSpec += `+${x}+${y}`
    }

    this.#commands.push(this.#escape(vignetteSpec))

    return this
  }

  wave(amplitude: number, wavelength: number): this {
    this.#commands.push('-wave')
    this.#commands.push(this.#escape(`${amplitude}x${wavelength}`))

    return this
  }

  weight(type: string): this {
    this.#commands.push('-weight')
    this.#commands.push(this.#escape(type))

    return this
  }

  whitePoint(x: number, y: number): this {
    this.#commands.push('-white-point')
    this.#commands.push(this.#escape(`${x},${y}`))

    return this
  }

  whiteThreshold(value: string): this {
    this.#commands.push('-white-threshold')
    this.#commands.push(this.#escape(value))

    return this
  }

  write(filename: string): this {
    this.#commands.push('-write')
    this.#commands.push(this.#escape(filename))

    return this
  }

  swap(index1: number, index2: number): this {
    this.#commands.push('-swap')
    this.#commands.push(this.#escape(`${index1},${index2}`))

    return this
  }

  #escape(data: unknown): string {
    const input = String(data)

    return input

    // TODO: Enable proper escaping when needed
    // if single safe word, return it
    // if (input.match(/^[\w+-]+$/)) {
    //   return input
    // }

    // return `'${input.replace(/\\/g, '\\\\').replace(/'/, '\\\'')}'`
  }

  #commands: (string | ImageMagickCommandBuilder)[] = []
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

  roundRectangle(x0: number, y0: number, x1: number, y1: number, wc: number, hc: number): this {
    this.#primitives.push(`roundRectangle ${x0},${y0} ${x1},${y1} ${wc},${hc}`)
    return this
  }

  arc(x0: number, y0: number, x1: number, y1: number, a0: number, a1: number): this {
    this.#primitives.push(`arc ${x0},${y0} ${x1},${y1} ${a0},${a1}`)
    return this
  }

  ellipse(x0: number, y0: number, rx: number, ry: number, a0: number, a1: number): this {
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

  image(operator: string, x0: number, y0: number, w: number, h: number, filename: string): this {
    this.#primitives.push(`image ${operator} ${x0},${y0} ${w},${h} '${filename}'`)
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
    return this.#primitives.join(' ')
  }
}

type GravityType = 'None' | 'Center' | 'East' | 'Forget' | 'NorthEast' | 'North' | 'NorthWest' | 'SouthEast' | 'South' | 'SouthWest' | 'West'
type FilterType = 'Bartlett' | 'Blackman' | 'Bohman' | 'Box' | 'Catrom' | 'Cosine' | 'Cubic' | 'Gaussian' | 'Hamming' | 'Hann' | 'Hermite' | 'Jinc' | 'Kaiser' | 'Lagrange' | 'Lanczos' | 'Lanczos2' | 'Lanczos2Sharp' | 'LanczosRadius' | 'LanczosSharp' | 'Mitchell' | 'Parzen' | 'Point' | 'Quadratic' | 'Robidoux' | 'RobidouxSharp' | 'Sinc' | 'SincFast' | 'Spline' | 'CubicSpline' | 'Triangle' | 'Welch'
type InterpolateType = 'Average' | 'Average4' | 'Average9' | 'Average16' | 'Background' | 'Bilinear' | 'Blend' | 'Catrom' | 'Integer' | 'Mesh' | 'Nearest' | 'Spline'
type AlphaType = 'Activate' | 'Associate' | 'Background' | 'Copy' | 'Deactivate' | 'Discrete' | 'Disassociate' | 'Extract' | 'Off' | 'On' | 'Opaque' | 'Remove' | 'Set' | 'Shape' | 'Transparent'
type ComposeType = 'Atop' | 'Blend' | 'Blur' | 'Bumpmap' | 'ChangeMask' | 'Clear' | 'ColorBurn' | 'ColorDodge' | 'Colorize' | 'CopyAlpha' | 'CopyBlack' | 'CopyBlue' | 'Copy' | 'CopyCyan' | 'CopyGreen' | 'CopyMagenta' | 'CopyRed' | 'CopyYellow' | 'Darken' | 'DarkenIntensity' | 'Difference' | 'Displace' | 'Dissolve' | 'Distort' | 'DivideDst' | 'DivideSrc' | 'DstAtop' | 'Dst' | 'DstIn' | 'DstOut' | 'DstOver' | 'Exclusion' | 'Freeze' | 'HardLight' | 'HardMix' | 'Hue' | 'In' | 'Intensity' | 'Interpolate' | 'LightenIntensity' | 'Lighten' | 'LinearBurn' | 'LinearDodge' | 'LinearLight' | 'Luminize' | 'Mathematics' | 'MinusDst' | 'MinusSrc' | 'Modulate' | 'ModulusAdd' | 'ModulusSubtract' | 'Multiply' | 'Negate' | 'None' | 'Out' | 'Overlay' | 'Over' | 'PegtopLight' | 'PinLight' | 'Plus' | 'Reflect' | 'Replace' | 'RMSE' | 'Saturate' | 'Screen' | 'SoftBurn' | 'SoftDodge' | 'SoftLight' | 'SrcAtop' | 'SrcIn' | 'SrcOut' | 'SrcOver' | 'Src' | 'Stamp' | 'Stereo' | 'VividLight' | 'Xor'
type DirectionType = 'left-to-right' | 'right-to-left'
type DisposeType = 'Background' | 'None' | 'Previous'
type DistortType = 'Affine' | 'AffineProjection' | 'Arc' | 'Barrel' | 'BilinearForward' | 'BilinearReverse' | 'DePolar' | 'Perspective' | 'PerspectiveProjection' | 'Polar' | 'Polynomial' | 'Resize' | 'Rotate' | 'ScaleRotateTranslate' | 'Shepards'
type DitherType = 'FloydSteinberg' | 'Riemersma' | 'None'
type DebugType = 'All' | 'Accelerate' | 'Annotate' | 'Blob' | 'Cache' | 'Coder' | 'Configure' | 'Deprecate' | 'Exception' | 'Locale' | 'None' | 'Render' | 'Resource' | 'Security' | 'TemporaryFile' | 'Trace' | 'Transform' | 'User' | 'X11'
type ColorspaceType = 'CMY' | 'CMYK' | 'Gray' | 'HCL' | 'HCLp' | 'HSB' | 'HSI' | 'HSL' | 'HSV' | 'HWB' | 'Lab' | 'LCH' | 'LCHab' | 'LCHuv' | 'LMS' | 'Log' | 'Luv' | 'OHTA' | 'Rec601YCbCr' | 'Rec709YCbCr' | 'RGB' | 'scRGB' | 'sRGB' | 'Transparent' | 'XYZ' | 'YCbCr' | 'YCC' | 'YDbDr' | 'YIQ' | 'YPbPr' | 'YUV'
type CompressType = 'B44' | 'B44A' | 'BZip' | 'DXT1' | 'DXT3' | 'DXT5' | 'Fax' | 'Group4' | 'JBIG1' | 'JBIG2' | 'JPEG' | 'JPEG2000' | 'Lossless' | 'LosslessJPEG' | 'LZMA' | 'LZW' | 'None' | 'Piz' | 'Pxr24' | 'RLE' | 'Zip' | 'ZipS'
type ChannelType = 'Red' | 'Green' | 'Blue' | 'Alpha' | 'Gray' | 'Cyan' | 'Magenta' | 'Yellow' | 'Black' | 'Opacity' | 'Index' | 'RGB' | 'RGBA' | 'CMYK' | 'CMYKA' | number
type GrayscaleType = 'average' | 'brightness' | 'lightness' | 'luma' | 'rec601luma' | 'rec709luma' | 'rms'
type EndianType = 'LSB' | 'MSB'
type EvaluateType = 'Add' | 'AddModulus' | 'And' | 'Cos' | 'Cosine' | 'Divide' | 'Exp' | 'Gaussian' | 'LeftShift' | 'Log' | 'Max' | 'Mean' | 'Median' | 'Min' | 'Multiply' | 'Or' | 'Pow' | 'RightShift' | 'RMS' | 'Set' | 'Sin' | 'Sine' | 'Subtract' | 'Sum' | 'Threshold' | 'ThresholdBlack' | 'ThresholdWhite' | 'Uniform' | 'Xor'
type FunctionType = 'Polynomial' | 'Sinusoid' | 'ArcSin' | 'ArcTan'
type IntentType = 'Absolute' | 'Perceptual' | 'Relative' | 'Saturation'
type InterlaceType = 'Line' | 'None' | 'Plane' | 'Partition' | 'JPEG' | 'GIF' | 'PNG'
type LayersType = 'coalesce' | 'compare-any' | 'compare-clear' | 'compare-overlay' | 'composite' | 'dispose' | 'flatten' | 'merge' | 'mosaic' | 'optimize' | 'optimize-frame' | 'optimize-plus' | 'optimize-trans' | 'remove-dups' | 'remove-zero'
type LimitType = 'disk' | 'file' | 'map' | 'memory' | 'thread' | 'throttle' | 'time'
type MorphologyType = 'Convolve' | 'Correlate' | 'Erode' | 'Dilate' | 'ErodeIntensity' | 'DilateIntensity' | 'Distance' | 'Open' | 'Close' | 'OpenIntensity' | 'CloseIntensity' | 'Smooth' | 'EdgeIn' | 'EdgeOut' | 'Edge' | 'TopHat' | 'BottomHat' | 'HitAndMiss' | 'Thinning' | 'Thicken'
type NoiseType = 'Gaussian' | 'Impulse' | 'Laplacian' | 'Multiplicative' | 'Poisson' | 'Random' | 'Uniform'
type OrientType = 'TopLeft' | 'TopRight' | 'BottomRight' | 'BottomLeft' | 'LeftTop' | 'RightTop' | 'RightBottom' | 'LeftBottom'
type PreviewType = 'Rotate' | 'Roll' | 'Hue' | 'Saturation' | 'Brightness' | 'Gamma' | 'Spiff' | 'Dull' | 'Grayscale' | 'Quantize' | 'Despeckle' | 'ReduceNoise' | 'AddNoise' | 'Sharpen' | 'Blur' | 'Threshold' | 'EdgeDetect' | 'Spread' | 'Solarize' | 'Shade' | 'Raise' | 'Segment' | 'Swirl' | 'Implode' | 'Wave' | 'OilPaint' | 'Charcoal' | 'JPEG'
type StatisticType = 'Gradient' | 'Maximum' | 'Mean' | 'Median' | 'Minimum' | 'Mode' | 'Nonpeak' | 'RootMeanSquare' | 'StandardDeviation'
type StretchType = 'Any' | 'Condensed' | 'Expanded' | 'ExtraCondensed' | 'ExtraExpanded' | 'Normal' | 'SemiCondensed' | 'SemiExpanded' | 'UltraCondensed' | 'UltraExpanded'
type StyleType = 'Any' | 'Italic' | 'Normal' | 'Oblique'
type VirtualPixelType = 'Background' | 'Black' | 'CheckerTile' | 'Dither' | 'Edge' | 'Gray' | 'HorizontalTile' | 'HorizontalTileEdge' | 'Mirror' | 'None' | 'Random' | 'Tile' | 'Transparent' | 'VerticalTile' | 'VerticalTileEdge' | 'White'
type DrawGravityType = Omit<GravityType, 'None' | 'Forget'>
