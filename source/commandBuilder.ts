import { Draw } from './draw.ts'
import { Geometry } from './geometry.ts'
import type {
  AlphaType,
  AutoThresholdType,
  ChannelType,
  ColorspaceType,
  ComplexOperatorType,
  ComposeType,
  CompressType,
  DebugType,
  DirectionType,
  DisposeType,
  DistortType,
  DitherType,
  EndianType,
  EvaluateType,
  FilterType,
  FontWeightType,
  FunctionType,
  GravityType,
  GrayscaleType,
  IlluminantType,
  ImageType,
  IntensityType,
  IntentType,
  InterlaceType,
  InterpolateType,
  LayersType,
  LimitType,
  ListType,
  MetricType,
  MorphologyType,
  NoiseType,
  NumberOrPercent,
  OrientType,
  PreviewType,
  SparseColorMethodType,
  StatisticType,
  StretchType,
  StyleType,
  UnitsType,
  VirtualPixelType,
  WordBreakType,
} from './predefines.ts'

export { CommandBuilder }

class CommandBuilder {
  constructor(resource?: string | Buffer) {
    if (resource) {
      this.resource(resource)
    }
  }

  args(): string[] {
    const a: string[] = []
    let fd = FIRST_BUFFER_FD
    for (const part of this.#flattenedCommands()) {
      if (Buffer.isBuffer(part)) {
        a.push(`fd:${fd}`)
        fd += 1
      } else if (part instanceof Geometry || part instanceof Draw) {
        a.push(part.toString())
      } else {
        a.push(String(part))
      }
    }

    return a
  }

  buffers(): Buffer[] {
    const buffers: Buffer[] = []
    for (const part of this.#flattenedCommands()) {
      if (Buffer.isBuffer(part)) {
        buffers.push(part)
      }
    }

    return buffers
  }

  *#flattenedCommands(): Generator<string | number | Geometry | Draw | Buffer> {
    for (const part of this.#commands) {
      if (part instanceof CommandBuilder) {
        yield* part.#flattenedCommands()
      } else {
        yield part
      }
    }
  }

  command(...commands: (string | number)[]): this {
    this.#commands.push(...commands.map(String))

    return this
  }

  resource(input: string | Buffer): this {
    this.#commands.push(input)

    return this
  }

  xc(): this
  xc(color: string): this
  xc(size: number): this
  xc(width: number, height: number): this
  xc(color: string, size: number): this
  xc(color: string, width: number, height: number): this
  xc(colorOrWidth?: string | number | undefined, widthOrHeight?: number, height?: number): this {
    return this.#canvas('xc', colorOrWidth, widthOrHeight, height)
  }

  canvas(): this
  canvas(color: string): this
  canvas(size: number): this
  canvas(width: number, height: number): this
  canvas(color: string, size: number): this
  canvas(color: string, width: number, height: number): this
  canvas(colorOrWidth?: string | number | undefined, widthOrHeight?: number, height?: number): this {
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
      if (sizeParts.length === 2) {
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

  geometry(x: number, y: number): this
  geometry(fn: (g: Geometry) => Geometry): this
  geometry(...args: [x: number, y: number] | [fn: (g: Geometry) => Geometry]): this {
    this.#commands.push('-geometry')
    if (args.length === 1) {
      this.#commands.push(args[0](new Geometry()))
    } else {
      const [x, y] = args
      this.#commands.push(new Geometry().offset(x, y))
    }
    return this
  }

  size(w?: number, h?: number): this {
    if (w === undefined && h === undefined) {
      this.#commands.push('+size')
    } else {
      this.#commands.push('-size')
      this.#commands.push(new Geometry().size(w, h))
    }

    return this
  }

  clone(...indexes: number[]): CommandBuilder {
    if (indexes.length > 0) {
      this.#commands.push('-clone')
      this.#commands.push(indexes.join(','))
    } else {
      this.#commands.push('+clone')
    }

    return this
  }

  extent(w: number, h: number): this
  extent(fn: (g: Geometry) => Geometry): this
  extent(wOrFn: number | ((g: Geometry) => Geometry), h?: number): this {
    this.#commands.push('-extent')
    if (typeof wOrFn === 'function') {
      this.#commands.push(wOrFn(new Geometry()))
    } else {
      this.#commands.push(new Geometry().size(wOrFn, h))
    }
    return this
  }

  resize(w?: number, h?: number): this
  resize(fn: (g: Geometry) => Geometry): this
  resize(wOrFn?: number | ((g: Geometry) => Geometry), h?: number): this {
    if (typeof wOrFn === 'function') {
      this.#commands.push('-resize')
      this.#commands.push(wOrFn(new Geometry()))
    } else if (wOrFn !== undefined || h !== undefined) {
      this.#commands.push('-resize')
      this.#commands.push(new Geometry().size(wOrFn, h))
    }
    return this
  }

  crop(w: number, h: number, x?: number, y?: number): this
  crop(fn: (g: Geometry) => Geometry): this
  crop(wOrFn: number | ((g: Geometry) => Geometry), h?: number, x?: number, y?: number): this {
    this.#commands.push('-crop')
    if (typeof wOrFn === 'function') {
      this.#commands.push(wOrFn(new Geometry()))
    } else {
      const geo = new Geometry().size(wOrFn, h)
      if (x !== undefined && y !== undefined) {
        geo.offset(x, y)
      }
      this.#commands.push(geo)
    }
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
      this.#commands.push(`${radius}x${sigma}`)
    } else {
      this.#commands.push(radius)
    }

    return this
  }

  sharpen(radius: number = 0, sigma?: number): this {
    this.#commands.push('-sharpen')

    if (sigma !== undefined) {
      this.#commands.push(`${radius}x${sigma}`)
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
    if (size !== undefined) {
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

  adaptiveResize(w?: number, h?: number): this
  adaptiveResize(fn: (g: Geometry) => Geometry): this
  adaptiveResize(wOrFn?: number | ((g: Geometry) => Geometry), h?: number): this {
    if (typeof wOrFn === 'function') {
      this.#commands.push('-adaptive-resize')
      this.#commands.push(wOrFn(new Geometry()))
    } else if (wOrFn !== undefined || h !== undefined) {
      this.#commands.push('-adaptive-resize')
      this.#commands.push(new Geometry().size(wOrFn, h))
    }
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

  colorize(percent: number): this
  colorize(red: number, green: number, blue: number): this
  colorize(...args: [percent: number] | [red: number, green: number, blue: number]): this {
    this.#commands.push('-colorize')

    if (args.length === 1) {
      this.#commands.push(args[0])
    } else {
      const [red, green, blue] = args
      this.#commands.push(`${red},${green},${blue}`)
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

  /** @deprecated `-affine` is deprecated in ImageMagick. use `.distort('AffineProjection', ...)` instead. */
  affine(sx: number, rx: number, ry: number, sy: number, tx?: number, ty?: number): this {
    this.#commands.push('-affine')

    if (tx !== undefined && ty !== undefined) {
      this.#commands.push(`${sx},${rx},${ry},${sy},${tx},${ty}`)
    } else {
      this.#commands.push(`${sx},${rx},${ry},${sy}`)
    }

    return this
  }

  annotate(degrees: number, text: string): this
  annotate(fn: (g: Geometry) => Geometry, text: string): this
  annotate(degreesOrFn: number | ((g: Geometry) => Geometry), text: string): this {
    this.#commands.push('-annotate')
    if (typeof degreesOrFn === 'function') {
      this.#commands.push(degreesOrFn(new Geometry()))
    } else {
      this.#commands.push(degreesOrFn)
    }
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

  bias(value: NumberOrPercent): this {
    this.#commands.push('-bias')
    this.#commands.push(value)

    return this
  }

  blackThreshold(value: NumberOrPercent): this {
    this.#commands.push('-black-threshold')
    this.#commands.push(value)

    return this
  }

  border(width: NumberOrPercent, height?: NumberOrPercent): this {
    this.#commands.push('-border')

    if (height !== undefined) {
      this.#commands.push(`${width}x${height}`)
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
      this.#commands.push(new Geometry().size(x, y))
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

  brightnessContrast(brightness: NumberOrPercent, contrast?: NumberOrPercent): this {
    this.#commands.push('-brightness-contrast')
    this.#commands.push(contrast === undefined ? brightness : `${brightness}x${contrast}`)

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

  chop(width: number, height: number, x?: number, y?: number): this
  chop(fn: (g: Geometry) => Geometry): this
  chop(wOrFn: number | ((g: Geometry) => Geometry), h?: number, x?: number, y?: number): this {
    this.#commands.push('-chop')
    if (typeof wOrFn === 'function') {
      this.#commands.push(wOrFn(new Geometry()))
    } else {
      const geo = new Geometry().size(wOrFn, h)
      if (x !== undefined && y !== undefined) {
        geo.offset(x, y)
      }
      this.#commands.push(geo)
    }
    return this
  }

  compress(type: CompressType): this {
    this.#commands.push('-compress')
    this.#commands.push(type)

    return this
  }

  contrastStretch(blackPoint: NumberOrPercent, whitePoint?: NumberOrPercent): this {
    this.#commands.push('-contrast-stretch')
    this.#commands.push(whitePoint === undefined ? String(blackPoint) : `${blackPoint}x${whitePoint}`)

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

  /** `metadataOnly: true` emits `+gamma`, which records the gamma level without changing pixel values */
  gamma(value: number, metadataOnly?: boolean): this {
    this.#commands.push(metadataOnly === true ? '+gamma' : '-gamma')
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

  /** @deprecated `-median` is deprecated in ImageMagick. use `.statistic('Median', width, height)` instead. */
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

  define(key: string, value?: string | number): this {
    this.#commands.push('-define')
    this.#commands.push(value === undefined ? key : `${key}=${value}`)

    return this
  }

  /** `+define key` removes an existing definition; pass `'*'` to remove all */
  undefine(key: string): this {
    this.#commands.push('+define')
    this.#commands.push(key)

    return this
  }

  delay(ticks: number, modifier?: '>' | '<'): this
  delay(ticks: number, ticksPerSecond: number, modifier?: '>' | '<'): this
  delay(ticks: number, tpsOrModifier?: number | '>' | '<', modifier?: '>' | '<'): this {
    this.#commands.push('-delay')

    let spec = `${ticks}`
    if (typeof tpsOrModifier === 'number') {
      spec += `x${tpsOrModifier}`
      if (modifier) {
        spec += modifier
      }
    } else if (tpsOrModifier) {
      spec += tpsOrModifier
    }
    this.#commands.push(spec)

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

  /** `bestFit: true` emits `+distort`, which sizes the output to fit the distorted image instead of the input canvas */
  distort(type: DistortType, args: string, bestFit?: boolean): this {
    this.#commands.push(bestFit === true ? '+distort' : '-distort')
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

  draw(fn: (draw: Draw) => Draw): this {
    this.#commands.push('-draw')

    const drawBuilder = fn(new Draw())
    this.#commands.push(drawBuilder)

    return this
  }

  /** without arguments, emits `+duplicate`, which copies the last image in the sequence */
  duplicate(): this
  duplicate(count: number, ...indexes: number[]): this
  duplicate(count?: number, ...indexes: number[]): this {
    if (count === undefined) {
      this.#commands.push('+duplicate')
    } else {
      this.#commands.push('-duplicate')
      if (indexes.length > 0) {
        this.#commands.push(`${count},${indexes.join(',')}`)
      } else {
        this.#commands.push(count)
      }
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

  evaluate(operator: EvaluateType, value: NumberOrPercent): this {
    this.#commands.push('-evaluate')
    this.#commands.push(operator)
    this.#commands.push(value)

    return this
  }

  extract(geometry: string): this
  extract(fn: (g: Geometry) => Geometry): this
  extract(geoOrFn: string | ((g: Geometry) => Geometry)): this {
    this.#commands.push('-extract')
    if (typeof geoOrFn === 'function') {
      this.#commands.push(geoOrFn(new Geometry()))
    } else {
      this.#commands.push(geoOrFn)
    }
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

  frame(width: NumberOrPercent, height?: NumberOrPercent, outerBevel?: number, innerBevel?: number): this {
    this.#commands.push('-frame')

    let spec = `${width}`
    if (height !== undefined) {
      spec += `x${height}`
    }
    if (outerBevel !== undefined) {
      spec += signedOffset(outerBevel)
      if (innerBevel !== undefined) {
        spec += signedOffset(innerBevel)
      }
    }

    this.#commands.push(spec)

    return this
  }

  fuzz(distance: NumberOrPercent): this {
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

  lat(width: number, height: number, offset?: NumberOrPercent): this {
    this.#commands.push('-lat')
    this.#commands.push(offset === undefined ? `${width}x${height}` : `${width}x${height}${signedOffset(offset)}`)

    return this
  }

  layers(method: LayersType): this {
    this.#commands.push('-layers')
    this.#commands.push(method)

    return this
  }

  level(blackPoint: NumberOrPercent, whitePoint: NumberOrPercent, gamma?: number): this {
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

  linearStretch(blackPoint: NumberOrPercent, whitePoint?: NumberOrPercent): this {
    this.#commands.push('-linear-stretch')
    this.#commands.push(whitePoint === undefined ? String(blackPoint) : `${blackPoint}x${whitePoint}`)

    return this
  }

  liquidRescale(width: number, height?: number, deltaX?: number, rigidity?: number): this
  liquidRescale(fn: (g: Geometry) => Geometry): this
  liquidRescale(
    widthOrFn: number | ((g: Geometry) => Geometry),
    height?: number,
    deltaX?: number,
    rigidity?: number
  ): this {
    this.#commands.push('-liquid-rescale')
    if (typeof widthOrFn === 'function') {
      this.#commands.push(widthOrFn(new Geometry()))
    } else {
      let rescaleSpec = `${widthOrFn}`
      if (height !== undefined) {
        rescaleSpec += `x${height}`
        if (deltaX !== undefined) {
          rescaleSpec += signedOffset(deltaX)
          if (rigidity !== undefined) {
            rescaleSpec += signedOffset(rigidity)
          }
        }
      }
      this.#commands.push(rescaleSpec)
    }
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

  morphology(method: MorphologyType, kernel: string, iterations?: number): this {
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

  motionBlur(radius: number = 0, sigma?: number, angle?: number): this {
    this.#commands.push('-motion-blur')
    let spec = `${radius}`
    if (sigma !== undefined) {
      spec += `x${sigma}`
    }
    if (angle !== undefined) {
      spec += signedOffset(angle)
    }
    this.#commands.push(spec)

    return this
  }

  /**
   * `-noise radius` reduces noise using the given neighborhood radius.
   * @deprecated `-noise radius` is replaced in ImageMagick. use `.statistic('NonPeak', width, height)` instead.
   */
  noise(radius: number): this
  /** `+noise type` adds noise of the given type */
  noise(type: NoiseType): this
  noise(radiusOrType: number | NoiseType): this {
    if (typeof radiusOrType === 'number') {
      this.#commands.push('-noise')
    } else {
      this.#commands.push('+noise')
    }
    this.#commands.push(radiusOrType)

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

  page(): this
  page(geometry: string): this
  page(fn: (g: Geometry) => Geometry): this
  page(geoOrFn?: string | ((g: Geometry) => Geometry)): this {
    if (typeof geoOrFn === 'function') {
      this.#commands.push('-page')
      this.#commands.push(geoOrFn(new Geometry()))
    } else if (geoOrFn !== undefined) {
      this.#commands.push('-page')
      this.#commands.push(geoOrFn)
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

  /** without an angle, emits `+polaroid`, which picks a random rotation */
  polaroid(angle?: number): this {
    if (angle === undefined) {
      this.#commands.push('+polaroid')
    } else {
      this.#commands.push('-polaroid')
      this.#commands.push(angle)
    }

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

  /** with `remove`, emits `+profile name` where name may be a glob like `'!icc,*'` or `'*'` */
  profile(filename: string, remove?: boolean): this {
    this.#commands.push(remove === true ? '+profile' : '-profile')
    this.#commands.push(filename)

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
      this.#commands.push(new Geometry().size(width, height))
    } else {
      this.#commands.push(width)
    }

    return this
  }

  randomThreshold(low: NumberOrPercent, high: NumberOrPercent): this {
    this.#commands.push('-random-threshold')
    this.#commands.push(`${low},${high}`)

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

  repage(): this
  repage(geometry: string): this
  repage(fn: (g: Geometry) => Geometry): this
  repage(geoOrFn?: string | ((g: Geometry) => Geometry)): this {
    if (typeof geoOrFn === 'function') {
      this.#commands.push('-repage')
      this.#commands.push(geoOrFn(new Geometry()))
    } else if (geoOrFn !== undefined) {
      this.#commands.push('-repage')
      this.#commands.push(geoOrFn)
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
    this.#commands.push(new Geometry().offset(x, y))

    return this
  }

  sample(w?: number, h?: number): this
  sample(fn: (g: Geometry) => Geometry): this
  sample(wOrFn?: number | ((g: Geometry) => Geometry), h?: number): this {
    if (typeof wOrFn === 'function') {
      this.#commands.push('-sample')
      this.#commands.push(wOrFn(new Geometry()))
    } else if (wOrFn !== undefined || h !== undefined) {
      this.#commands.push('-sample')
      this.#commands.push(new Geometry().size(wOrFn, h))
    }
    return this
  }

  samplingFactor(factors: string): this {
    this.#commands.push('-sampling-factor')
    this.#commands.push(factors)

    return this
  }

  scale(w?: number, h?: number): this
  scale(fn: (g: Geometry) => Geometry): this
  scale(wOrFn?: number | ((g: Geometry) => Geometry), h?: number): this {
    if (typeof wOrFn === 'function') {
      this.#commands.push('-scale')
      this.#commands.push(wOrFn(new Geometry()))
    } else if (wOrFn !== undefined || h !== undefined) {
      this.#commands.push('-scale')
      this.#commands.push(new Geometry().size(wOrFn, h))
    }
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

  segment(cluster: number, smoothing?: number): this {
    this.#commands.push('-segment')
    this.#commands.push(smoothing === undefined ? `${cluster}` : `${cluster}x${smoothing}`)

    return this
  }

  selectiveBlur(radius: number = 0, sigma?: number, threshold?: NumberOrPercent): this {
    this.#commands.push('-selective-blur')
    let spec = `${radius}`
    if (sigma !== undefined) {
      spec += `x${sigma}`
    }
    if (threshold !== undefined) {
      spec += signedOffset(threshold)
    }
    this.#commands.push(spec)

    return this
  }

  separate(): this {
    this.#commands.push('-separate')

    return this
  }

  sepiaTone(threshold: NumberOrPercent): this {
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

  shade(azimuth: number, elevation: number): this {
    this.#commands.push('-shade')
    this.#commands.push(`${azimuth}x${elevation}`)

    return this
  }

  shadow(opacity: number, sigma?: number, x?: number, y?: number): this {
    this.#commands.push('-shadow')
    let spec = `${opacity}`
    if (sigma !== undefined) {
      spec += `x${sigma}`
    }
    if (x !== undefined && y !== undefined) {
      spec += `${signedOffset(x)}${signedOffset(y)}`
    }
    this.#commands.push(spec)

    return this
  }

  shave(width: NumberOrPercent, height: NumberOrPercent): this {
    this.#commands.push('-shave')
    this.#commands.push(`${width}x${height}`)

    return this
  }

  /** when yDegrees is omitted, imagemagick defaults it to xDegrees */
  shear(xDegrees: number, yDegrees?: number): this {
    this.#commands.push('-shear')
    this.#commands.push(yDegrees === undefined ? xDegrees : `${xDegrees}x${yDegrees}`)

    return this
  }

  /** `sharpen: false` emits `+sigmoidal-contrast`, which decreases contrast instead of increasing it */
  sigmoidalContrast(contrast: number, midpoint: NumberOrPercent, sharpen?: boolean): this {
    if (sharpen === false) {
      this.#commands.push('+sigmoidal-contrast')
    } else {
      this.#commands.push('-sigmoidal-contrast')
    }
    this.#commands.push(`${contrast}x${midpoint}`)

    return this
  }

  sketch(radius: number = 0, sigma?: number, angle?: number): this {
    this.#commands.push('-sketch')
    let spec = `${radius}`
    if (sigma !== undefined) {
      spec += `x${sigma}`
    }
    if (angle !== undefined) {
      spec += signedOffset(angle)
    }
    this.#commands.push(spec)

    return this
  }

  smush(offset: number, horizontal?: boolean): this {
    if (horizontal === true) {
      this.#commands.push('+smush')
    } else {
      this.#commands.push('-smush')
    }
    this.#commands.push(offset)

    return this
  }

  solarize(threshold: NumberOrPercent): this {
    this.#commands.push('-solarize')
    this.#commands.push(threshold)

    return this
  }

  splice(width: number, height: number, x: number, y: number): this
  splice(fn: (g: Geometry) => Geometry): this
  splice(...args: [width: number, height: number, x: number, y: number] | [fn: (g: Geometry) => Geometry]): this {
    this.#commands.push('-splice')
    if (args.length === 1) {
      this.#commands.push(args[0](new Geometry()))
    } else {
      const [width, height, x, y] = args
      this.#commands.push(new Geometry().size(width, height).offset(x, y))
    }
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

  threshold(value?: NumberOrPercent): this {
    if (value === undefined) {
      this.#commands.push('+threshold')
    } else {
      this.#commands.push('-threshold')
      this.#commands.push(value)
    }

    return this
  }

  thumbnail(w?: number, h?: number): this
  thumbnail(fn: (g: Geometry) => Geometry): this
  thumbnail(wOrFn?: number | ((g: Geometry) => Geometry), h?: number): this {
    if (typeof wOrFn === 'function') {
      this.#commands.push('-thumbnail')
      this.#commands.push(wOrFn(new Geometry()))
    } else if (wOrFn !== undefined || h !== undefined) {
      this.#commands.push('-thumbnail')
      this.#commands.push(new Geometry().size(wOrFn, h))
    }
    return this
  }

  tile(filename: string): this {
    this.#commands.push('-tile')
    this.#commands.push(filename)

    return this
  }

  tint(value: NumberOrPercent): this {
    this.#commands.push('-tint')
    this.#commands.push(value)
    return this
  }

  /** @deprecated `-transform` is replaced in ImageMagick. use `.distort('AffineProjection', ...)` instead. */
  transform(): this {
    this.#commands.push('-transform')

    return this
  }

  /** `invert: true` emits `+transparent`, making every pixel NOT matching the color transparent */
  transparent(color: string, invert?: boolean): this {
    this.#commands.push(invert === true ? '+transparent' : '-transparent')
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

  type(type: ImageType): this {
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

  units(type: UnitsType): this {
    this.#commands.push('-units')
    this.#commands.push(type)

    return this
  }

  unsharp(radius: number = 0, sigma?: number, gain?: number, threshold?: number): this {
    this.#commands.push('-unsharp')
    let spec = `${radius}`
    if (sigma !== undefined) {
      spec += `x${sigma}`
    }
    if (gain !== undefined) {
      spec += signedOffset(gain)
      if (threshold !== undefined) {
        spec += signedOffset(threshold)
      }
    }
    this.#commands.push(spec)

    return this
  }

  verbose(enable?: boolean): this {
    if (enable === false) {
      this.#commands.push('+verbose')
    } else {
      this.#commands.push('-verbose')
    }

    return this
  }

  version(): this {
    this.#commands.push('-version')

    return this
  }

  vignette(radius: number = 0, sigma?: number, x?: NumberOrPercent, y?: NumberOrPercent): this {
    this.#commands.push('-vignette')

    let spec = `${radius}`
    if (sigma !== undefined) {
      spec += `x${sigma}`
    }
    if (x !== undefined && y !== undefined) {
      spec += `${signedOffset(x)}${signedOffset(y)}`
    }

    this.#commands.push(spec)

    return this
  }

  wave(amplitude: number, wavelength?: number): this {
    this.#commands.push('-wave')
    this.#commands.push(wavelength === undefined ? `${amplitude}` : `${amplitude}x${wavelength}`)

    return this
  }

  weight(value: FontWeightType | number): this {
    this.#commands.push('-weight')
    this.#commands.push(value)

    return this
  }

  whitePoint(x: number, y: number): this {
    this.#commands.push('-white-point')
    this.#commands.push(`${x},${y}`)

    return this
  }

  whiteThreshold(value: NumberOrPercent): this {
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

  labelProperty(text: string): this {
    this.#commands.push('-label')
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

  wordBreak(type: WordBreakType): this {
    this.#commands.push('-word-break')
    this.#commands.push(type)

    return this
  }

  /** @deprecated `-matte` is deprecated in ImageMagick. use `.alpha('Set')` (or another alpha type) instead. */
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
    this.#commands.push(new Geometry().offset(x, y))

    return this
  }

  transparentColor(color: string): this {
    this.#commands.push('-transparent-color')
    this.#commands.push(color)

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

  canny(radius: number, sigma: number, lower?: NumberOrPercent, upper?: NumberOrPercent): this {
    this.#commands.push('-canny')
    if (lower !== undefined && upper !== undefined) {
      this.#commands.push(`${radius}x${sigma}${signedOffset(lower)}${signedOffset(upper)}`)
    } else {
      this.#commands.push(`${radius}x${sigma}`)
    }
    return this
  }

  cdl(filename: string): this {
    this.#commands.push('-cdl')
    this.#commands.push(filename)

    return this
  }

  clahe(width: NumberOrPercent, height: NumberOrPercent, tiles?: number, limit?: number): this
  clahe(fn: (g: Geometry) => Geometry): this
  clahe(
    widthOrFn: NumberOrPercent | ((g: Geometry) => Geometry),
    height?: NumberOrPercent,
    tiles?: number,
    limit?: number
  ): this {
    this.#commands.push('-clahe')
    if (typeof widthOrFn === 'function') {
      this.#commands.push(widthOrFn(new Geometry()))
    } else if (tiles !== undefined && limit !== undefined) {
      this.#commands.push(`${widthOrFn}x${height}${signedOffset(tiles)}${signedOffset(limit)}`)
    } else {
      this.#commands.push(`${widthOrFn}x${height}`)
    }
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

  connectedComponents(connectivity: 4 | 8): this {
    this.#commands.push('-connected-components')
    this.#commands.push(connectivity)

    return this
  }

  decipher(filename: string): this {
    this.#commands.push('-decipher')
    this.#commands.push(filename)

    return this
  }

  deskew(threshold: NumberOrPercent): this {
    this.#commands.push('-deskew')
    this.#commands.push(threshold)

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
    this.#commands.push(new Geometry().offset(x, y))
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
    let spec = `${width}x${height}`
    if (threshold !== undefined) {
      spec += signedOffset(threshold)
    }

    this.#commands.push('-hough-lines')
    this.#commands.push(spec)

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

  interpolativeResize(width: number, height?: number): this
  interpolativeResize(fn: (g: Geometry) => Geometry): this
  interpolativeResize(widthOrFn: number | ((g: Geometry) => Geometry), height?: number): this {
    this.#commands.push('-interpolative-resize')
    if (typeof widthOrFn === 'function') {
      this.#commands.push(widthOrFn(new Geometry()))
    } else if (height !== undefined) {
      this.#commands.push(`${widthOrFn}x${height}`)
    } else {
      this.#commands.push(widthOrFn)
    }
    return this
  }

  kmeans(colors: number, iterations?: number, tolerance?: number): this {
    this.#commands.push('-kmeans')
    let spec = `${colors}`
    if (iterations !== undefined) {
      spec += `x${iterations}`
    }
    if (tolerance !== undefined) {
      spec += signedOffset(tolerance)
    }
    this.#commands.push(spec)

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

  meanShift(width: number, height: number, distance: NumberOrPercent): this {
    this.#commands.push('-mean-shift')
    this.#commands.push(`${width}x${height}${signedOffset(distance)}`)

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

  rangeThreshold(
    lowBlack: NumberOrPercent,
    lowWhite: NumberOrPercent,
    highWhite: NumberOrPercent,
    highBlack: NumberOrPercent
  ): this {
    this.#commands.push('-range-threshold')
    this.#commands.push(`${lowBlack},${lowWhite},${highWhite},${highBlack}`)

    return this
  }

  region(width: number, height: number, x?: number, y?: number): this
  region(fn: (g: Geometry) => Geometry): this
  region(widthOrFn: number | ((g: Geometry) => Geometry), height?: number, x?: number, y?: number): this {
    this.#commands.push('-region')
    if (typeof widthOrFn === 'function') {
      this.#commands.push(widthOrFn(new Geometry()))
    } else {
      const geo = new Geometry().size(widthOrFn, height)
      if (x !== undefined && y !== undefined) {
        geo.offset(x, y)
      }
      this.#commands.push(geo)
    }
    return this
  }

  reshape(width: number, height: number): this {
    this.#commands.push('-reshape')
    this.#commands.push(new Geometry().size(width, height))

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

  waveletDenoise(threshold: NumberOrPercent): this {
    this.#commands.push('-wavelet-denoise')
    this.#commands.push(threshold)

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

  metric(type: MetricType): this {
    this.#commands.push('-metric')
    this.#commands.push(type)

    return this
  }

  highlightColor(color: string): this {
    this.#commands.push('-highlight-color')
    this.#commands.push(color)

    return this
  }

  lowlightColor(color: string): this {
    this.#commands.push('-lowlight-color')
    this.#commands.push(color)

    return this
  }

  complex(operator: ComplexOperatorType): this {
    this.#commands.push('-complex')
    this.#commands.push(operator)

    return this
  }

  copy(width: number, height: number, sourceX: number, sourceY: number, destX: number, destY: number): this
  copy(source: (g: Geometry) => Geometry, destination: (g: Geometry) => Geometry): this
  copy(
    ...args:
      | [width: number, height: number, sourceX: number, sourceY: number, destX: number, destY: number]
      | [source: (g: Geometry) => Geometry, destination: (g: Geometry) => Geometry]
  ): this {
    this.#commands.push('-copy')
    if (args.length === 2) {
      const [source, destination] = args
      this.#commands.push(source(new Geometry()))
      this.#commands.push(destination(new Geometry()))
    } else {
      const [width, height, sourceX, sourceY, destX, destY] = args
      this.#commands.push(new Geometry().size(width, height).offset(sourceX, sourceY))
      this.#commands.push(new Geometry().offset(destX, destY))
    }
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

  /** without indexes, emits `+delete`, which removes the last image in the sequence */
  delete(...indexes: number[]): this {
    if (indexes.length > 0) {
      this.#commands.push('-delete')
      this.#commands.push(indexes.join(','))
    } else {
      this.#commands.push('+delete')
    }

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

  #commands: (string | number | Geometry | CommandBuilder | Draw | Buffer)[] = []
}

/** fds 0-2 are stdin/stdout/stderr; buffers get the descriptors after those */
const FIRST_BUFFER_FD = 3

/**
 * formats a continuation value of an imagemagick argument (`WxH+a+b`):
 * `+` for zero/positive values, the value's own `-` for negatives
 */
function signedOffset(value: NumberOrPercent): string {
  const str = String(value)
  return str.startsWith('-') ? str : `+${str}`
}
