import { ImageMagickCommandBuilder } from './commandBuilder.ts'

export default (resource?: string): ImageMagickCommandBuilder => new ImageMagickCommandBuilder(resource)
export { ImageMagickCommandBuilder } from './commandBuilder.ts'
