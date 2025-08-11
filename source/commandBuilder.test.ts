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

test('alpha method', () => {
  expect(new IMCB().alpha('Set').parts()).toEqual(['-alpha', 'Set'])
  expect(new IMCB().alpha('Transparent').parts()).toEqual(['-alpha', 'Transparent'])
  expect(new IMCB().alpha('Off').parts()).toEqual(['-alpha', 'Off'])
})

test('clone method variations', () => {
  expect(new IMCB().clone().parts()).toEqual(['+clone'])
  expect(new IMCB().clone(1).parts()).toEqual(['-clone', '1'])
  expect(new IMCB().clone(-1).parts()).toEqual(['-clone', '-1'])
})

test('compose method', () => {
  expect(new IMCB().compose('Multiply').parts()).toEqual(['-compose', 'Multiply'])
  expect(new IMCB().compose('Overlay').parts()).toEqual(['-compose', 'Overlay'])
  expect(new IMCB().compose('Screen').parts()).toEqual(['-compose', 'Screen'])
})

test('extent method', () => {
  expect(new IMCB().extent(200, 300).parts()).toEqual(['-extent', '200x300'])
  expect(new IMCB().extent(100, 100).parts()).toEqual(['-extent', '100x100'])
})

test('fill method', () => {
  expect(new IMCB().fill('red').parts()).toEqual(['-fill', 'red'])
  expect(new IMCB().fill('#FF0000').parts()).toEqual(['-fill', '#FF0000'])
  expect(new IMCB().fill('none').parts()).toEqual(['-fill', 'none'])
})

test('filter method', () => {
  expect(new IMCB().filter('Lanczos').parts()).toEqual(['-filter', 'Lanczos'])
  expect(new IMCB().filter('Point').parts()).toEqual(['-filter', 'Point'])
  expect(new IMCB().filter('Mitchell').parts()).toEqual(['-filter', 'Mitchell'])
})

test('font method', () => {
  expect(new IMCB().font('Arial').parts()).toEqual(['-font', 'Arial'])
  expect(new IMCB().font('/path/to/font.ttf').parts()).toEqual(['-font', '/path/to/font.ttf'])
  expect(new IMCB().font('Times New Roman').parts()).toEqual(['-font', 'Times New Roman'])
})

test('interpolate method', () => {
  expect(new IMCB().interpolate('Bilinear').parts()).toEqual(['-interpolate', 'Bilinear'])
  expect(new IMCB().interpolate('Spline').parts()).toEqual(['-interpolate', 'Spline'])
  expect(new IMCB().interpolate('Nearest').parts()).toEqual(['-interpolate', 'Nearest'])
})

test('label method', () => {
  expect(new IMCB().label('Hello World').parts()).toEqual(['label:Hello World'])
  expect(new IMCB().label('Test Label').parts()).toEqual(['label:Test Label'])
  expect(new IMCB().label(123).parts()).toEqual(['label:123'])
})

test('opaque method', () => {
  expect(new IMCB().opaque('red').parts()).toEqual(['-opaque', 'red'])
  expect(new IMCB().opaque('blue', true).parts()).toEqual(['+opaque', 'blue'])
  expect(new IMCB().opaque('#FF0000').parts()).toEqual(['-opaque', '#FF0000'])
})

test('pointsize method', () => {
  expect(new IMCB().pointsize(12).parts()).toEqual(['-pointsize', '12'])
  expect(new IMCB().pointsize(24).parts()).toEqual(['-pointsize', '24'])
  expect(new IMCB().pointsize().parts()).toEqual(['+pointsize'])
})

test('resize method', () => {
  expect(new IMCB().resize(100, 200).parts()).toEqual(['-resize', '100x200'])
  expect(new IMCB().resize(50).parts()).toEqual(['-resize', '50'])
  expect(new IMCB().resize(undefined, 100).parts()).toEqual(['-resize', 'x100'])
})

test('resizeExt method', () => {
  expect(new IMCB().resizeExt(g => g.size(100, 100).flag('!')).parts())
    .toEqual(['-resize', '100x100!'])
  expect(new IMCB().resizeExt(g => g.scale(50)).parts())
    .toEqual(['-resize', '50%'])
})

test('trim method', () => {
  expect(new IMCB().trim().parts()).toEqual(['-trim'])
})

test('adaptive-blur method', () => {
  // adaptive-blur with radius and sigma
  expect(new IMCB().adaptiveBlur(2, 1).parts()).toEqual(['-adaptive-blur', '2x1'])
  expect(new IMCB().adaptiveBlur(0, 1.5).parts()).toEqual(['-adaptive-blur', '0x1.5'])
  expect(new IMCB().adaptiveBlur(5, 2).parts()).toEqual(['-adaptive-blur', '5x2'])
  
  // adaptive-blur with radius only (sigma defaults to 1)
  expect(new IMCB().adaptiveBlur(3).parts()).toEqual(['-adaptive-blur', '3'])
  expect(new IMCB().adaptiveBlur(0).parts()).toEqual(['-adaptive-blur', '0'])
})

test('adaptive-resize method', () => {
  // adaptive-resize with width and height
  expect(new IMCB().adaptiveResize(100, 200).parts()).toEqual(['-adaptive-resize', '100x200'])
  expect(new IMCB().adaptiveResize(300, 150).parts()).toEqual(['-adaptive-resize', '300x150'])
  
  // adaptive-resize with width only
  expect(new IMCB().adaptiveResize(150).parts()).toEqual(['-adaptive-resize', '150'])
  
  // adaptive-resize with height only  
  expect(new IMCB().adaptiveResize(undefined, 200).parts()).toEqual(['-adaptive-resize', 'x200'])
})

test('adaptive-resize-ext method', () => {
  // adaptive-resize with percentage scaling
  expect(new IMCB().adaptiveResizeExt(g => g.scale(50)).parts()).toEqual(['-adaptive-resize', '50%'])
  expect(new IMCB().adaptiveResizeExt(g => g.scale(75, 80)).parts()).toEqual(['-adaptive-resize', '75%x80%'])
  
  // adaptive-resize with size and flag
  expect(new IMCB().adaptiveResizeExt(g => g.size(200, 100).flag('!')).parts()).toEqual(['-adaptive-resize', '200x100!'])
})

test('adaptive-sharpen method', () => {
  // adaptive-sharpen with radius and sigma
  expect(new IMCB().adaptiveSharpen(2, 1).parts()).toEqual(['-adaptive-sharpen', '2x1'])
  expect(new IMCB().adaptiveSharpen(0, 1.5).parts()).toEqual(['-adaptive-sharpen', '0x1.5'])
  expect(new IMCB().adaptiveSharpen(5, 2).parts()).toEqual(['-adaptive-sharpen', '5x2'])
  
  // adaptive-sharpen with radius only (sigma defaults to 1)
  expect(new IMCB().adaptiveSharpen(3).parts()).toEqual(['-adaptive-sharpen', '3'])
  expect(new IMCB().adaptiveSharpen(0).parts()).toEqual(['-adaptive-sharpen', '0'])
})

test('adjoin method', () => {
  expect(new IMCB().adjoin().parts()).toEqual(['-adjoin'])
  expect(new IMCB().adjoin(false).parts()).toEqual(['+adjoin'])
  expect(new IMCB().adjoin(true).parts()).toEqual(['-adjoin'])
})

test('antialias method', () => {
  expect(new IMCB().antialias().parts()).toEqual(['-antialias'])
  expect(new IMCB().antialias(false).parts()).toEqual(['+antialias'])
  expect(new IMCB().antialias(true).parts()).toEqual(['-antialias'])
})

test('append method', () => {
  expect(new IMCB().append().parts()).toEqual(['-append'])
  expect(new IMCB().append(true).parts()).toEqual(['+append'])
  expect(new IMCB().append(false).parts()).toEqual(['-append'])
})

test('colorize method', () => {
  expect(new IMCB().colorize(50).parts()).toEqual(['-colorize', '50'])
  expect(new IMCB().colorize(30, 70).parts()).toEqual(['-colorize', '30,70'])
  expect(new IMCB().colorize(30, 70, 50).parts()).toEqual(['-colorize', '30,70,50'])
  expect(new IMCB().colorize(100).parts()).toEqual(['-colorize', '100'])
})

test('colorspace method', () => {
  expect(new IMCB().colorspace('Gray').parts()).toEqual(['-colorspace', 'Gray'])
  expect(new IMCB().colorspace('sRGB').parts()).toEqual(['-colorspace', 'sRGB'])
  expect(new IMCB().colorspace('CMYK').parts()).toEqual(['-colorspace', 'CMYK'])
})

test('contrast method', () => {
  expect(new IMCB().contrast().parts()).toEqual(['-contrast'])
  expect(new IMCB().contrast(false).parts()).toEqual(['+contrast'])
  expect(new IMCB().contrast(true).parts()).toEqual(['-contrast'])
})

test('enhance method', () => {
  expect(new IMCB().enhance().parts()).toEqual(['-enhance'])
})
