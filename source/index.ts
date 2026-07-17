import { CommandBuilder } from './commandBuilder.ts'

/** creates a fresh wand (command builder), optionally seeded with a first resource (file path, `rose:` style specifier, or Buffer) */
export const wand = (resource?: string | Buffer): CommandBuilder => new CommandBuilder(resource)

export { CommandBuilder } from './commandBuilder.ts'
export { Draw } from './draw.ts'
export type { GeometryFlag } from './geometry.ts'
export { Geometry } from './geometry.ts'
export type * from './predefines.ts'
export type { RunOptions } from './run.ts'
export { ImageMagickError, run } from './run.ts'
