import { test, expect } from 'bun:test'
import { ImageMagickCommandBuilder as IMCB } from './commandBuilder'

test('empty command', () => {
  const command = new IMCB()
  expect(command.parts()).toEqual([])
})

test('simple resource', () => {
  const command = new IMCB('test.jpg')
  expect(command.parts()).toEqual(['test.jpg'])
})

test('simple command with parameters', () => {
  const command = new IMCB('-').background('red').gravity('NorthEast').geometry(10, 10)
  expect(command.parts()).toEqual(['-', '-background', 'red', '-gravity', 'NorthEast', '-geometry', '+10+10'])
})

test('command with nested command', () => {
  const command = new IMCB('-').parens(new IMCB('test')).gravity('NorthEast').geometry(10, 10).composite()
  expect(command.parts()).toEqual(['-', '(', 'test', ')', '-gravity', 'NorthEast', '-geometry', '+10+10', '-composite'])
})

test('command custom commands with numbers and strings', () => {
  const command = new IMCB('-')
    .command('-colorize', 30)
    .command('-colorize', '30')
  expect(command.parts()).toEqual(['-', '-colorize', '30', '-colorize', '30'])
})

test('size method variations', () => {
  expect(new IMCB().size(100).parts()).toEqual(['-size', '100'])
  expect(new IMCB().size(100, 200).parts()).toEqual(['-size', '100x200'])
  
  // height only
  expect(new IMCB().size(undefined, 200).parts()).toEqual(['-size', 'x200'])
  
  // no parameters - should use +size instead of -size
  expect(new IMCB().size().parts()).toEqual(['+size'])
})
