import { describe, expect, test } from 'bun:test'
import { ImageMagickCommandBuilder } from '../source/commandBuilder.ts'

function removeLeadingPlusMinus(str: string): string {
  return str.replace(/^[+-]/, '')
}

function kebabToCamelCase(str: string) {
  return str.replace(/-./g, match => match[1].toUpperCase())
}

const optionsWithoutParametersText: string = await Bun.file('all-options.txt').text()
const options = optionsWithoutParametersText
  .trim()
  .split('\n')
  .filter(s => s.startsWith('+') || s.startsWith('-'))
const optionsWithParameters = options
  .map(s => s.split('\t')[0])
  .map(s => {
    const parts = s.split(' ')

    return [kebabToCamelCase(removeLeadingPlusMinus(parts[0])), parts[1]]
  })

const optionNames = optionsWithParameters.map(o => o[0])
const methods = Object.getOwnPropertyNames(ImageMagickCommandBuilder.prototype)
  // special commands for helping devs
  .filter(n => !['constructor', 'parts', 'fds', 'command', 'resource', 'parens'].includes(n) || n.endsWith('Ext'))

describe('commandBuilder contains all options', () => {
  // check all options exist in source code
  for (const option of optionNames) {
    test(`${option}`, () => {
      expect(methods.includes(option)).toBeTrue()
    })
  }
})

/*
describe('no u', () => {
  // check all options exist in source code
  for (const option of methods) {

    if (option.endsWith('Ext')) {
      continue
    }

    if (option === 'func') {
      continue
    }

    test(`${option}`, () => {
      expect(optionNames.includes(option)).toBeTrue()
    })
  }
})
*/
