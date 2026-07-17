export type { GeometryFlag }
export { Geometry }

class Geometry {
  offset(x: number, y: number): this
  offset(): this
  offset(x?: number, y?: number): this {
    if (x === undefined && y === undefined) {
      this.#offset = undefined
    } else if (typeof x === 'number' && typeof y === 'number') {
      this.#offset = { x: Number(x), y: Number(y) }
    } else {
      throw Error(`Invalid parameters for offset '${x},${y}'`)
    }

    return this
  }

  /**
   * geometry flag appended to the size.
   *
   * - `'^'` / `'fill-area'`: cover the given size; one dimension may overflow
   * - `'!'` / `'exact'`: force the exact size, ignoring aspect ratio
   * - `'<'` / `'enlarge-only'`: only act on images smaller than the given size
   * - `'>'` / `'shrink-only'`: only act on images larger than the given size
   * - `'#'` / `'pad'`: add rows or columns to reach the given size or ratio
   */
  flag(flag: GeometryFlag): this {
    const char = GEOMETRY_FLAGS[flag]
    if (char === undefined) {
      // javascript callers are not stopped by the GeometryFlag union
      throw new Error(`Invalid flag '${flag}'`)
    }

    this.#flag = char

    return this
  }

  size(w: number | undefined, h: number | undefined): this
  size(): this
  size(w?: number | undefined, h?: number | undefined): this {
    // special case, setting both width and height to undefined resets size
    // todo(vladde): should this be the case?
    if (w === undefined && h === undefined) {
      this.#data = undefined
      return this
    }

    const data: GeometrySizeData = {
      type: 'size',
      width: w === undefined ? undefined : Number(w),
      height: h === undefined ? undefined : Number(h),
    }
    this.#data = data

    return this
  }

  scale(x: number, y?: number): this {
    const data: GeometryScaleData = {
      type: 'scale',
      x: Number(x),
      y: y === undefined ? undefined : Number(y),
    }
    this.#data = data

    return this
  }

  ratio(x: number, y: number): this {
    const data: GeometryRatioData = {
      type: 'ratio',
      x: Number(x),
      y: Number(y),
    }
    this.#data = data

    return this
  }

  area(area: number): this {
    const data: GeometryAreaData = {
      type: 'area',
      area: Number(area),
    }

    this.#data = data

    return this
  }

  toString(): string {
    const parts: string[] = []

    switch (this.#data?.type) {
      case 'size': {
        // size() clears #data when both are undefined, so at least one is set
        const { width, height } = this.#data
        if (height === undefined) {
          parts.push(`${width}`)
        } else {
          parts.push(`${width ?? ''}x${height}`)
        }
        break
      }
      case 'scale': {
        const { x, y } = this.#data
        const percentageString = [x, y]
          .filter(n => typeof n === 'number')
          .map(n => `${Number(n)}%`)
          .join('x')

        parts.push(percentageString)
        break
      }
      case 'ratio': {
        const { x, y } = this.#data

        parts.push(`${Number(x)}:${Number(y)}`)
        break
      }
      case 'area': {
        const area = this.#data.area

        parts.push(`${Number(area)}@`)
        break
      }
    }

    if (this.#flag) {
      parts.push(this.#flag)
    }

    if (this.#offset) {
      const { x, y } = this.#offset
      const formatOffsetNumber = (n: number) => (n >= 0 ? '+' : '-') + Math.abs(n)

      parts.push(`${formatOffsetNumber(x)}${formatOffsetNumber(y)}`)
    }

    return parts.join('')
  }

  #data: GeometryData | undefined = undefined
  #offset: { x: number; y: number } | undefined = undefined
  #flag: GeometryFlagChar | undefined = undefined
}

/** maps every accepted flag spelling (raw character or descriptive alias) to the character imagemagick expects */
const GEOMETRY_FLAGS = {
  '^': '^',
  '!': '!',
  '<': '<',
  '>': '>',
  '#': '#',
  'fill-area': '^',
  exact: '!',
  'enlarge-only': '<',
  'shrink-only': '>',
  pad: '#',
} as const

type GeometryFlag = keyof typeof GEOMETRY_FLAGS
type GeometryFlagChar = (typeof GEOMETRY_FLAGS)[GeometryFlag]

type GeometryData = GeometrySizeData | GeometryScaleData | GeometryRatioData | GeometryAreaData
type GeometrySizeData = {
  type: 'size'
  width: number | undefined
  height: number | undefined
}
type GeometryScaleData = {
  type: 'scale'
  x: number
  y: number | undefined
}
type GeometryRatioData = {
  type: 'ratio'
  x: number
  y: number
}
type GeometryAreaData = {
  type: 'area'
  area: number
}
