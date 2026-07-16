import { expect, test } from 'bun:test'
import { ImageMagickCommandBuilder as IMCB } from '../source/commandBuilder.ts'

test('empty command', () => {
  const command = new IMCB()
  expect(command.parts('allow-unsafe')).toEqual([])
})

test('simple resource', () => {
  const command = new IMCB('test.jpg')
  expect(command.parts('allow-unsafe')).toEqual(['test.jpg'])
})

test('simple command with parameters', () => {
  const command = new IMCB('-').background('red').gravity('NorthEast').geometry(10, 10)
  expect(command.parts('allow-unsafe')).toEqual([
    '-',
    '-background',
    'red',
    '-gravity',
    'NorthEast',
    '-geometry',
    '+10+10',
  ])
})

test('command with nested command', () => {
  const command = new IMCB('-').parens(new IMCB('test')).gravity('NorthEast').geometry(10, 10).composite()
  expect(command.parts('allow-unsafe')).toEqual([
    '-',
    '(',
    'test',
    ')',
    '-gravity',
    'NorthEast',
    '-geometry',
    '+10+10',
    '-composite',
  ])
})

test('command custom commands with numbers and strings', () => {
  const command = new IMCB('-').command('-colorize', 30).command('-colorize', '30')
  expect(command.parts('allow-unsafe')).toEqual(['-', '-colorize', '30', '-colorize', '30'])
})

test('size method variations', () => {
  expect(new IMCB().size(100).parts('allow-unsafe')).toEqual(['-size', '100'])
  expect(new IMCB().size(100, 200).parts('allow-unsafe')).toEqual(['-size', '100x200'])
  expect(new IMCB().size(undefined, 200).parts('allow-unsafe')).toEqual(['-size', 'x200'])
  expect(new IMCB().size().parts('allow-unsafe')).toEqual(['+size'])
})

test('crop method variations', () => {
  expect(new IMCB().crop(100, 100, 10, 20).parts('allow-unsafe')).toEqual(['-crop', '100x100+10+20'])
  expect(new IMCB().crop(150, 200).parts('allow-unsafe')).toEqual(['-crop', '150x200'])
  expect(new IMCB().crop(100, 100, -5, -10).parts('allow-unsafe')).toEqual(['-crop', '100x100-5-10'])
  expect(new IMCB().crop(200, 150, 25, -15).parts('allow-unsafe')).toEqual(['-crop', '200x150+25-15'])
})

test('crop with geometry function', () => {
  // using extended geometry function for crop
  expect(new IMCB().crop(g => g.size(100, 100).offset(10, 10)).parts('allow-unsafe')).toEqual([
    '-crop',
    '100x100+10+10',
  ])

  // crop with percentage scaling
  expect(new IMCB().crop(g => g.scale(50, 50).offset(0, 0)).parts('allow-unsafe')).toEqual(['-crop', '50%x50%+0+0'])
})

test('rotate method variations', () => {
  expect(new IMCB().rotate(90).parts('allow-unsafe')).toEqual(['-rotate', '90'])
  expect(new IMCB().rotate(-45).parts('allow-unsafe')).toEqual(['-rotate', '-45'])
  expect(new IMCB().rotate(180.5).parts('allow-unsafe')).toEqual(['-rotate', '180.5'])
  expect(new IMCB().rotate(0).parts('allow-unsafe')).toEqual(['-rotate', '0'])

  // rotate with < flag (only if wider than tall)
  expect(new IMCB().rotate(90, '<').parts('allow-unsafe')).toEqual(['-rotate', '90<'])

  // rotate with > flag (only if taller than wide)
  expect(new IMCB().rotate(-90, '>').parts('allow-unsafe')).toEqual(['-rotate', '-90>'])
})

test('flip method', () => {
  expect(new IMCB().flip().parts('allow-unsafe')).toEqual(['-flip'])
})

test('flop method', () => {
  expect(new IMCB().flop().parts('allow-unsafe')).toEqual(['-flop'])
})

test('quality method', () => {
  expect(new IMCB().quality(85).parts('allow-unsafe')).toEqual(['-quality', '85'])
  expect(new IMCB().quality(100).parts('allow-unsafe')).toEqual(['-quality', '100'])
  expect(new IMCB().quality(50).parts('allow-unsafe')).toEqual(['-quality', '50'])
  expect(new IMCB().quality().parts('allow-unsafe')).toEqual(['+quality'])
})

test('strip method', () => {
  expect(new IMCB().strip().parts('allow-unsafe')).toEqual(['-strip'])
})

test('blur method', () => {
  // blur with radius and sigma
  expect(new IMCB().blur(0, 1).parts('allow-unsafe')).toEqual(['-blur', '0x1'])
  expect(new IMCB().blur(5, 2).parts('allow-unsafe')).toEqual(['-blur', '5x2'])
  expect(new IMCB().blur(2).parts('allow-unsafe')).toEqual(['-blur', '2'])
})

test('sharpen method', () => {
  expect(new IMCB().sharpen(0, 1).parts('allow-unsafe')).toEqual(['-sharpen', '0x1'])
  expect(new IMCB().sharpen(2).parts('allow-unsafe')).toEqual(['-sharpen', '2'])
})

test('alpha method', () => {
  expect(new IMCB().alpha('Set').parts('allow-unsafe')).toEqual(['-alpha', 'Set'])
  expect(new IMCB().alpha('Transparent').parts('allow-unsafe')).toEqual(['-alpha', 'Transparent'])
  expect(new IMCB().alpha('Off').parts('allow-unsafe')).toEqual(['-alpha', 'Off'])
  expect(new IMCB().alpha('OffIfOpaque').parts('allow-unsafe')).toEqual(['-alpha', 'OffIfOpaque'])
})

test('clone method variations (must be in parens irl)', () => {
  expect(new IMCB().clone().parts('allow-unsafe')).toEqual(['+clone'])
  expect(new IMCB().clone(1).parts('allow-unsafe')).toEqual(['-clone', '1'])
  expect(new IMCB().clone(-1).parts('allow-unsafe')).toEqual(['-clone', '-1'])
  expect(new IMCB().clone(1, 2).parts('allow-unsafe')).toEqual(['-clone', '1,2'])
  expect(new IMCB().clone(2, 4, -1).parts('allow-unsafe')).toEqual(['-clone', '2,4,-1'])
  expect(new IMCB().clone(0, 1, 2).parts('allow-unsafe')).toEqual(['-clone', '0,1,2'])
})

test('compose method', () => {
  expect(new IMCB().compose('Multiply').parts('allow-unsafe')).toEqual(['-compose', 'Multiply'])
  expect(new IMCB().compose('Overlay').parts('allow-unsafe')).toEqual(['-compose', 'Overlay'])
  expect(new IMCB().compose('Screen').parts('allow-unsafe')).toEqual(['-compose', 'Screen'])
})

test('extent method', () => {
  expect(new IMCB().extent(200, 300).parts('allow-unsafe')).toEqual(['-extent', '200x300'])
  expect(new IMCB().extent(100, 100).parts('allow-unsafe')).toEqual(['-extent', '100x100'])
})

test('fill method', () => {
  expect(new IMCB().fill('red').parts('allow-unsafe')).toEqual(['-fill', 'red'])
  expect(new IMCB().fill('#FF0000').parts('allow-unsafe')).toEqual(['-fill', '#FF0000'])
  expect(new IMCB().fill('none').parts('allow-unsafe')).toEqual(['-fill', 'none'])
})

test('filter method', () => {
  expect(new IMCB().filter('Lanczos').parts('allow-unsafe')).toEqual(['-filter', 'Lanczos'])
  expect(new IMCB().filter('Point').parts('allow-unsafe')).toEqual(['-filter', 'Point'])
  expect(new IMCB().filter('Mitchell').parts('allow-unsafe')).toEqual(['-filter', 'Mitchell'])
})

test('font method', () => {
  expect(new IMCB().font('Arial').parts('allow-unsafe')).toEqual(['-font', 'Arial'])
  expect(new IMCB().font('/path/to/font.ttf').parts('allow-unsafe')).toEqual(['-font', '/path/to/font.ttf'])
  expect(new IMCB().font('Times New Roman').parts('allow-unsafe')).toEqual(['-font', 'Times New Roman'])
})

test('interpolate method', () => {
  expect(new IMCB().interpolate('Bilinear').parts('allow-unsafe')).toEqual(['-interpolate', 'Bilinear'])
  expect(new IMCB().interpolate('Spline').parts('allow-unsafe')).toEqual(['-interpolate', 'Spline'])
  expect(new IMCB().interpolate('Nearest').parts('allow-unsafe')).toEqual(['-interpolate', 'Nearest'])
})

test('label method', () => {
  expect(new IMCB().label('Hello World').parts('allow-unsafe')).toEqual(['label:Hello World'])
  expect(new IMCB().label('Test Label').parts('allow-unsafe')).toEqual(['label:Test Label'])
  expect(new IMCB().label(123).parts('allow-unsafe')).toEqual(['label:123'])
})

test('opaque method', () => {
  expect(new IMCB().opaque('red').parts('allow-unsafe')).toEqual(['-opaque', 'red'])
  expect(new IMCB().opaque('blue', true).parts('allow-unsafe')).toEqual(['+opaque', 'blue'])
  expect(new IMCB().opaque('#FF0000').parts('allow-unsafe')).toEqual(['-opaque', '#FF0000'])
})

test('pointsize method', () => {
  expect(new IMCB().pointsize(12).parts('allow-unsafe')).toEqual(['-pointsize', '12'])
  expect(new IMCB().pointsize(24).parts('allow-unsafe')).toEqual(['-pointsize', '24'])
  expect(new IMCB().pointsize(0).parts('allow-unsafe')).toEqual(['-pointsize', '0'])
  expect(new IMCB().pointsize().parts('allow-unsafe')).toEqual(['+pointsize'])
})

test('resize method', () => {
  expect(new IMCB().resize(100, 200).parts('allow-unsafe')).toEqual(['-resize', '100x200'])
  expect(new IMCB().resize(50).parts('allow-unsafe')).toEqual(['-resize', '50'])
  expect(new IMCB().resize(undefined, 100).parts('allow-unsafe')).toEqual(['-resize', 'x100'])
})

test('resize with callback', () => {
  expect(new IMCB().resize(g => g.size(100, 100).flag('!')).parts('allow-unsafe')).toEqual(['-resize', '100x100!'])
  expect(new IMCB().resize(g => g.scale(50)).parts('allow-unsafe')).toEqual(['-resize', '50%'])
})

test('trim method', () => {
  expect(new IMCB().trim().parts('allow-unsafe')).toEqual(['-trim'])
})

test('adaptive-blur method', () => {
  // adaptive-blur with radius and sigma
  expect(new IMCB().adaptiveBlur(2, 1).parts('allow-unsafe')).toEqual(['-adaptive-blur', '2x1'])
  expect(new IMCB().adaptiveBlur(0, 1.5).parts('allow-unsafe')).toEqual(['-adaptive-blur', '0x1.5'])
  expect(new IMCB().adaptiveBlur(5, 2).parts('allow-unsafe')).toEqual(['-adaptive-blur', '5x2'])

  // adaptive-blur with radius only (sigma defaults to 1)
  expect(new IMCB().adaptiveBlur(3).parts('allow-unsafe')).toEqual(['-adaptive-blur', '3'])
  expect(new IMCB().adaptiveBlur(0).parts('allow-unsafe')).toEqual(['-adaptive-blur', '0'])
})

test('adaptive-resize method', () => {
  // adaptive-resize with width and height
  expect(new IMCB().adaptiveResize(100, 200).parts('allow-unsafe')).toEqual(['-adaptive-resize', '100x200'])
  expect(new IMCB().adaptiveResize(300, 150).parts('allow-unsafe')).toEqual(['-adaptive-resize', '300x150'])

  // adaptive-resize with width only
  expect(new IMCB().adaptiveResize(150).parts('allow-unsafe')).toEqual(['-adaptive-resize', '150'])

  // adaptive-resize with height only
  expect(new IMCB().adaptiveResize(undefined, 200).parts('allow-unsafe')).toEqual(['-adaptive-resize', 'x200'])
})

test('adaptive-resize with callback', () => {
  // adaptive-resize with percentage scaling
  expect(new IMCB().adaptiveResize(g => g.scale(50)).parts('allow-unsafe')).toEqual(['-adaptive-resize', '50%'])
  expect(new IMCB().adaptiveResize(g => g.scale(75, 80)).parts('allow-unsafe')).toEqual([
    '-adaptive-resize',
    '75%x80%',
  ])

  // adaptive-resize with size and flag
  expect(new IMCB().adaptiveResize(g => g.size(200, 100).flag('!')).parts('allow-unsafe')).toEqual([
    '-adaptive-resize',
    '200x100!',
  ])
})

test('adaptive-sharpen method', () => {
  // adaptive-sharpen with radius and sigma
  expect(new IMCB().adaptiveSharpen(2, 1).parts('allow-unsafe')).toEqual(['-adaptive-sharpen', '2x1'])
  expect(new IMCB().adaptiveSharpen(0, 1.5).parts('allow-unsafe')).toEqual(['-adaptive-sharpen', '0x1.5'])
  expect(new IMCB().adaptiveSharpen(5, 2).parts('allow-unsafe')).toEqual(['-adaptive-sharpen', '5x2'])

  // adaptive-sharpen with radius only (sigma defaults to 1)
  expect(new IMCB().adaptiveSharpen(3).parts('allow-unsafe')).toEqual(['-adaptive-sharpen', '3'])
  expect(new IMCB().adaptiveSharpen(0).parts('allow-unsafe')).toEqual(['-adaptive-sharpen', '0'])
})

test('adjoin method', () => {
  expect(new IMCB().adjoin().parts('allow-unsafe')).toEqual(['-adjoin'])
  expect(new IMCB().adjoin(false).parts('allow-unsafe')).toEqual(['+adjoin'])
  expect(new IMCB().adjoin(true).parts('allow-unsafe')).toEqual(['-adjoin'])
})

test('antialias method', () => {
  expect(new IMCB().antialias().parts('allow-unsafe')).toEqual(['-antialias'])
  expect(new IMCB().antialias(false).parts('allow-unsafe')).toEqual(['+antialias'])
  expect(new IMCB().antialias(true).parts('allow-unsafe')).toEqual(['-antialias'])
})

test('append method', () => {
  expect(new IMCB().append().parts('allow-unsafe')).toEqual(['-append'])
  expect(new IMCB().append(true).parts('allow-unsafe')).toEqual(['+append'])
  expect(new IMCB().append(false).parts('allow-unsafe')).toEqual(['-append'])
})

test('colorize method', () => {
  expect(new IMCB().colorize(50).parts('allow-unsafe')).toEqual(['-colorize', '50'])
  expect(new IMCB().colorize(30, 70).parts('allow-unsafe')).toEqual(['-colorize', '30,70'])
  expect(new IMCB().colorize(30, 70, 50).parts('allow-unsafe')).toEqual(['-colorize', '30,70,50'])
  expect(new IMCB().colorize(100).parts('allow-unsafe')).toEqual(['-colorize', '100'])
})

test('colorspace method', () => {
  expect(new IMCB().colorspace('Gray').parts('allow-unsafe')).toEqual(['-colorspace', 'Gray'])
  expect(new IMCB().colorspace('sRGB').parts('allow-unsafe')).toEqual(['-colorspace', 'sRGB'])
  expect(new IMCB().colorspace('CMYK').parts('allow-unsafe')).toEqual(['-colorspace', 'CMYK'])
})

test('contrast method', () => {
  expect(new IMCB().contrast().parts('allow-unsafe')).toEqual(['-contrast'])
  expect(new IMCB().contrast(false).parts('allow-unsafe')).toEqual(['+contrast'])
  expect(new IMCB().contrast(true).parts('allow-unsafe')).toEqual(['-contrast'])
})

test('enhance method', () => {
  expect(new IMCB().enhance().parts('allow-unsafe')).toEqual(['-enhance'])
})

test('affine method', () => {
  expect(new IMCB().affine(1, 0, 0, 1).parts('allow-unsafe')).toEqual(['-affine', '1,0,0,1'])
  expect(new IMCB().affine(1, 0, 0, 1.5).parts('allow-unsafe')).toEqual(['-affine', '1,0,0,1.5'])
  expect(new IMCB().affine(1, 0, 0, 1, 10, 20).parts('allow-unsafe')).toEqual(['-affine', '1,0,0,1,10,20'])
})

test('annotate method', () => {
  expect(new IMCB().annotate(0, 'Hello').parts('allow-unsafe')).toEqual(['-annotate', '0', 'Hello'])
  expect(new IMCB().annotate(45, 'Rotated Text').parts('allow-unsafe')).toEqual(['-annotate', '45', 'Rotated Text'])
  expect(new IMCB().annotate(-90, 'Vertical').parts('allow-unsafe')).toEqual(['-annotate', '-90', 'Vertical'])

  // callback covers the geometry forms: offsets only, shears, or both
  expect(new IMCB().annotate(g => g.offset(20, 20), 'Offset').parts('allow-unsafe')).toEqual([
    '-annotate',
    '+20+20',
    'Offset',
  ])
  expect(new IMCB().annotate(g => g.size(15, 15).offset(20, 20), 'Sheared').parts('allow-unsafe')).toEqual([
    '-annotate',
    '15x15+20+20',
    'Sheared',
  ])
})

test('authenticate method', () => {
  expect(new IMCB().authenticate('password123').parts('allow-unsafe')).toEqual(['-authenticate', 'password123'])
  expect(new IMCB().authenticate('secret').parts('allow-unsafe')).toEqual(['-authenticate', 'secret'])
})

test('auto-gamma method', () => {
  expect(new IMCB().autoGamma().parts('allow-unsafe')).toEqual(['-auto-gamma'])
})

test('auto-level method', () => {
  expect(new IMCB().autoLevel().parts('allow-unsafe')).toEqual(['-auto-level'])
})

test('bias method', () => {
  expect(new IMCB().bias('50%').parts('allow-unsafe')).toEqual(['-bias', '50%'])
  expect(new IMCB().bias(0.5).parts('allow-unsafe')).toEqual(['-bias', '0.5'])
  expect(new IMCB().bias('25%').parts('allow-unsafe')).toEqual(['-bias', '25%'])
})

test('blackThreshold method', () => {
  expect(new IMCB().blackThreshold('50%').parts('allow-unsafe')).toEqual(['-black-threshold', '50%'])
  expect(new IMCB().blackThreshold(128).parts('allow-unsafe')).toEqual(['-black-threshold', '128'])
  expect(new IMCB().blackThreshold('25%').parts('allow-unsafe')).toEqual(['-black-threshold', '25%'])
})

test('border method', () => {
  expect(new IMCB().border(10, 10).parts('allow-unsafe')).toEqual(['-border', '10x10'])
  expect(new IMCB().border(5, 8).parts('allow-unsafe')).toEqual(['-border', '5x8'])
  expect(new IMCB().border(15).parts('allow-unsafe')).toEqual(['-border', '15'])
  expect(new IMCB().border('5%', '10%').parts('allow-unsafe')).toEqual(['-border', '5%x10%'])
  expect(new IMCB().border('5%').parts('allow-unsafe')).toEqual(['-border', '5%'])
})

test('borderColor method', () => {
  expect(new IMCB().bordercolor('red').parts('allow-unsafe')).toEqual(['-bordercolor', 'red'])
  expect(new IMCB().bordercolor('#FF0000').parts('allow-unsafe')).toEqual(['-bordercolor', '#FF0000'])
  expect(new IMCB().bordercolor('blue').parts('allow-unsafe')).toEqual(['-bordercolor', 'blue'])
})

test('despeckle method', () => {
  expect(new IMCB().despeckle().parts('allow-unsafe')).toEqual(['-despeckle'])
})

test('gaussianBlur method', () => {
  expect(new IMCB().gaussianBlur(0, 1).parts('allow-unsafe')).toEqual(['-gaussian-blur', '0x1'])
  expect(new IMCB().gaussianBlur(5, 2).parts('allow-unsafe')).toEqual(['-gaussian-blur', '5x2'])
  expect(new IMCB().gaussianBlur(3).parts('allow-unsafe')).toEqual(['-gaussian-blur', '3'])
})

test('density method', () => {
  expect(new IMCB().density(300).parts('allow-unsafe')).toEqual(['-density', '300'])
  expect(new IMCB().density(300, 300).parts('allow-unsafe')).toEqual(['-density', '300x300'])
  expect(new IMCB().density(150, 200).parts('allow-unsafe')).toEqual(['-density', '150x200'])
})

test('depth method', () => {
  expect(new IMCB().depth(8).parts('allow-unsafe')).toEqual(['-depth', '8'])
  expect(new IMCB().depth(16).parts('allow-unsafe')).toEqual(['-depth', '16'])
  expect(new IMCB().depth(32).parts('allow-unsafe')).toEqual(['-depth', '32'])
})

test('normalize method', () => {
  expect(new IMCB().normalize().parts('allow-unsafe')).toEqual(['-normalize'])
})

test('negate method', () => {
  expect(new IMCB().negate().parts('allow-unsafe')).toEqual(['-negate'])
})

test('monochrome method', () => {
  expect(new IMCB().monochrome().parts('allow-unsafe')).toEqual(['-monochrome'])
})

test('equalize method', () => {
  expect(new IMCB().equalize().parts('allow-unsafe')).toEqual(['-equalize'])
})

test('flatten method', () => {
  expect(new IMCB().flatten().parts('allow-unsafe')).toEqual(['-flatten'])
})

test('ping method', () => {
  expect(new IMCB().ping().parts('allow-unsafe')).toEqual(['-ping'])
})

test('reverse method', () => {
  expect(new IMCB().reverse().parts('allow-unsafe')).toEqual(['-reverse'])
})

test('brightnessContrast method', () => {
  expect(new IMCB().brightnessContrast(10, 5).parts('allow-unsafe')).toEqual(['-brightness-contrast', '10x5'])
  expect(new IMCB().brightnessContrast(-10, 20).parts('allow-unsafe')).toEqual(['-brightness-contrast', '-10x20'])
  expect(new IMCB().brightnessContrast(0, -5).parts('allow-unsafe')).toEqual(['-brightness-contrast', '0x-5'])
  expect(new IMCB().brightnessContrast('10%', '5%').parts('allow-unsafe')).toEqual(['-brightness-contrast', '10%x5%'])
  expect(new IMCB().brightnessContrast(10).parts('allow-unsafe')).toEqual(['-brightness-contrast', '10'])
})

test('channel method', () => {
  expect(new IMCB().channel('RGB').parts('allow-unsafe')).toEqual(['-channel', 'RGB'])
  expect(new IMCB().channel('Red', 'Green').parts('allow-unsafe')).toEqual(['-channel', 'Red,Green'])
  expect(new IMCB().channel('Red', 'Green', 'Blue').parts('allow-unsafe')).toEqual(['-channel', 'Red,Green,Blue'])
  expect(new IMCB().channel().parts('allow-unsafe')).toEqual(['+channel'])
})

test('charcoal method', () => {
  expect(new IMCB().charcoal(2).parts('allow-unsafe')).toEqual(['-charcoal', '2'])
  expect(new IMCB().charcoal(0, 1).parts('allow-unsafe')).toEqual(['-charcoal', '0x1'])
  expect(new IMCB().charcoal(5).parts('allow-unsafe')).toEqual(['-charcoal', '5'])
})

test('chop method', () => {
  expect(new IMCB().chop(10, 10, 5, 5).parts('allow-unsafe')).toEqual(['-chop', '10x10+5+5'])
  expect(new IMCB().chop(50, 50).parts('allow-unsafe')).toEqual(['-chop', '50x50'])
  expect(new IMCB().chop(20, 15, -10, -5).parts('allow-unsafe')).toEqual(['-chop', '20x15-10-5'])
  expect(new IMCB().chop(g => g.scale(10, 10).offset(0, 0)).parts('allow-unsafe')).toEqual(['-chop', '10%x10%+0+0'])
})

test('compress method', () => {
  expect(new IMCB().compress('JPEG').parts('allow-unsafe')).toEqual(['-compress', 'JPEG'])
  expect(new IMCB().compress('None').parts('allow-unsafe')).toEqual(['-compress', 'None'])
  expect(new IMCB().compress('Zip').parts('allow-unsafe')).toEqual(['-compress', 'Zip'])
})

/*
test('contrastStretch method', () => {
  expect(new IMCB().contrastStretch(2, 1).parts('allow-unsafe')).toEqual(['-contrast-stretch', '2%x1%'])
  expect(new IMCB().contrastStretch(0, 0).parts('allow-unsafe')).toEqual(['-contrast-stretch', '0x0'])
  expect(new IMCB().contrastStretch(5, 3).parts('allow-unsafe')).toEqual(['-contrast-stretch', '5%x3%'])
})
*/

test('cycle method', () => {
  expect(new IMCB().cycle(50).parts('allow-unsafe')).toEqual(['-cycle', '50'])
  expect(new IMCB().cycle(-25).parts('allow-unsafe')).toEqual(['-cycle', '-25'])
  expect(new IMCB().cycle(100).parts('allow-unsafe')).toEqual(['-cycle', '100'])
})

test('edge method', () => {
  expect(new IMCB().edge(1).parts('allow-unsafe')).toEqual(['-edge', '1'])
  expect(new IMCB().edge(2).parts('allow-unsafe')).toEqual(['-edge', '2'])
  expect(new IMCB().edge(0.5).parts('allow-unsafe')).toEqual(['-edge', '0.5'])
})

test('emboss method', () => {
  expect(new IMCB().emboss(2).parts('allow-unsafe')).toEqual(['-emboss', '2'])
  expect(new IMCB().emboss(0, 1).parts('allow-unsafe')).toEqual(['-emboss', '0x1'])
  expect(new IMCB().emboss(3).parts('allow-unsafe')).toEqual(['-emboss', '3'])
})

test('gamma method', () => {
  expect(new IMCB().gamma(0.8).parts('allow-unsafe')).toEqual(['-gamma', '0.8'])
  expect(new IMCB().gamma(2.2).parts('allow-unsafe')).toEqual(['-gamma', '2.2'])
  expect(new IMCB().gamma(1.0).parts('allow-unsafe')).toEqual(['-gamma', '1'])
})

test('grayscale method', () => {
  expect(new IMCB().grayscale('average').parts('allow-unsafe')).toEqual(['-grayscale', 'average'])
  expect(new IMCB().grayscale('rec709luma').parts('allow-unsafe')).toEqual(['-grayscale', 'rec709luma'])
  expect(new IMCB().grayscale('lightness').parts('allow-unsafe')).toEqual(['-grayscale', 'lightness'])
})

test('help method', () => {
  expect(new IMCB().help().parts('allow-unsafe')).toEqual(['-help'])
})

test('implode method', () => {
  expect(new IMCB().implode(0.5).parts('allow-unsafe')).toEqual(['-implode', '0.5'])
  expect(new IMCB().implode(-1).parts('allow-unsafe')).toEqual(['-implode', '-1'])
  expect(new IMCB().implode(2).parts('allow-unsafe')).toEqual(['-implode', '2'])
})

test('median method', () => {
  expect(new IMCB().median(2).parts('allow-unsafe')).toEqual(['-median', '2'])
  expect(new IMCB().median(0, 1).parts('allow-unsafe')).toEqual(['-median', '0x1'])
  expect(new IMCB().median(3).parts('allow-unsafe')).toEqual(['-median', '3'])
})

test('autoOrient method', () => {
  expect(new IMCB().autoOrient().parts('allow-unsafe')).toEqual(['-auto-orient'])
})

test('blackPointCompensation method', () => {
  expect(new IMCB().blackPointCompensation().parts('allow-unsafe')).toEqual(['-black-point-compensation'])
})

test('convolve method', () => {
  expect(new IMCB().convolve('1,2,1,2,4,2,1,2,1').parts('allow-unsafe')).toEqual(['-convolve', '1,2,1,2,4,2,1,2,1'])
  expect(new IMCB().convolve('0,-1,0,-1,5,-1,0,-1,0').parts('allow-unsafe')).toEqual([
    '-convolve',
    '0,-1,0,-1,5,-1,0,-1,0',
  ])
  expect(new IMCB().convolve('1,1,1,1,1,1,1,1,1').parts('allow-unsafe')).toEqual(['-convolve', '1,1,1,1,1,1,1,1,1'])
})

test('debug method', () => {
  expect(new IMCB().debug('All').parts('allow-unsafe')).toEqual(['-debug', 'All'])
  expect(new IMCB().debug('Cache', 'Blob').parts('allow-unsafe')).toEqual(['-debug', 'Cache,Blob'])
  expect(new IMCB().debug('Cache', 'Blob', 'Resource').parts('allow-unsafe')).toEqual(['-debug', 'Cache,Blob,Resource'])
  expect(new IMCB().debug('None').parts('allow-unsafe')).toEqual(['-debug', 'None'])
  expect(new IMCB().debug().parts('allow-unsafe')).toEqual(['+debug'])
})

test('define method', () => {
  expect(new IMCB().define('jpeg:quality', 90).parts('allow-unsafe')).toEqual(['-define', 'jpeg:quality=90'])
  expect(new IMCB().define('registry:temporary-path', '/tmp').parts('allow-unsafe')).toEqual([
    '-define',
    'registry:temporary-path=/tmp',
  ])
  expect(new IMCB().define('ps:imagemask').parts('allow-unsafe')).toEqual(['-define', 'ps:imagemask'])
})

test('undefine method', () => {
  expect(new IMCB().undefine('jpeg:quality').parts('allow-unsafe')).toEqual(['+define', 'jpeg:quality'])
  expect(new IMCB().undefine('*').parts('allow-unsafe')).toEqual(['+define', '*'])
})

test('delay method', () => {
  expect(new IMCB().delay(30).parts('allow-unsafe')).toEqual(['-delay', '30'])
  expect(new IMCB().delay(30, 100).parts('allow-unsafe')).toEqual(['-delay', '30x100'])
  expect(new IMCB().delay(50, 200).parts('allow-unsafe')).toEqual(['-delay', '50x200'])
  expect(new IMCB().delay(10, '>').parts('allow-unsafe')).toEqual(['-delay', '10>'])
  expect(new IMCB().delay(5, '<').parts('allow-unsafe')).toEqual(['-delay', '5<'])
  expect(new IMCB().delay(30, 100, '>').parts('allow-unsafe')).toEqual(['-delay', '30x100>'])
})

test('direction method', () => {
  expect(new IMCB().direction('right-to-left').parts('allow-unsafe')).toEqual(['-direction', 'right-to-left'])
  expect(new IMCB().direction('left-to-right').parts('allow-unsafe')).toEqual(['-direction', 'left-to-right'])
})

test('display method', () => {
  expect(new IMCB().display(':0.0').parts('allow-unsafe')).toEqual(['-display', ':0.0'])
  expect(new IMCB().display('localhost:10.0').parts('allow-unsafe')).toEqual(['-display', 'localhost:10.0'])
})

test('dispose method', () => {
  expect(new IMCB().dispose('Background').parts('allow-unsafe')).toEqual(['-dispose', 'Background'])
  expect(new IMCB().dispose('None').parts('allow-unsafe')).toEqual(['-dispose', 'None'])
  expect(new IMCB().dispose('Previous').parts('allow-unsafe')).toEqual(['-dispose', 'Previous'])
})

test('distort method', () => {
  expect(new IMCB().distort('Perspective', '0,0,0,0,0,90,0,90').parts('allow-unsafe')).toEqual([
    '-distort',
    'Perspective',
    '0,0,0,0,0,90,0,90',
  ])
  expect(new IMCB().distort('Arc', '60').parts('allow-unsafe')).toEqual(['-distort', 'Arc', '60'])
  expect(new IMCB().distort('Rotate', '30').parts('allow-unsafe')).toEqual(['-distort', 'Rotate', '30'])
})

test('dither method', () => {
  expect(new IMCB().dither('FloydSteinberg').parts('allow-unsafe')).toEqual(['-dither', 'FloydSteinberg'])
  expect(new IMCB().dither('Riemersma').parts('allow-unsafe')).toEqual(['-dither', 'Riemersma'])
  expect(new IMCB().dither().parts('allow-unsafe')).toEqual(['+dither'])
})

test('draw method', () => {
  expect(new IMCB().draw(d => d.circle(10, 10, 20, 20)).parts('allow-unsafe')).toEqual(['-draw', 'circle 10,10 20,20'])
  expect(new IMCB().draw(d => d.rectangle(0, 0, 100, 100)).parts('allow-unsafe')).toEqual([
    '-draw',
    'rectangle 0,0 100,100',
  ])
  expect(new IMCB().draw(d => d.text(0, 0, 'Hello World')).parts('allow-unsafe')).toEqual([
    '-draw',
    'text 0,0 "Hello World"',
  ])
})

test('draw method - shape primitives', () => {
  expect(new IMCB().draw(d => d.point(10, 20)).parts('allow-unsafe')).toEqual(['-draw', 'point 10,20'])
  expect(new IMCB().draw(d => d.line(0, 0, 100, 100)).parts('allow-unsafe')).toEqual(['-draw', 'line 0,0 100,100'])
  expect(new IMCB().draw(d => d.rectangle(10, 10, 50, 50)).parts('allow-unsafe')).toEqual([
    '-draw',
    'rectangle 10,10 50,50',
  ])
  expect(new IMCB().draw(d => d.roundRectangle(10, 10, 50, 50, 5, 5)).parts('allow-unsafe')).toEqual([
    '-draw',
    'roundRectangle 10,10 50,50 5,5',
  ])
  expect(new IMCB().draw(d => d.arc(10, 10, 50, 50, 0, 90)).parts('allow-unsafe')).toEqual([
    '-draw',
    'arc 10,10 50,50 0,90',
  ])
  expect(new IMCB().draw(d => d.ellipse(25, 25, 20, 15, 0, 360)).parts('allow-unsafe')).toEqual([
    '-draw',
    'ellipse 25,25 20,15 0,360',
  ])
  expect(new IMCB().draw(d => d.circle(50, 50, 70, 50)).parts('allow-unsafe')).toEqual(['-draw', 'circle 50,50 70,50'])
})

test('draw method - polyline and polygon', () => {
  expect(new IMCB().draw(d => d.polyline([10, 10], [20, 20], [30, 10])).parts('allow-unsafe')).toEqual([
    '-draw',
    'polyline 10,10 20,20 30,10',
  ])
  expect(new IMCB().draw(d => d.polygon([10, 10], [20, 5], [30, 15], [15, 20])).parts('allow-unsafe')).toEqual([
    '-draw',
    'polygon 10,10 20,5 30,15 15,20',
  ])
  expect(new IMCB().draw(d => d.bezier([10, 10], [20, 5], [30, 15], [40, 10])).parts('allow-unsafe')).toEqual([
    '-draw',
    'bezier 10,10 20,5 30,15 40,10',
  ])
})

test('draw method - path and image', () => {
  expect(new IMCB().draw(d => d.path('M 10,10 L 20,20 Z')).parts('allow-unsafe')).toEqual([
    '-draw',
    'path "M 10,10 L 20,20 Z"',
  ])
  expect(new IMCB().draw(d => d.image('Over', 10, 10, 100, 100, 'test.png')).parts('allow-unsafe')).toEqual([
    '-draw',
    'image Over 10,10 100,100 "test.png"',
  ])
})

test('draw method - text and gravity', () => {
  expect(new IMCB().draw(d => d.text(50, 50, 'Hello World')).parts('allow-unsafe')).toEqual([
    '-draw',
    'text 50,50 "Hello World"',
  ])
  expect(new IMCB().draw(d => d.gravity('Center')).parts('allow-unsafe')).toEqual(['-draw', 'gravity Center'])
  expect(new IMCB().draw(d => d.gravity('NorthWest')).parts('allow-unsafe')).toEqual(['-draw', 'gravity NorthWest'])
  expect(new IMCB().draw(d => d.gravity('SouthEast')).parts('allow-unsafe')).toEqual(['-draw', 'gravity SouthEast'])
})

test('draw method - transformations', () => {
  expect(new IMCB().draw(d => d.rotate(45)).parts('allow-unsafe')).toEqual(['-draw', 'rotate 45'])
  expect(new IMCB().draw(d => d.translate(10, 20)).parts('allow-unsafe')).toEqual(['-draw', 'translate 10,20'])
  expect(new IMCB().draw(d => d.scale(2, 1.5)).parts('allow-unsafe')).toEqual(['-draw', 'scale 2,1.5'])
  expect(new IMCB().draw(d => d.skewX(15)).parts('allow-unsafe')).toEqual(['-draw', 'skewX 15'])
  expect(new IMCB().draw(d => d.skewY(10)).parts('allow-unsafe')).toEqual(['-draw', 'skewY 10'])
})

test('draw method - pixel operations', () => {
  expect(new IMCB().draw(d => d.color(10, 10, 'point')).parts('allow-unsafe')).toEqual(['-draw', 'color 10,10 point'])
  expect(new IMCB().draw(d => d.color(20, 20, 'replace')).parts('allow-unsafe')).toEqual([
    '-draw',
    'color 20,20 replace',
  ])
  expect(new IMCB().draw(d => d.matte(15, 15, 'floodfill')).parts('allow-unsafe')).toEqual([
    '-draw',
    'matte 15,15 floodfill',
  ])
})

test('draw method - multiple primitives', () => {
  expect(new IMCB().draw(d => d.circle(25, 25, 35, 25).text(10, 60, 'Hello')).parts('allow-unsafe')).toEqual([
    '-draw',
    'circle 25,25 35,25 text 10,60 "Hello"',
  ])
  expect(new IMCB().draw(d => d.translate(50, 50).rotate(45).rectangle(0, 0, 20, 20)).parts('allow-unsafe')).toEqual([
    '-draw',
    'translate 50,50 rotate 45 rectangle 0,0 20,20',
  ])
  expect(new IMCB().draw(d => d.gravity('Center').text(0, 0, 'Centered').point(0, 0)).parts('allow-unsafe')).toEqual([
    '-draw',
    'gravity Center text 0,0 "Centered" point 0,0',
  ])
})

test('draw method - complex example', () => {
  expect(
    new IMCB()
      .draw(d =>
        d
          .translate(100, 100)
          .rotate(45)
          .scale(2, 2)
          .rectangle(-10, -10, 10, 10)
          .gravity('NorthEast')
          .text(0, 0, 'Rotated!')
      )
      .parts('allow-unsafe')
  ).toEqual([
    '-draw',
    'translate 100,100 rotate 45 scale 2,2 rectangle -10,-10 10,10 gravity NorthEast text 0,0 "Rotated!"',
  ])
})

test('duplicate method', () => {
  expect(new IMCB().duplicate(2).parts('allow-unsafe')).toEqual(['-duplicate', '2'])
  expect(new IMCB().duplicate(5, 0, 1, 2).parts('allow-unsafe')).toEqual(['-duplicate', '5,0,1,2'])
  expect(new IMCB().duplicate(3, 1, 3, 5).parts('allow-unsafe')).toEqual(['-duplicate', '3,1,3,5'])
})

test('encoding method', () => {
  expect(new IMCB().encoding('UTF-8').parts('allow-unsafe')).toEqual(['-encoding', 'UTF-8'])
  expect(new IMCB().encoding('Latin1').parts('allow-unsafe')).toEqual(['-encoding', 'Latin1'])
})

test('endian method', () => {
  expect(new IMCB().endian('LSB').parts('allow-unsafe')).toEqual(['-endian', 'LSB'])
  expect(new IMCB().endian('MSB').parts('allow-unsafe')).toEqual(['-endian', 'MSB'])
})

test('evaluate method', () => {
  expect(new IMCB().evaluate('Add', 50).parts('allow-unsafe')).toEqual(['-evaluate', 'Add', '50'])
  expect(new IMCB().evaluate('Multiply', 1.5).parts('allow-unsafe')).toEqual(['-evaluate', 'Multiply', '1.5'])
  expect(new IMCB().evaluate('Set', 128).parts('allow-unsafe')).toEqual(['-evaluate', 'Set', '128'])
})

test('extract method', () => {
  expect(new IMCB().extract('100x100+50+25').parts('allow-unsafe')).toEqual(['-extract', '100x100+50+25'])
  expect(new IMCB().extract('200x150').parts('allow-unsafe')).toEqual(['-extract', '200x150'])
})

test('family method', () => {
  expect(new IMCB().family('Arial').parts('allow-unsafe')).toEqual(['-family', 'Arial'])
  expect(new IMCB().family('Times New Roman').parts('allow-unsafe')).toEqual(['-family', 'Times New Roman'])
})

test('format method', () => {
  expect(new IMCB().format('%wx%h').parts('allow-unsafe')).toEqual(['-format', '%wx%h'])
  expect(new IMCB().format('%f').parts('allow-unsafe')).toEqual(['-format', '%f'])
})

test('frame method', () => {
  expect(new IMCB().frame(10, 10).parts('allow-unsafe')).toEqual(['-frame', '10x10'])
  expect(new IMCB().frame(15, 20, 5).parts('allow-unsafe')).toEqual(['-frame', '15x20+5'])
  expect(new IMCB().frame(20, 25, 8, 3).parts('allow-unsafe')).toEqual(['-frame', '20x25+8+3'])
  expect(new IMCB().frame(5).parts('allow-unsafe')).toEqual(['-frame', '5'])
})

test('function method', () => {
  expect(new IMCB().function('Polynomial', 1, 2, 3).parts('allow-unsafe')).toEqual(['-function', 'Polynomial', '1,2,3'])
  expect(new IMCB().function('Sinusoid', 1, 0, 0.5).parts('allow-unsafe')).toEqual(['-function', 'Sinusoid', '1,0,0.5'])
})

test('fuzz method', () => {
  expect(new IMCB().fuzz('10%').parts('allow-unsafe')).toEqual(['-fuzz', '10%'])
  expect(new IMCB().fuzz(5).parts('allow-unsafe')).toEqual(['-fuzz', '5'])
})

test('fx method', () => {
  expect(new IMCB().fx('u*0.5').parts('allow-unsafe')).toEqual(['-fx', 'u*0.5'])
  expect(new IMCB().fx('(u+v)/2').parts('allow-unsafe')).toEqual(['-fx', '(u+v)/2'])
})

test('identify method', () => {
  expect(new IMCB().identify().parts('allow-unsafe')).toEqual(['-identify'])
})

test('insert method', () => {
  expect(new IMCB().insert(0).parts('allow-unsafe')).toEqual(['-insert', '0'])
  expect(new IMCB().insert(3).parts('allow-unsafe')).toEqual(['-insert', '3'])
})

test('intent method', () => {
  expect(new IMCB().intent('Perceptual').parts('allow-unsafe')).toEqual(['-intent', 'Perceptual'])
  expect(new IMCB().intent('Relative').parts('allow-unsafe')).toEqual(['-intent', 'Relative'])
})

test('interlace method', () => {
  expect(new IMCB().interlace('None').parts('allow-unsafe')).toEqual(['-interlace', 'None'])
  expect(new IMCB().interlace('Line').parts('allow-unsafe')).toEqual(['-interlace', 'Line'])
  expect(new IMCB().interlace('Plane').parts('allow-unsafe')).toEqual(['-interlace', 'Plane'])
})

test('kerning method', () => {
  expect(new IMCB().kerning(2).parts('allow-unsafe')).toEqual(['-kerning', '2'])
  expect(new IMCB().kerning(-1.5).parts('allow-unsafe')).toEqual(['-kerning', '-1.5'])
})

test('lat method', () => {
  expect(new IMCB().lat(10, 10).parts('allow-unsafe')).toEqual(['-lat', '10x10'])
  expect(new IMCB().lat(10, 10, 5).parts('allow-unsafe')).toEqual(['-lat', '10x10+5'])
  expect(new IMCB().lat(20, 15, '8%').parts('allow-unsafe')).toEqual(['-lat', '20x15+8%'])

  // negative offset increases sensitivity; must emit -5, not +-5
  expect(new IMCB().lat(10, 10, -5).parts('allow-unsafe')).toEqual(['-lat', '10x10-5'])
})

test('layers method', () => {
  expect(new IMCB().layers('coalesce').parts('allow-unsafe')).toEqual(['-layers', 'coalesce'])
  expect(new IMCB().layers('optimize').parts('allow-unsafe')).toEqual(['-layers', 'optimize'])
})

test('level method', () => {
  expect(new IMCB().level(0, 100).parts('allow-unsafe')).toEqual(['-level', '0,100'])
  expect(new IMCB().level(10, 90, 1.2).parts('allow-unsafe')).toEqual(['-level', '10,90,1.2'])
})

test('limit method', () => {
  expect(new IMCB().limit('memory', '256MB').parts('allow-unsafe')).toEqual(['-limit', 'memory', '256MB'])
  expect(new IMCB().limit('disk', '1GB').parts('allow-unsafe')).toEqual(['-limit', 'disk', '1GB'])
  expect(new IMCB().limit('thread', '4').parts('allow-unsafe')).toEqual(['-limit', 'thread', '4'])
})

test('linearStretch method', () => {
  expect(new IMCB().linearStretch(1, 2).parts('allow-unsafe')).toEqual(['-linear-stretch', '1x2'])
  expect(new IMCB().linearStretch(5).parts('allow-unsafe')).toEqual(['-linear-stretch', '5'])
  expect(new IMCB().linearStretch('1%', '2%').parts('allow-unsafe')).toEqual(['-linear-stretch', '1%x2%'])
})

test('liquidRescale method', () => {
  expect(new IMCB().liquidRescale(75).parts('allow-unsafe')).toEqual(['-liquid-rescale', '75'])
  expect(new IMCB().liquidRescale(100, 150).parts('allow-unsafe')).toEqual(['-liquid-rescale', '100x150'])
  expect(new IMCB().liquidRescale(200, 300, 5).parts('allow-unsafe')).toEqual(['-liquid-rescale', '200x300+5'])
  expect(new IMCB().liquidRescale(150, 200, 3, 1).parts('allow-unsafe')).toEqual(['-liquid-rescale', '150x200+3+1'])
})

test('loop method', () => {
  expect(new IMCB().loop(0).parts('allow-unsafe')).toEqual(['-loop', '0'])
  expect(new IMCB().loop(5).parts('allow-unsafe')).toEqual(['-loop', '5'])
  expect(new IMCB().loop(10).parts('allow-unsafe')).toEqual(['-loop', '10'])
})

test('matteColor method', () => {
  expect(new IMCB().mattecolor('blue').parts('allow-unsafe')).toEqual(['-mattecolor', 'blue'])
  expect(new IMCB().mattecolor('#FF0000').parts('allow-unsafe')).toEqual(['-mattecolor', '#FF0000'])
  expect(new IMCB().mattecolor('transparent').parts('allow-unsafe')).toEqual(['-mattecolor', 'transparent'])
})

test('modulate method', () => {
  expect(new IMCB().modulate().parts('allow-unsafe')).toEqual(['-modulate', '100'])
  expect(new IMCB().modulate(120).parts('allow-unsafe')).toEqual(['-modulate', '120'])
  expect(new IMCB().modulate(100, 150).parts('allow-unsafe')).toEqual(['-modulate', '100,150'])
  expect(new IMCB().modulate(100, 150, 80).parts('allow-unsafe')).toEqual(['-modulate', '100,150,80'])
})

test('monitor method', () => {
  expect(new IMCB().monitor().parts('allow-unsafe')).toEqual(['-monitor'])
  expect(new IMCB().monitor(true).parts('allow-unsafe')).toEqual(['-monitor'])
  expect(new IMCB().monitor(false).parts('allow-unsafe')).toEqual(['+monitor'])
})

test('morphology method', () => {
  expect(new IMCB().morphology('Erode', 'diamond:1').parts('allow-unsafe')).toEqual([
    '-morphology',
    'Erode',
    'diamond:1',
  ])
  expect(new IMCB().morphology('Dilate', 'square:2').parts('allow-unsafe')).toEqual([
    '-morphology',
    'Dilate',
    'square:2',
  ])
  expect(new IMCB().morphology('Open', 'disk:3', 2).parts('allow-unsafe')).toEqual(['-morphology', 'Open:2', 'disk:3'])
})

test('mosaic method', () => {
  expect(new IMCB().mosaic().parts('allow-unsafe')).toEqual(['-mosaic'])
})

test('motionBlur method', () => {
  expect(new IMCB().motionBlur(0, 20, 45).parts('allow-unsafe')).toEqual(['-motion-blur', '0x20+45'])
  expect(new IMCB().motionBlur(5, 10, 90).parts('allow-unsafe')).toEqual(['-motion-blur', '5x10+90'])
  expect(new IMCB().motionBlur(2, 5, 180).parts('allow-unsafe')).toEqual(['-motion-blur', '2x5+180'])
  expect(new IMCB().motionBlur(0, 5, -45).parts('allow-unsafe')).toEqual(['-motion-blur', '0x5-45'])
})

test('noise method', () => {
  // +noise type adds noise
  expect(new IMCB().noise('Gaussian').parts('allow-unsafe')).toEqual(['+noise', 'Gaussian'])
  expect(new IMCB().noise('Poisson').parts('allow-unsafe')).toEqual(['+noise', 'Poisson'])

  // -noise radius reduces noise
  expect(new IMCB().noise(3).parts('allow-unsafe')).toEqual(['-noise', '3'])
})

test('orderedDither method', () => {
  expect(new IMCB().orderedDither('4x4').parts('allow-unsafe')).toEqual(['-ordered-dither', '4x4'])
  expect(new IMCB().orderedDither('o8x8').parts('allow-unsafe')).toEqual(['-ordered-dither', 'o8x8'])
  expect(new IMCB().orderedDither('h8x8a').parts('allow-unsafe')).toEqual(['-ordered-dither', 'h8x8a'])
})

test('orient method', () => {
  expect(new IMCB().orient('TopLeft').parts('allow-unsafe')).toEqual(['-orient', 'TopLeft'])
  expect(new IMCB().orient('RightTop').parts('allow-unsafe')).toEqual(['-orient', 'RightTop'])
  expect(new IMCB().orient('BottomRight').parts('allow-unsafe')).toEqual(['-orient', 'BottomRight'])
})

test('page method', () => {
  expect(new IMCB().page('A4').parts('allow-unsafe')).toEqual(['-page', 'A4'])
  expect(new IMCB().page('612x792+0+0').parts('allow-unsafe')).toEqual(['-page', '612x792+0+0'])
  expect(new IMCB().page().parts('allow-unsafe')).toEqual(['+page'])
})

test('paint method', () => {
  expect(new IMCB().paint(5).parts('allow-unsafe')).toEqual(['-paint', '5'])
  expect(new IMCB().paint(10).parts('allow-unsafe')).toEqual(['-paint', '10'])
  expect(new IMCB().paint(2).parts('allow-unsafe')).toEqual(['-paint', '2'])
})

test('polaroid method', () => {
  expect(new IMCB().polaroid(15).parts('allow-unsafe')).toEqual(['-polaroid', '15'])
  expect(new IMCB().polaroid(-10).parts('allow-unsafe')).toEqual(['-polaroid', '-10'])
  expect(new IMCB().polaroid(45).parts('allow-unsafe')).toEqual(['-polaroid', '45'])
})

test('posterize method', () => {
  expect(new IMCB().posterize(4).parts('allow-unsafe')).toEqual(['-posterize', '4'])
  expect(new IMCB().posterize(8).parts('allow-unsafe')).toEqual(['-posterize', '8'])
  expect(new IMCB().posterize(16).parts('allow-unsafe')).toEqual(['-posterize', '16'])
})

test('preview method', () => {
  expect(new IMCB().preview('Rotate').parts('allow-unsafe')).toEqual(['-preview', 'Rotate'])
  expect(new IMCB().preview('Blur').parts('allow-unsafe')).toEqual(['-preview', 'Blur'])
  expect(new IMCB().preview('Sharpen').parts('allow-unsafe')).toEqual(['-preview', 'Sharpen'])
})

test('print method', () => {
  expect(new IMCB().print('Image: %f\n').parts('allow-unsafe')).toEqual(['-print', 'Image: %f\n'])
  expect(new IMCB().print('%wx%h').parts('allow-unsafe')).toEqual(['-print', '%wx%h'])
  expect(new IMCB().print('%[fx:mean]').parts('allow-unsafe')).toEqual(['-print', '%[fx:mean]'])
})

test('profile method', () => {
  expect(new IMCB().profile('sRGB.icc').parts('allow-unsafe')).toEqual(['-profile', 'sRGB.icc'])
  expect(new IMCB().profile('AdobeRGB.icc').parts('allow-unsafe')).toEqual(['-profile', 'AdobeRGB.icc'])
  expect(new IMCB().profile('!xmp,*', true).parts('allow-unsafe')).toEqual(['+profile', '!xmp,*'])
})

test('quantize method', () => {
  expect(new IMCB().quantize('YUV').parts('allow-unsafe')).toEqual(['-quantize', 'YUV'])
  expect(new IMCB().quantize('RGB').parts('allow-unsafe')).toEqual(['-quantize', 'RGB'])
  expect(new IMCB().quantize('Gray').parts('allow-unsafe')).toEqual(['-quantize', 'Gray'])
})

test('quiet method', () => {
  expect(new IMCB().quiet().parts('allow-unsafe')).toEqual(['-quiet'])
  expect(new IMCB().quiet(true).parts('allow-unsafe')).toEqual(['-quiet'])
  expect(new IMCB().quiet(false).parts('allow-unsafe')).toEqual(['+quiet'])
})

test('rotationalBlur method', () => {
  expect(new IMCB().rotationalBlur(10).parts('allow-unsafe')).toEqual(['-rotational-blur', '10'])
  expect(new IMCB().rotationalBlur(45).parts('allow-unsafe')).toEqual(['-rotational-blur', '45'])
  expect(new IMCB().rotationalBlur(5).parts('allow-unsafe')).toEqual(['-rotational-blur', '5'])
})

test('raise method', () => {
  expect(new IMCB().raise(10, 10).parts('allow-unsafe')).toEqual(['-raise', '10x10'])
  expect(new IMCB().raise(5, 5, true).parts('allow-unsafe')).toEqual(['+raise', '5x5'])
  expect(new IMCB().raise(8).parts('allow-unsafe')).toEqual(['-raise', '8'])
})

test('randomThreshold method', () => {
  expect(new IMCB().randomThreshold('20%', '80%').parts('allow-unsafe')).toEqual(['-random-threshold', '20%,80%'])
  expect(new IMCB().randomThreshold(20, 80).parts('allow-unsafe')).toEqual(['-random-threshold', '20,80'])
  expect(new IMCB().randomThreshold('10%', '90%').parts('allow-unsafe')).toEqual(['-random-threshold', '10%,90%'])
})

test('redPrimary method', () => {
  expect(new IMCB().redPrimary(0.64, 0.33).parts('allow-unsafe')).toEqual(['-red-primary', '0.64,0.33'])
  expect(new IMCB().redPrimary(0.7, 0.3).parts('allow-unsafe')).toEqual(['-red-primary', '0.7,0.3'])
})

test('regardWarnings method', () => {
  expect(new IMCB().regardWarnings().parts('allow-unsafe')).toEqual(['-regard-warnings'])
  expect(new IMCB().regardWarnings(true).parts('allow-unsafe')).toEqual(['-regard-warnings'])
  expect(new IMCB().regardWarnings(false).parts('allow-unsafe')).toEqual(['+regard-warnings'])
})

test('remap method', () => {
  expect(new IMCB().remap('palette.gif').parts('allow-unsafe')).toEqual(['-remap', 'palette.gif'])
  expect(new IMCB().remap('colors.png').parts('allow-unsafe')).toEqual(['-remap', 'colors.png'])
})

test('render method', () => {
  expect(new IMCB().render().parts('allow-unsafe')).toEqual(['-render'])
  expect(new IMCB().render(true).parts('allow-unsafe')).toEqual(['-render'])
  expect(new IMCB().render(false).parts('allow-unsafe')).toEqual(['+render'])
})

test('repage method', () => {
  expect(new IMCB().repage('100x100+0+0').parts('allow-unsafe')).toEqual(['-repage', '100x100+0+0'])
  expect(new IMCB().repage('200x150').parts('allow-unsafe')).toEqual(['-repage', '200x150'])
  expect(new IMCB().repage().parts('allow-unsafe')).toEqual(['+repage'])
})

test('resample method', () => {
  expect(new IMCB().resample('300x300').parts('allow-unsafe')).toEqual(['-resample', '300x300'])
  expect(new IMCB().resample('72').parts('allow-unsafe')).toEqual(['-resample', '72'])
  expect(new IMCB().resample('150x150').parts('allow-unsafe')).toEqual(['-resample', '150x150'])
})

test('roll method', () => {
  expect(new IMCB().roll(20, 10).parts('allow-unsafe')).toEqual(['-roll', '+20+10'])
  expect(new IMCB().roll(-50, -25).parts('allow-unsafe')).toEqual(['-roll', '-50-25'])
  expect(new IMCB().roll(30, -15).parts('allow-unsafe')).toEqual(['-roll', '+30-15'])

  // zero coordinates must keep their sign so digits do not merge
  expect(new IMCB().roll(5, 0).parts('allow-unsafe')).toEqual(['-roll', '+5+0'])
  expect(new IMCB().roll(0, 5).parts('allow-unsafe')).toEqual(['-roll', '+0+5'])
})

test('sample method', () => {
  expect(new IMCB().sample('50%').parts('allow-unsafe')).toEqual(['-sample', '50%'])
  expect(new IMCB().sample('200x100').parts('allow-unsafe')).toEqual(['-sample', '200x100'])
  expect(new IMCB().sample('300x200!').parts('allow-unsafe')).toEqual(['-sample', '300x200!'])
})

test('samplingFactor method', () => {
  expect(new IMCB().samplingFactor('4:2:0').parts('allow-unsafe')).toEqual(['-sampling-factor', '4:2:0'])
  expect(new IMCB().samplingFactor('4:4:4').parts('allow-unsafe')).toEqual(['-sampling-factor', '4:4:4'])
  expect(new IMCB().samplingFactor('2x2').parts('allow-unsafe')).toEqual(['-sampling-factor', '2x2'])
})

test('scale method', () => {
  expect(new IMCB().scale('50%').parts('allow-unsafe')).toEqual(['-scale', '50%'])
  expect(new IMCB().scale('200x100').parts('allow-unsafe')).toEqual(['-scale', '200x100'])
  expect(new IMCB().scale('300x200!').parts('allow-unsafe')).toEqual(['-scale', '300x200!'])
})

test('scene method', () => {
  expect(new IMCB().scene(5).parts('allow-unsafe')).toEqual(['-scene', '5'])
  expect(new IMCB().scene(0).parts('allow-unsafe')).toEqual(['-scene', '0'])
  expect(new IMCB().scene(100).parts('allow-unsafe')).toEqual(['-scene', '100'])
})

test('seed method', () => {
  expect(new IMCB().seed(123).parts('allow-unsafe')).toEqual(['-seed', '123'])
  expect(new IMCB().seed(456).parts('allow-unsafe')).toEqual(['-seed', '456'])
  expect(new IMCB().seed(0).parts('allow-unsafe')).toEqual(['-seed', '0'])
})

test('segment method', () => {
  expect(new IMCB().segment(1, 1.5).parts('allow-unsafe')).toEqual(['-segment', '1x1.5'])
  expect(new IMCB().segment(2, 2.0).parts('allow-unsafe')).toEqual(['-segment', '2x2'])
  expect(new IMCB().segment(0.5, 0.8).parts('allow-unsafe')).toEqual(['-segment', '0.5x0.8'])
})

test('selectiveBlur method', () => {
  expect(new IMCB().selectiveBlur(0, 1, '10%').parts('allow-unsafe')).toEqual(['-selective-blur', '0x1+10%'])
  expect(new IMCB().selectiveBlur(2, 3, '5%').parts('allow-unsafe')).toEqual(['-selective-blur', '2x3+5%'])
  expect(new IMCB().selectiveBlur(5, 2, '15%').parts('allow-unsafe')).toEqual(['-selective-blur', '5x2+15%'])
})

test('separate method', () => {
  expect(new IMCB().separate().parts('allow-unsafe')).toEqual(['-separate'])
})

test('sepiaTone method', () => {
  expect(new IMCB().sepiaTone('80%').parts('allow-unsafe')).toEqual(['-sepia-tone', '80%'])
  expect(new IMCB().sepiaTone('50%').parts('allow-unsafe')).toEqual(['-sepia-tone', '50%'])
  expect(new IMCB().sepiaTone('90%').parts('allow-unsafe')).toEqual(['-sepia-tone', '90%'])
})

test('set method', () => {
  expect(new IMCB().set('comment', 'My photo').parts('allow-unsafe')).toEqual(['-set', 'comment', 'My photo'])
  expect(new IMCB().set('label', 'Test Image').parts('allow-unsafe')).toEqual(['-set', 'label', 'Test Image'])
  expect(new IMCB().set('comment').parts('allow-unsafe')).toEqual(['+set', 'comment'])
})

test('shade method', () => {
  expect(new IMCB().shade(30, 30).parts('allow-unsafe')).toEqual(['-shade', '30x30'])
  expect(new IMCB().shade(45, 45, true).parts('allow-unsafe')).toEqual(['+shade', '45x45'])
  expect(new IMCB().shade(60, 20).parts('allow-unsafe')).toEqual(['-shade', '60x20'])
})

test('shadow method', () => {
  expect(new IMCB().shadow(80, 3, 5, 5).parts('allow-unsafe')).toEqual(['-shadow', '80x3+5+5'])
  expect(new IMCB().shadow(60, 4).parts('allow-unsafe')).toEqual(['-shadow', '60x4'])
  expect(new IMCB().shadow(80).parts('allow-unsafe')).toEqual(['-shadow', '80'])
  expect(new IMCB().shadow(80, 3, -5, -5).parts('allow-unsafe')).toEqual(['-shadow', '80x3-5-5'])
})

test('shave method', () => {
  expect(new IMCB().shave(10, 10).parts('allow-unsafe')).toEqual(['-shave', '10x10'])
  expect(new IMCB().shave(5, 8).parts('allow-unsafe')).toEqual(['-shave', '5x8'])
  expect(new IMCB().shave('10%', '10%').parts('allow-unsafe')).toEqual(['-shave', '10%x10%'])
})

test('shear method', () => {
  expect(new IMCB().shear(30, 0).parts('allow-unsafe')).toEqual(['-shear', '30x0'])
  expect(new IMCB().shear(0, 30).parts('allow-unsafe')).toEqual(['-shear', '0x30'])
  expect(new IMCB().shear(15, 10).parts('allow-unsafe')).toEqual(['-shear', '15x10'])

  // single value: imagemagick applies it to both axes
  expect(new IMCB().shear(20).parts('allow-unsafe')).toEqual(['-shear', '20'])
})

test('sigmoidalContrast method', () => {
  expect(new IMCB().sigmoidalContrast(3, 50).parts('allow-unsafe')).toEqual(['-sigmoidal-contrast', '3x50'])
  expect(new IMCB().sigmoidalContrast(3, '50%').parts('allow-unsafe')).toEqual(['-sigmoidal-contrast', '3x50%'])
  expect(new IMCB().sigmoidalContrast(3, '50%', true).parts('allow-unsafe')).toEqual(['-sigmoidal-contrast', '3x50%'])
  expect(new IMCB().sigmoidalContrast(3, '50%', false).parts('allow-unsafe')).toEqual(['+sigmoidal-contrast', '3x50%'])
  expect(new IMCB().sigmoidalContrast(5, 25).parts('allow-unsafe')).toEqual(['-sigmoidal-contrast', '5x25'])
})

test('sketch method', () => {
  expect(new IMCB().sketch(0, 20, 120).parts('allow-unsafe')).toEqual(['-sketch', '0x20+120'])
  expect(new IMCB().sketch(2, 10, 90).parts('allow-unsafe')).toEqual(['-sketch', '2x10+90'])
  expect(new IMCB().sketch(5, 15, 45).parts('allow-unsafe')).toEqual(['-sketch', '5x15+45'])
})

test('smush method', () => {
  // -smush stacks top-to-bottom (like -append); +smush joins left-to-right
  expect(new IMCB().smush(10).parts('allow-unsafe')).toEqual(['-smush', '10'])
  expect(new IMCB().smush(-5).parts('allow-unsafe')).toEqual(['-smush', '-5'])
  expect(new IMCB().smush(15, true).parts('allow-unsafe')).toEqual(['+smush', '15'])
})

test('solarize method', () => {
  expect(new IMCB().solarize('50%').parts('allow-unsafe')).toEqual(['-solarize', '50%'])
  expect(new IMCB().solarize(128).parts('allow-unsafe')).toEqual(['-solarize', '128'])
  expect(new IMCB().solarize('75%').parts('allow-unsafe')).toEqual(['-solarize', '75%'])
})

test('splice method', () => {
  expect(new IMCB().splice(10, 10, 100, 100).parts('allow-unsafe')).toEqual(['-splice', '10x10+100+100'])
  expect(new IMCB().splice(20, 15, 50, 75).parts('allow-unsafe')).toEqual(['-splice', '20x15+50+75'])
  expect(new IMCB().splice(5, 8, 25, 30).parts('allow-unsafe')).toEqual(['-splice', '5x8+25+30'])
  expect(new IMCB().splice(g => g.size(0, 10).offset(0, 0)).parts('allow-unsafe')).toEqual(['-splice', '0x10+0+0'])
})

test('spread method', () => {
  expect(new IMCB().spread(3).parts('allow-unsafe')).toEqual(['-spread', '3'])
  expect(new IMCB().spread(5).parts('allow-unsafe')).toEqual(['-spread', '5'])
  expect(new IMCB().spread(1).parts('allow-unsafe')).toEqual(['-spread', '1'])
})

test('statistic method', () => {
  expect(new IMCB().statistic('Median', 2, 2).parts('allow-unsafe')).toEqual(['-statistic', 'Median', '2x2'])
  expect(new IMCB().statistic('Mean', 3, 3).parts('allow-unsafe')).toEqual(['-statistic', 'Mean', '3x3'])
  expect(new IMCB().statistic('Maximum', 1, 1).parts('allow-unsafe')).toEqual(['-statistic', 'Maximum', '1x1'])
  expect(new IMCB().statistic('Contrast', 2, 2).parts('allow-unsafe')).toEqual(['-statistic', 'Contrast', '2x2'])
  expect(new IMCB().statistic('NonPeak', 2, 2).parts('allow-unsafe')).toEqual(['-statistic', 'NonPeak', '2x2'])
})

test('stretch method', () => {
  expect(new IMCB().stretch('Normal').parts('allow-unsafe')).toEqual(['-stretch', 'Normal'])
  expect(new IMCB().stretch('Condensed').parts('allow-unsafe')).toEqual(['-stretch', 'Condensed'])
  expect(new IMCB().stretch('Expanded').parts('allow-unsafe')).toEqual(['-stretch', 'Expanded'])
})

test('stroke method', () => {
  expect(new IMCB().stroke('black').parts('allow-unsafe')).toEqual(['-stroke', 'black'])
  expect(new IMCB().stroke('#FF0000').parts('allow-unsafe')).toEqual(['-stroke', '#FF0000'])
  expect(new IMCB().stroke('blue').parts('allow-unsafe')).toEqual(['-stroke', 'blue'])
})

test('strokeWidth method', () => {
  expect(new IMCB().strokewidth(2).parts('allow-unsafe')).toEqual(['-strokewidth', '2'])
  expect(new IMCB().strokewidth(1).parts('allow-unsafe')).toEqual(['-strokewidth', '1'])
  expect(new IMCB().strokewidth(5).parts('allow-unsafe')).toEqual(['-strokewidth', '5'])
})

test('style method', () => {
  expect(new IMCB().style('Italic').parts('allow-unsafe')).toEqual(['-style', 'Italic'])
  expect(new IMCB().style('Normal').parts('allow-unsafe')).toEqual(['-style', 'Normal'])
  expect(new IMCB().style('Oblique').parts('allow-unsafe')).toEqual(['-style', 'Oblique'])
})

test('virtualPixel method', () => {
  expect(new IMCB().virtualPixel('Edge').parts('allow-unsafe')).toEqual(['-virtual-pixel', 'Edge'])
  expect(new IMCB().virtualPixel('Mirror').parts('allow-unsafe')).toEqual(['-virtual-pixel', 'Mirror'])
  expect(new IMCB().virtualPixel('Transparent').parts('allow-unsafe')).toEqual(['-virtual-pixel', 'Transparent'])
})

test('swirl method', () => {
  expect(new IMCB().swirl(90).parts('allow-unsafe')).toEqual(['-swirl', '90'])
  expect(new IMCB().swirl(-45).parts('allow-unsafe')).toEqual(['-swirl', '-45'])
  expect(new IMCB().swirl(180).parts('allow-unsafe')).toEqual(['-swirl', '180'])
})

test('texture method', () => {
  expect(new IMCB().texture('pattern.jpg').parts('allow-unsafe')).toEqual(['-texture', 'pattern.jpg'])
  expect(new IMCB().texture('tile.png').parts('allow-unsafe')).toEqual(['-texture', 'tile.png'])
})

test('threshold method', () => {
  expect(new IMCB().threshold('50%').parts('allow-unsafe')).toEqual(['-threshold', '50%'])
  expect(new IMCB().threshold(128).parts('allow-unsafe')).toEqual(['-threshold', '128'])
  expect(new IMCB().threshold().parts('allow-unsafe')).toEqual(['+threshold'])
})

test('thumbnail method', () => {
  expect(new IMCB().thumbnail(150, 150).parts('allow-unsafe')).toEqual(['-thumbnail', '150x150'])
  expect(new IMCB().thumbnail(100).parts('allow-unsafe')).toEqual(['-thumbnail', '100'])
  expect(new IMCB().thumbnail(undefined, 200).parts('allow-unsafe')).toEqual(['-thumbnail', 'x200'])
})

test('thumbnail with callback', () => {
  expect(new IMCB().thumbnail(g => g.scale(50)).parts('allow-unsafe')).toEqual(['-thumbnail', '50%'])
  expect(new IMCB().thumbnail(g => g.size(100, 100).flag('!')).parts('allow-unsafe')).toEqual([
    '-thumbnail',
    '100x100!',
  ])
})

test('tile method', () => {
  expect(new IMCB().tile('pattern.png').parts('allow-unsafe')).toEqual(['-tile', 'pattern.png'])
  expect(new IMCB().tile('texture.jpg').parts('allow-unsafe')).toEqual(['-tile', 'texture.jpg'])
})

test('tint method', () => {
  expect(new IMCB().tint('50%').parts('allow-unsafe')).toEqual(['-tint', '50%'])
  expect(new IMCB().tint(25).parts('allow-unsafe')).toEqual(['-tint', '25'])
  expect(new IMCB().tint('100%').parts('allow-unsafe')).toEqual(['-tint', '100%'])
})

test('transform method', () => {
  expect(new IMCB().transform().parts('allow-unsafe')).toEqual(['-transform'])
})

test('transparent method', () => {
  expect(new IMCB().transparent('white').parts('allow-unsafe')).toEqual(['-transparent', 'white'])
  expect(new IMCB().transparent('#FF0000').parts('allow-unsafe')).toEqual(['-transparent', '#FF0000'])
})

test('transpose method', () => {
  expect(new IMCB().transpose().parts('allow-unsafe')).toEqual(['-transpose'])
})

test('transverse method', () => {
  expect(new IMCB().transverse().parts('allow-unsafe')).toEqual(['-transverse'])
})

test('treedepth method', () => {
  expect(new IMCB().treedepth(8).parts('allow-unsafe')).toEqual(['-treedepth', '8'])
  expect(new IMCB().treedepth(16).parts('allow-unsafe')).toEqual(['-treedepth', '16'])
})

test('type method', () => {
  expect(new IMCB().type('Grayscale').parts('allow-unsafe')).toEqual(['-type', 'Grayscale'])
  expect(new IMCB().type('Palette').parts('allow-unsafe')).toEqual(['-type', 'Palette'])
  expect(new IMCB().type('TrueColorAlpha').parts('allow-unsafe')).toEqual(['-type', 'TrueColorAlpha'])
})

test('undercolor method', () => {
  expect(new IMCB().undercolor('blue').parts('allow-unsafe')).toEqual(['-undercolor', 'blue'])
  expect(new IMCB().undercolor('#00FF00').parts('allow-unsafe')).toEqual(['-undercolor', '#00FF00'])
})

test('uniqueColors method', () => {
  expect(new IMCB().uniqueColors().parts('allow-unsafe')).toEqual(['-unique-colors'])
})

test('units method', () => {
  expect(new IMCB().units('PixelsPerInch').parts('allow-unsafe')).toEqual(['-units', 'PixelsPerInch'])
  expect(new IMCB().units('PixelsPerCentimeter').parts('allow-unsafe')).toEqual(['-units', 'PixelsPerCentimeter'])
})

test('unsharp method', () => {
  expect(new IMCB().unsharp(0, 0.5, 0.5, 0.1).parts('allow-unsafe')).toEqual(['-unsharp', '0x0.5+0.5+0.1'])
  expect(new IMCB().unsharp(2, 1, 1, 0.05).parts('allow-unsafe')).toEqual(['-unsharp', '2x1+1+0.05'])
})

test('verbose method', () => {
  expect(new IMCB().verbose().parts('allow-unsafe')).toEqual(['-verbose'])
  expect(new IMCB().verbose(true).parts('allow-unsafe')).toEqual(['-verbose'])
  expect(new IMCB().verbose(false).parts('allow-unsafe')).toEqual(['+verbose'])
})

test('version method', () => {
  expect(new IMCB().version().parts('allow-unsafe')).toEqual(['-version'])
})

test('vignette method', () => {
  expect(new IMCB().vignette(0, 150).parts('allow-unsafe')).toEqual(['-vignette', '0x150'])
  expect(new IMCB().vignette(2, 100, 5, 5).parts('allow-unsafe')).toEqual(['-vignette', '2x100+5+5'])
  expect(new IMCB().vignette(5).parts('allow-unsafe')).toEqual(['-vignette', '5'])
  expect(new IMCB().vignette(0, 2, '10%', '10%').parts('allow-unsafe')).toEqual(['-vignette', '0x2+10%+10%'])
})

test('wave method', () => {
  expect(new IMCB().wave(25, 150).parts('allow-unsafe')).toEqual(['-wave', '25x150'])
  expect(new IMCB().wave(10, 100).parts('allow-unsafe')).toEqual(['-wave', '10x100'])
})

test('weight method', () => {
  expect(new IMCB().weight('Bold').parts('allow-unsafe')).toEqual(['-weight', 'Bold'])
  expect(new IMCB().weight(400).parts('allow-unsafe')).toEqual(['-weight', '400'])
})

test('whitePoint method', () => {
  expect(new IMCB().whitePoint(0.3127, 0.329).parts('allow-unsafe')).toEqual(['-white-point', '0.3127,0.329'])
  expect(new IMCB().whitePoint(0.31, 0.33).parts('allow-unsafe')).toEqual(['-white-point', '0.31,0.33'])
})

test('whiteThreshold method', () => {
  expect(new IMCB().whiteThreshold('80%').parts('allow-unsafe')).toEqual(['-white-threshold', '80%'])
  expect(new IMCB().whiteThreshold(200).parts('allow-unsafe')).toEqual(['-white-threshold', '200'])
})

test('write method', () => {
  expect(new IMCB().write('output.png').parts('allow-unsafe')).toEqual(['-write', 'output.png'])
  expect(new IMCB().write('temp.jpg').parts('allow-unsafe')).toEqual(['-write', 'temp.jpg'])
})

test('swap method', () => {
  expect(new IMCB().swap(0, 1).parts('allow-unsafe')).toEqual(['-swap', '0,1'])
  expect(new IMCB().swap(2, 3).parts('allow-unsafe')).toEqual(['-swap', '2,3'])
  expect(new IMCB().swap(1, 4).parts('allow-unsafe')).toEqual(['-swap', '1,4'])
})

test('xc method variations', () => {
  expect(new IMCB().xc().parts('allow-unsafe')).toEqual(['xc:'])
  expect(new IMCB().xc('red').parts('allow-unsafe')).toEqual(['xc:red'])
  expect(new IMCB().xc('red', 200).parts('allow-unsafe')).toEqual(['xc:red[200]'])
  expect(new IMCB().xc('red', 200, 100).parts('allow-unsafe')).toEqual(['xc:red[200x100!]'])
  expect(new IMCB().xc(150).parts('allow-unsafe')).toEqual(['xc:[150]'])
  expect(new IMCB().xc(300, 200).parts('allow-unsafe')).toEqual(['xc:[300x200!]'])
  expect(new IMCB().xc('#FF0000').parts('allow-unsafe')).toEqual(['xc:#FF0000'])
  expect(new IMCB().xc('#FF0000', 100).parts('allow-unsafe')).toEqual(['xc:#FF0000[100]'])
  expect(new IMCB().xc('#FF0000', 100, 200).parts('allow-unsafe')).toEqual(['xc:#FF0000[100x200!]'])
  expect(new IMCB().xc('blue').parts('allow-unsafe')).toEqual(['xc:blue'])
  expect(new IMCB().xc('none').parts('allow-unsafe')).toEqual(['xc:none'])
  expect(new IMCB().xc('white', 50).parts('allow-unsafe')).toEqual(['xc:white[50]'])
})

test('canvas method (alias for xc)', () => {
  // canvas is exactly like xc but output canvas: prefix
  expect(new IMCB().canvas().parts('allow-unsafe')).toEqual(['canvas:'])
  expect(new IMCB().canvas('red').parts('allow-unsafe')).toEqual(['canvas:red'])
  expect(new IMCB().canvas('red', 200).parts('allow-unsafe')).toEqual(['canvas:red[200]'])
  expect(new IMCB().canvas('red', 200, 100).parts('allow-unsafe')).toEqual(['canvas:red[200x100!]'])
  expect(new IMCB().canvas(150).parts('allow-unsafe')).toEqual(['canvas:[150]'])
  expect(new IMCB().canvas(300, 200).parts('allow-unsafe')).toEqual(['canvas:[300x200!]'])
})

test('resource method with string', () => {
  const im = new IMCB()

  im.resource('image.png')

  expect(im.parts('allow-unsafe')).toEqual(['image.png'])
})

test('resource method with buffer creates fd reference', () => {
  const im = new IMCB()
  const buffer = Buffer.from('test image data')

  im.resource(buffer)

  expect(im.parts('allow-unsafe')).toEqual(['fd:3'])
  expect(im.fds()).toEqual([buffer])
})

test('multiple buffers get sequential fd numbers', () => {
  const im = new IMCB()
  const buffer1 = Buffer.from('image1')
  const buffer2 = Buffer.from('image2')
  const buffer3 = Buffer.from('image3')

  im.resource(buffer1)
  im.resource(buffer2)
  im.resource(buffer3)

  expect(im.parts('allow-unsafe')).toEqual(['fd:3', 'fd:4', 'fd:5'])
  expect(im.fds()).toEqual([buffer1, buffer2, buffer3])
})

test('mixed string and buffer resources', () => {
  const im = new IMCB()
  const buffer = Buffer.from('test')

  im.resource('file1.png')
  im.resource(buffer)
  im.resource('file2.png')

  expect(im.parts('allow-unsafe')).toEqual(['file1.png', 'fd:3', 'file2.png'])
  expect(im.fds()).toEqual([buffer])
})

test('fds() returns copy of buffers array', () => {
  const im = new IMCB()
  const buffer = Buffer.from('test')

  im.resource(buffer)
  const fds1 = im.fds()
  const fds2 = im.fds()

  expect(fds1).toEqual([buffer])
  expect(fds2).toEqual([buffer])
  expect(fds1).not.toBe(fds2)
})

test('complex command with buffers', () => {
  const im = new IMCB()
  const backgroundBuffer = Buffer.from('background')
  const overlayBuffer = Buffer.from('overlay')

  im.resource(backgroundBuffer).resource(overlayBuffer).composite().resource('output.png')

  expect(im.parts('allow-unsafe')).toEqual(['fd:3', 'fd:4', '-composite', 'output.png'])
  expect(im.fds()).toEqual([backgroundBuffer, overlayBuffer])
})

test('buffers in nested builders get distinct fd numbers', () => {
  const backgroundBuffer = Buffer.from('background')
  const overlayBuffer = Buffer.from('overlay')

  const im = new IMCB(backgroundBuffer)
  im.parens(new IMCB(overlayBuffer).resize(10, 10))
  im.composite()

  expect(im.parts('allow-unsafe')).toEqual(['fd:3', '(', 'fd:4', '-resize', '10x10', ')', '-composite'])
  expect(im.fds()).toEqual([backgroundBuffer, overlayBuffer])
})

test('buffer added to a nested builder after embedding is still counted', () => {
  const buffer = Buffer.from('late')
  const nested = new IMCB()

  const im = new IMCB('base.png')
  im.parens(nested)
  nested.resource(buffer)

  expect(im.parts('allow-unsafe')).toEqual(['base.png', '(', 'fd:3', ')'])
  expect(im.fds()).toEqual([buffer])
})

test('same buffer used twice gets one fd per occurrence', () => {
  const buffer = Buffer.from('reused')

  const im = new IMCB(buffer)
  im.parens(new IMCB(buffer))

  expect(im.parts('allow-unsafe')).toEqual(['fd:3', '(', 'fd:4', ')'])
  expect(im.fds()).toEqual([buffer, buffer])
})

test('contrastStretch', () => {
  expect(new IMCB().contrastStretch(2, 5).parts('allow-unsafe')).toEqual(['-contrast-stretch', '2x5'])
  expect(new IMCB().contrastStretch(1000).parts('allow-unsafe')).toEqual(['-contrast-stretch', '1000'])
  expect(new IMCB().contrastStretch('2%', '1%').parts('allow-unsafe')).toEqual(['-contrast-stretch', '2%x1%'])
})

test('labelProperty', () => {
  expect(new IMCB().labelProperty('hello').parts('allow-unsafe')).toEqual(['-label', 'hello'])
})

test('label (resource creator, unchanged behavior)', () => {
  expect(new IMCB().label('hello').parts('allow-unsafe')).toEqual(['label:hello'])
})

test('wordBreak', () => {
  expect(new IMCB().wordBreak('Normal').parts('allow-unsafe')).toEqual(['-word-break', 'Normal'])
  expect(new IMCB().wordBreak('BreakWord').parts('allow-unsafe')).toEqual(['-word-break', 'BreakWord'])
})

test('canny', () => {
  expect(new IMCB().canny(0, 1).parts('allow-unsafe')).toEqual(['-canny', '0x1'])
})

test('canny with thresholds', () => {
  expect(new IMCB().canny(0, 1, '10%', '30%').parts('allow-unsafe')).toEqual(['-canny', '0x1+10%+30%'])
  expect(new IMCB().canny(0, 1, 10, 30).parts('allow-unsafe')).toEqual(['-canny', '0x1+10+30'])
})

test('clahe with percentage dimensions', () => {
  expect(new IMCB().clahe(50, 50).parts('allow-unsafe')).toEqual(['-clahe', '50x50'])
  expect(new IMCB().clahe('25%', '25%').parts('allow-unsafe')).toEqual(['-clahe', '25%x25%'])
})

test('clahe with tiles and limit', () => {
  expect(new IMCB().clahe(50, 50, 128, 3).parts('allow-unsafe')).toEqual(['-clahe', '50x50+128+3'])
  expect(new IMCB().clahe('25%', '25%', 128, 3).parts('allow-unsafe')).toEqual(['-clahe', '25%x25%+128+3'])
})

test('clahe with callback for exact tile flag', () => {
  expect(new IMCB().clahe(g => g.scale(50, 50).offset(128, 3).flag('!')).parts('allow-unsafe')).toEqual([
    '-clahe',
    '50%x50%!+128+3',
  ])
})

test('meanShift with percent distance', () => {
  expect(new IMCB().meanShift(7, 7, '10%').parts('allow-unsafe')).toEqual(['-mean-shift', '7x7+10%'])
  expect(new IMCB().meanShift(7, 7, 10).parts('allow-unsafe')).toEqual(['-mean-shift', '7x7+10'])
})

test('extract with callback', () => {
  expect(new IMCB().extract(g => g.size(100, 100).offset(50, 25)).parts('allow-unsafe')).toEqual(['-extract', '100x100+50+25'])
})

test('interpolativeResize with callback', () => {
  expect(new IMCB().interpolativeResize(g => g.size(200, 100)).parts('allow-unsafe')).toEqual(['-interpolative-resize', '200x100'])
})

test('liquidRescale with callback', () => {
  expect(new IMCB().liquidRescale(g => g.size(150, 200).offset(3, 1)).parts('allow-unsafe')).toEqual(['-liquid-rescale', '150x200+3+1'])
})

test('page with callback', () => {
  expect(new IMCB().page(g => g.size(612, 792).offset(0, 0)).parts('allow-unsafe')).toEqual(['-page', '612x792+0+0'])
})

test('repage with callback', () => {
  expect(new IMCB().repage(g => g.size(100, 100).offset(0, 0)).parts('allow-unsafe')).toEqual(['-repage', '100x100+0+0'])
})

test('sample with callback', () => {
  expect(new IMCB().sample(g => g.size(200, 100)).parts('allow-unsafe')).toEqual(['-sample', '200x100'])
})

test('scale with callback', () => {
  expect(new IMCB().scale(g => g.scale(50)).parts('allow-unsafe')).toEqual(['-scale', '50%'])
})

test('copy method', () => {
  expect(new IMCB().copy(10, 10, 0, 0, 50, 50).parts('allow-unsafe')).toEqual(['-copy', '10x10+0+0', '+50+50'])
  expect(
    new IMCB().copy(g => g.size(10, 10).offset(0, 0), g => g.offset(50, 50)).parts('allow-unsafe')
  ).toEqual(['-copy', '10x10+0+0', '+50+50'])
})

test('rangeThreshold method', () => {
  expect(new IMCB().rangeThreshold('10%', '20%', '80%', '90%').parts('allow-unsafe')).toEqual([
    '-range-threshold',
    '10%,20%,80%,90%',
  ])
  expect(new IMCB().rangeThreshold(50, 100, 200, 250).parts('allow-unsafe')).toEqual([
    '-range-threshold',
    '50,100,200,250',
  ])
})

test('connectedComponents method', () => {
  expect(new IMCB().connectedComponents(4).parts('allow-unsafe')).toEqual(['-connected-components', '4'])
  expect(new IMCB().connectedComponents(8).parts('allow-unsafe')).toEqual(['-connected-components', '8'])
})
