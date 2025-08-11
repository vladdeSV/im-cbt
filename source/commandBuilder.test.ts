import { expect, test } from 'bun:test'
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
  expect(new IMCB().size(undefined, 200).parts()).toEqual(['-size', 'x200'])
  expect(new IMCB().size().parts()).toEqual(['+size'])
})

test('crop method variations', () => {
  expect(new IMCB().crop(100, 100, 10, 20).parts()).toEqual(['-crop', '100x100+10+20'])
  expect(new IMCB().crop(150, 200).parts()).toEqual(['-crop', '150x200'])
  expect(new IMCB().crop(100, 100, -5, -10).parts()).toEqual(['-crop', '100x100-5-10'])
  expect(new IMCB().crop(200, 150, 25, -15).parts()).toEqual(['-crop', '200x150+25-15'])
})

test('crop with geometry function', () => {
  // using extended geometry function for crop
  expect(new IMCB().cropExt(g => g.size(100, 100).offset(10, 10)).parts())
    .toEqual(['-crop', '100x100+10+10'])

  // crop with percentage scaling  
  expect(new IMCB().cropExt(g => g.scale(50, 50).offset(0, 0)).parts())
    .toEqual(['-crop', '50%x50%+0+0'])
})

test('rotate method variations', () => {
  expect(new IMCB().rotate(90).parts()).toEqual(['-rotate', '90'])
  expect(new IMCB().rotate(-45).parts()).toEqual(['-rotate', '-45'])
  expect(new IMCB().rotate(180.5).parts()).toEqual(['-rotate', '180.5'])
  expect(new IMCB().rotate(0).parts()).toEqual(['-rotate', '0'])

  // rotate with < flag (only if wider than tall)
  expect(new IMCB().rotate(90, '<').parts()).toEqual(['-rotate', '90<'])

  // rotate with > flag (only if taller than wide)
  expect(new IMCB().rotate(-90, '>').parts()).toEqual(['-rotate', '-90>'])
})

test('flip method', () => {
  expect(new IMCB().flip().parts()).toEqual(['-flip'])
})

test('flop method', () => {
  expect(new IMCB().flop().parts()).toEqual(['-flop'])
})

test('quality method', () => {
  expect(new IMCB().quality(85).parts()).toEqual(['-quality', '85'])
  expect(new IMCB().quality(100).parts()).toEqual(['-quality', '100'])
  expect(new IMCB().quality(50).parts()).toEqual(['-quality', '50'])
  expect(new IMCB().quality().parts()).toEqual(['+quality'])
})

test('strip method', () => {
  expect(new IMCB().strip().parts()).toEqual(['-strip'])
})

test('blur method', () => {
  // blur with radius and sigma
  expect(new IMCB().blur(0, 1).parts()).toEqual(['-blur', '0x1'])
  expect(new IMCB().blur(5, 2).parts()).toEqual(['-blur', '5x2'])
  expect(new IMCB().blur(2).parts()).toEqual(['-blur', '2'])
})

test('sharpen method', () => {
  expect(new IMCB().sharpen(0, 1).parts()).toEqual(['-sharpen', '0x1'])
  expect(new IMCB().sharpen(2).parts()).toEqual(['-sharpen', '2'])
})
