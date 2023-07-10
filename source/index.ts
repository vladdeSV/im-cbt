import { ImageMagickCommandBuilder } from './commandBuilder'

export default (resource?: string): ImageMagickCommandBuilder => new ImageMagickCommandBuilder(resource)
export { Fds } from './fds'
export { ImageMagickCommandBuilder } from './commandBuilder'
