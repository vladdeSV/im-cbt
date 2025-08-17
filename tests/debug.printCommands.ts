import { ImageMagickCommandBuilder } from '../source/commandBuilder'

function removeLeadingPlusMinus(str: string): string {
  return str.replace(/^[+-]/, '')
}

function kebabToCamelCase(str: string) {
  return str.replace(/-./g, match => match[1].toUpperCase())
}

const implementedMethods = Object.getOwnPropertyNames(ImageMagickCommandBuilder.prototype)
  // special commands for helping devs
  .filter(n => !['constructor', 'parts', 'fds', 'command', 'resource', 'parens'].includes(n) || n.endsWith('Ext'))

const optionsWithoutParametersText: string = await Bun.file('all-options.txt').text()
const options = optionsWithoutParametersText
  .trim()
  .split('\n')
  .filter(s => s.startsWith('+') || s.startsWith('-'))
const optionsWithParameters = options
  .map(s => s.split('\t')[0])
  .map(s => {
    const parts = s.split(' ')
    const methodName = kebabToCamelCase(removeLeadingPlusMinus(parts[0]))
    const parameters = parts[1]
    const isImplemented = implementedMethods.includes(methodName)

    return [methodName, parameters, isImplemented] as const
  })

for (const a of optionsWithParameters.filter(x => !x[2])) {
  console.log(a)
}
