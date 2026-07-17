import type { DrawMethodType, GravityType } from './predefines.ts'

export class Draw {
  #primitives: string[] = []

  e(data: unknown): string {
    const str = String(data)

    if (str.match(/^[\d\w,.]+$/)) {
      return str
    }

    return str.replace(/\\/g, '\\\\\\\\').replace(/"/g, '\\\\"')
  }

  point(x: number, y: number): this {
    this.#primitives.push(`point ${this.e(x)},${this.e(y)}`)
    return this
  }

  line(x0: number, y0: number, x1: number, y1: number): this {
    this.#primitives.push(`line ${this.e(x0)},${this.e(y0)} ${this.e(x1)},${this.e(y1)}`)
    return this
  }

  rectangle(x0: number, y0: number, x1: number, y1: number): this {
    this.#primitives.push(`rectangle ${this.e(x0)},${this.e(y0)} ${this.e(x1)},${this.e(y1)}`)
    return this
  }

  roundRectangle(x0: number, y0: number, x1: number, y1: number, wc: number, hc: number): this {
    this.#primitives.push(
      `roundRectangle ${this.e(x0)},${this.e(y0)} ${this.e(x1)},${this.e(y1)} ${this.e(wc)},${this.e(hc)}`
    )
    return this
  }

  arc(x0: number, y0: number, x1: number, y1: number, a0: number, a1: number): this {
    this.#primitives.push(`arc ${this.e(x0)},${this.e(y0)} ${this.e(x1)},${this.e(y1)} ${this.e(a0)},${this.e(a1)}`)
    return this
  }

  ellipse(x0: number, y0: number, rx: number, ry: number, a0: number, a1: number): this {
    this.#primitives.push(`ellipse ${this.e(x0)},${this.e(y0)} ${this.e(rx)},${this.e(ry)} ${this.e(a0)},${this.e(a1)}`)
    return this
  }

  circle(x0: number, y0: number, x1: number, y1: number): this {
    this.#primitives.push(`circle ${this.e(x0)},${this.e(y0)} ${this.e(x1)},${this.e(y1)}`)
    return this
  }

  polyline(...points: [number, number][]): this {
    const pointStr = points.map(([x, y]) => `${this.e(x)},${this.e(y)}`).join(' ')
    this.#primitives.push(`polyline ${this.e(pointStr)}`)
    return this
  }

  polygon(...points: [number, number][]): this {
    const pointStr = points.map(([x, y]) => `${this.e(x)},${this.e(y)}`).join(' ')
    this.#primitives.push(`polygon ${this.e(pointStr)}`)
    return this
  }

  bezier(...points: [number, number][]): this {
    const pointStr = points.map(([x, y]) => `${this.e(x)},${this.e(y)}`).join(' ')
    this.#primitives.push(`bezier ${this.e(pointStr)}`)
    return this
  }

  path(specification: string): this {
    this.#primitives.push(`path "${this.e(specification)}"`)
    return this
  }

  image(operator: string, x0: number, y0: number, w: number, h: number, filename: string): this {
    this.#primitives.push(
      `image ${this.e(operator)} ${this.e(x0)},${this.e(y0)} ${this.e(w)},${this.e(h)} "${this.e(filename)}"`
    )
    return this
  }

  text(x0: number, y0: number, string: string): this {
    this.#primitives.push(`text ${this.e(x0)},${this.e(y0)} "${this.e(string)}"`)
    return this
  }

  gravity(direction: GravityType): this {
    this.#primitives.push(`gravity ${this.e(direction)}`)
    return this
  }

  rotate(degrees: number): this {
    this.#primitives.push(`rotate ${this.e(degrees)}`)
    return this
  }

  translate(dx: number, dy: number): this {
    this.#primitives.push(`translate ${this.e(dx)},${this.e(dy)}`)
    return this
  }

  scale(sx: number, sy: number): this {
    this.#primitives.push(`scale ${this.e(sx)},${this.e(sy)}`)
    return this
  }

  skewX(degrees: number): this {
    this.#primitives.push(`skewX ${this.e(degrees)}`)
    return this
  }

  skewY(degrees: number): this {
    this.#primitives.push(`skewY ${this.e(degrees)}`)
    return this
  }

  color(x0: number, y0: number, method: DrawMethodType): this {
    this.#primitives.push(`color ${this.e(x0)},${this.e(y0)} ${this.e(method)}`)
    return this
  }

  alpha(x0: number, y0: number, method: DrawMethodType): this {
    this.#primitives.push(`alpha ${this.e(x0)},${this.e(y0)} ${this.e(method)}`)
    return this
  }

  /** @deprecated imagemagick 7 rejects the `matte` primitive; use `.alpha(...)` instead */
  matte(x0: number, y0: number, method: DrawMethodType): this {
    this.#primitives.push(`matte ${this.e(x0)},${this.e(y0)} ${this.e(method)}`)
    return this
  }

  toString(): string {
    return this.#primitives.join(' ')
  }
}
