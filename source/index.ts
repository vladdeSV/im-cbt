import { ImageMagickCommandBuilder } from './commandBuilder'

export default (resource?: string): ImageMagickCommandBuilder => new ImageMagickCommandBuilder(resource)
export { ImageMagickCommandBuilder } from './commandBuilder'
