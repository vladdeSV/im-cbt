import { expect, test } from 'bun:test'
import { CommandBuilder as CB } from '../source/commandBuilder.ts'

test('empty command', () => {
  const command = new CB()
  expect(command.args()).toEqual([])
})

test('simple resource', () => {
  const command = new CB('test.jpg')
  expect(command.args()).toEqual(['test.jpg'])
})

test('simple command with parameters', () => {
  const command = new CB('-').background('red').gravity('NorthEast').geometry(10, 10)
  expect(command.args()).toEqual(['-', '-background', 'red', '-gravity', 'NorthEast', '-geometry', '+10+10'])
})

test('command with nested command', () => {
  const command = new CB('-').parens(new CB('test')).gravity('NorthEast').geometry(10, 10).composite()
  expect(command.args()).toEqual(['-', '(', 'test', ')', '-gravity', 'NorthEast', '-geometry', '+10+10', '-composite'])
})

test('command custom commands with numbers and strings', () => {
  const command = new CB('-').command('-colorize', 30).command('-colorize', '30')
  expect(command.args()).toEqual(['-', '-colorize', '30', '-colorize', '30'])
})

test('size method variations', () => {
  expect(new CB().size(100).args()).toEqual(['-size', '100'])
  expect(new CB().size(100, 200).args()).toEqual(['-size', '100x200'])
  expect(new CB().size(undefined, 200).args()).toEqual(['-size', 'x200'])
  expect(new CB().size().args()).toEqual(['+size'])
})

test('crop method variations', () => {
  expect(new CB().crop(100, 100, 10, 20).args()).toEqual(['-crop', '100x100+10+20'])
  expect(new CB().crop(150, 200).args()).toEqual(['-crop', '150x200'])
  expect(new CB().crop(100, 100, -5, -10).args()).toEqual(['-crop', '100x100-5-10'])
  expect(new CB().crop(200, 150, 25, -15).args()).toEqual(['-crop', '200x150+25-15'])
})

test('crop with geometry function', () => {
  // using extended geometry function for crop
  expect(new CB().crop(g => g.size(100, 100).offset(10, 10)).args()).toEqual(['-crop', '100x100+10+10'])

  // crop with percentage scaling
  expect(new CB().crop(g => g.scale(50, 50).offset(0, 0)).args()).toEqual(['-crop', '50%x50%+0+0'])
})

test('rotate method variations', () => {
  expect(new CB().rotate(90).args()).toEqual(['-rotate', '90'])
  expect(new CB().rotate(-45).args()).toEqual(['-rotate', '-45'])
  expect(new CB().rotate(180.5).args()).toEqual(['-rotate', '180.5'])
  expect(new CB().rotate(0).args()).toEqual(['-rotate', '0'])

  // rotate with < flag (only if wider than tall)
  expect(new CB().rotate(90, '<').args()).toEqual(['-rotate', '90<'])

  // rotate with > flag (only if taller than wide)
  expect(new CB().rotate(-90, '>').args()).toEqual(['-rotate', '-90>'])
})

test('flip method', () => {
  expect(new CB().flip().args()).toEqual(['-flip'])
})

test('flop method', () => {
  expect(new CB().flop().args()).toEqual(['-flop'])
})

test('quality method', () => {
  expect(new CB().quality(85).args()).toEqual(['-quality', '85'])
  expect(new CB().quality(100).args()).toEqual(['-quality', '100'])
  expect(new CB().quality(50).args()).toEqual(['-quality', '50'])
  expect(new CB().quality().args()).toEqual(['+quality'])
})

test('strip method', () => {
  expect(new CB().strip().args()).toEqual(['-strip'])
})

test('blur method', () => {
  // blur with radius and sigma
  expect(new CB().blur(0, 1).args()).toEqual(['-blur', '0x1'])
  expect(new CB().blur(5, 2).args()).toEqual(['-blur', '5x2'])
  expect(new CB().blur(2).args()).toEqual(['-blur', '2'])
})

test('sharpen method', () => {
  expect(new CB().sharpen(0, 1).args()).toEqual(['-sharpen', '0x1'])
  expect(new CB().sharpen(2).args()).toEqual(['-sharpen', '2'])
})

test('alpha method', () => {
  expect(new CB().alpha('Set').args()).toEqual(['-alpha', 'Set'])
  expect(new CB().alpha('Transparent').args()).toEqual(['-alpha', 'Transparent'])
  expect(new CB().alpha('Off').args()).toEqual(['-alpha', 'Off'])
  expect(new CB().alpha('OffIfOpaque').args()).toEqual(['-alpha', 'OffIfOpaque'])
})

test('clone method variations (must be in parens irl)', () => {
  expect(new CB().clone().args()).toEqual(['+clone'])
  expect(new CB().clone(1).args()).toEqual(['-clone', '1'])
  expect(new CB().clone(-1).args()).toEqual(['-clone', '-1'])
  expect(new CB().clone(1, 2).args()).toEqual(['-clone', '1,2'])
  expect(new CB().clone(2, 4, -1).args()).toEqual(['-clone', '2,4,-1'])
  expect(new CB().clone(0, 1, 2).args()).toEqual(['-clone', '0,1,2'])
})

test('compose method', () => {
  expect(new CB().compose('Multiply').args()).toEqual(['-compose', 'Multiply'])
  expect(new CB().compose('Overlay').args()).toEqual(['-compose', 'Overlay'])
  expect(new CB().compose('Screen').args()).toEqual(['-compose', 'Screen'])
})

test('extent method', () => {
  expect(new CB().extent(200, 300).args()).toEqual(['-extent', '200x300'])
  expect(new CB().extent(100, 100).args()).toEqual(['-extent', '100x100'])
})

test('fill method', () => {
  expect(new CB().fill('red').args()).toEqual(['-fill', 'red'])
  expect(new CB().fill('#FF0000').args()).toEqual(['-fill', '#FF0000'])
  expect(new CB().fill('none').args()).toEqual(['-fill', 'none'])
})

test('filter method', () => {
  expect(new CB().filter('Lanczos').args()).toEqual(['-filter', 'Lanczos'])
  expect(new CB().filter('Point').args()).toEqual(['-filter', 'Point'])
  expect(new CB().filter('Mitchell').args()).toEqual(['-filter', 'Mitchell'])
})

test('font method', () => {
  expect(new CB().font('Arial').args()).toEqual(['-font', 'Arial'])
  expect(new CB().font('/path/to/font.ttf').args()).toEqual(['-font', '/path/to/font.ttf'])
  expect(new CB().font('Times New Roman').args()).toEqual(['-font', 'Times New Roman'])
})

test('interpolate method', () => {
  expect(new CB().interpolate('Bilinear').args()).toEqual(['-interpolate', 'Bilinear'])
  expect(new CB().interpolate('Spline').args()).toEqual(['-interpolate', 'Spline'])
  expect(new CB().interpolate('Nearest').args()).toEqual(['-interpolate', 'Nearest'])
})

test('label method', () => {
  expect(new CB().label('Hello World').args()).toEqual(['label:Hello World'])
  expect(new CB().label('Test Label').args()).toEqual(['label:Test Label'])
  expect(new CB().label(123).args()).toEqual(['label:123'])
})

test('opaque method', () => {
  expect(new CB().opaque('red').args()).toEqual(['-opaque', 'red'])
  expect(new CB().opaque('blue', true).args()).toEqual(['+opaque', 'blue'])
  expect(new CB().opaque('#FF0000').args()).toEqual(['-opaque', '#FF0000'])
})

test('pointsize method', () => {
  expect(new CB().pointsize(12).args()).toEqual(['-pointsize', '12'])
  expect(new CB().pointsize(24).args()).toEqual(['-pointsize', '24'])
  expect(new CB().pointsize(0).args()).toEqual(['-pointsize', '0'])
  expect(new CB().pointsize().args()).toEqual(['+pointsize'])
})

test('resize method', () => {
  expect(new CB().resize(100, 200).args()).toEqual(['-resize', '100x200'])
  expect(new CB().resize(50).args()).toEqual(['-resize', '50'])
  expect(new CB().resize(undefined, 100).args()).toEqual(['-resize', 'x100'])
})

test('resize with callback', () => {
  expect(new CB().resize(g => g.size(100, 100).flag('!')).args()).toEqual(['-resize', '100x100!'])
  expect(new CB().resize(g => g.scale(50)).args()).toEqual(['-resize', '50%'])
})

test('trim method', () => {
  expect(new CB().trim().args()).toEqual(['-trim'])
})

test('adaptive-blur method', () => {
  // adaptive-blur with radius and sigma
  expect(new CB().adaptiveBlur(2, 1).args()).toEqual(['-adaptive-blur', '2x1'])
  expect(new CB().adaptiveBlur(0, 1.5).args()).toEqual(['-adaptive-blur', '0x1.5'])
  expect(new CB().adaptiveBlur(5, 2).args()).toEqual(['-adaptive-blur', '5x2'])

  // adaptive-blur with radius only (sigma defaults to 1)
  expect(new CB().adaptiveBlur(3).args()).toEqual(['-adaptive-blur', '3'])
  expect(new CB().adaptiveBlur(0).args()).toEqual(['-adaptive-blur', '0'])
})

test('adaptive-resize method', () => {
  // adaptive-resize with width and height
  expect(new CB().adaptiveResize(100, 200).args()).toEqual(['-adaptive-resize', '100x200'])
  expect(new CB().adaptiveResize(300, 150).args()).toEqual(['-adaptive-resize', '300x150'])

  // adaptive-resize with width only
  expect(new CB().adaptiveResize(150).args()).toEqual(['-adaptive-resize', '150'])

  // adaptive-resize with height only
  expect(new CB().adaptiveResize(undefined, 200).args()).toEqual(['-adaptive-resize', 'x200'])
})

test('adaptive-resize with callback', () => {
  // adaptive-resize with percentage scaling
  expect(new CB().adaptiveResize(g => g.scale(50)).args()).toEqual(['-adaptive-resize', '50%'])
  expect(new CB().adaptiveResize(g => g.scale(75, 80)).args()).toEqual(['-adaptive-resize', '75%x80%'])

  // adaptive-resize with size and flag
  expect(new CB().adaptiveResize(g => g.size(200, 100).flag('!')).args()).toEqual(['-adaptive-resize', '200x100!'])
})

test('adaptive-sharpen method', () => {
  // adaptive-sharpen with radius and sigma
  expect(new CB().adaptiveSharpen(2, 1).args()).toEqual(['-adaptive-sharpen', '2x1'])
  expect(new CB().adaptiveSharpen(0, 1.5).args()).toEqual(['-adaptive-sharpen', '0x1.5'])
  expect(new CB().adaptiveSharpen(5, 2).args()).toEqual(['-adaptive-sharpen', '5x2'])

  // adaptive-sharpen with radius only (sigma defaults to 1)
  expect(new CB().adaptiveSharpen(3).args()).toEqual(['-adaptive-sharpen', '3'])
  expect(new CB().adaptiveSharpen(0).args()).toEqual(['-adaptive-sharpen', '0'])
})

test('adjoin method', () => {
  expect(new CB().adjoin().args()).toEqual(['-adjoin'])
  expect(new CB().adjoin(false).args()).toEqual(['+adjoin'])
  expect(new CB().adjoin(true).args()).toEqual(['-adjoin'])
})

test('antialias method', () => {
  expect(new CB().antialias().args()).toEqual(['-antialias'])
  expect(new CB().antialias(false).args()).toEqual(['+antialias'])
  expect(new CB().antialias(true).args()).toEqual(['-antialias'])
})

test('append method', () => {
  expect(new CB().append().args()).toEqual(['-append'])
  expect(new CB().append(true).args()).toEqual(['+append'])
  expect(new CB().append(false).args()).toEqual(['-append'])
})

test('colorize method', () => {
  expect(new CB().colorize(50).args()).toEqual(['-colorize', '50'])
  expect(new CB().colorize(30, 70, 50).args()).toEqual(['-colorize', '30,70,50'])
  expect(new CB().colorize(100).args()).toEqual(['-colorize', '100'])
})

test('colorspace method', () => {
  expect(new CB().colorspace('Gray').args()).toEqual(['-colorspace', 'Gray'])
  expect(new CB().colorspace('sRGB').args()).toEqual(['-colorspace', 'sRGB'])
  expect(new CB().colorspace('CMYK').args()).toEqual(['-colorspace', 'CMYK'])
})

test('contrast method', () => {
  expect(new CB().contrast().args()).toEqual(['-contrast'])
  expect(new CB().contrast(false).args()).toEqual(['+contrast'])
  expect(new CB().contrast(true).args()).toEqual(['-contrast'])
})

test('enhance method', () => {
  expect(new CB().enhance().args()).toEqual(['-enhance'])
})

test('affine method', () => {
  expect(new CB().affine(1, 0, 0, 1).args()).toEqual(['-affine', '1,0,0,1'])
  expect(new CB().affine(1, 0, 0, 1.5).args()).toEqual(['-affine', '1,0,0,1.5'])
  expect(new CB().affine(1, 0, 0, 1, 10, 20).args()).toEqual(['-affine', '1,0,0,1,10,20'])
})

test('annotate method', () => {
  expect(new CB().annotate(0, 'Hello').args()).toEqual(['-annotate', '0', 'Hello'])
  expect(new CB().annotate(45, 'Rotated Text').args()).toEqual(['-annotate', '45', 'Rotated Text'])
  expect(new CB().annotate(-90, 'Vertical').args()).toEqual(['-annotate', '-90', 'Vertical'])

  // callback covers the geometry forms: offsets only, shears, or both
  expect(new CB().annotate(g => g.offset(20, 20), 'Offset').args()).toEqual(['-annotate', '+20+20', 'Offset'])
  expect(new CB().annotate(g => g.size(15, 15).offset(20, 20), 'Sheared').args()).toEqual([
    '-annotate',
    '15x15+20+20',
    'Sheared',
  ])
})

test('authenticate method', () => {
  expect(new CB().authenticate('password123').args()).toEqual(['-authenticate', 'password123'])
  expect(new CB().authenticate('secret').args()).toEqual(['-authenticate', 'secret'])
})

test('auto-gamma method', () => {
  expect(new CB().autoGamma().args()).toEqual(['-auto-gamma'])
})

test('auto-level method', () => {
  expect(new CB().autoLevel().args()).toEqual(['-auto-level'])
})

test('bias method', () => {
  expect(new CB().bias('50%').args()).toEqual(['-bias', '50%'])
  expect(new CB().bias(0.5).args()).toEqual(['-bias', '0.5'])
  expect(new CB().bias('25%').args()).toEqual(['-bias', '25%'])
})

test('blackThreshold method', () => {
  expect(new CB().blackThreshold('50%').args()).toEqual(['-black-threshold', '50%'])
  expect(new CB().blackThreshold(128).args()).toEqual(['-black-threshold', '128'])
  expect(new CB().blackThreshold('25%').args()).toEqual(['-black-threshold', '25%'])
})

test('border method', () => {
  expect(new CB().border(10, 10).args()).toEqual(['-border', '10x10'])
  expect(new CB().border(5, 8).args()).toEqual(['-border', '5x8'])
  expect(new CB().border(15).args()).toEqual(['-border', '15'])
  expect(new CB().border('5%', '10%').args()).toEqual(['-border', '5%x10%'])
  expect(new CB().border('5%').args()).toEqual(['-border', '5%'])
})

test('borderColor method', () => {
  expect(new CB().bordercolor('red').args()).toEqual(['-bordercolor', 'red'])
  expect(new CB().bordercolor('#FF0000').args()).toEqual(['-bordercolor', '#FF0000'])
  expect(new CB().bordercolor('blue').args()).toEqual(['-bordercolor', 'blue'])
})

test('despeckle method', () => {
  expect(new CB().despeckle().args()).toEqual(['-despeckle'])
})

test('gaussianBlur method', () => {
  expect(new CB().gaussianBlur(0, 1).args()).toEqual(['-gaussian-blur', '0x1'])
  expect(new CB().gaussianBlur(5, 2).args()).toEqual(['-gaussian-blur', '5x2'])
  expect(new CB().gaussianBlur(3).args()).toEqual(['-gaussian-blur', '3'])
})

test('density method', () => {
  expect(new CB().density(300).args()).toEqual(['-density', '300'])
  expect(new CB().density(300, 300).args()).toEqual(['-density', '300x300'])
  expect(new CB().density(150, 200).args()).toEqual(['-density', '150x200'])
})

test('depth method', () => {
  expect(new CB().depth(8).args()).toEqual(['-depth', '8'])
  expect(new CB().depth(16).args()).toEqual(['-depth', '16'])
  expect(new CB().depth(32).args()).toEqual(['-depth', '32'])
})

test('normalize method', () => {
  expect(new CB().normalize().args()).toEqual(['-normalize'])
})

test('negate method', () => {
  expect(new CB().negate().args()).toEqual(['-negate'])
})

test('monochrome method', () => {
  expect(new CB().monochrome().args()).toEqual(['-monochrome'])
})

test('equalize method', () => {
  expect(new CB().equalize().args()).toEqual(['-equalize'])
})

test('flatten method', () => {
  expect(new CB().flatten().args()).toEqual(['-flatten'])
})

test('ping method', () => {
  expect(new CB().ping().args()).toEqual(['-ping'])
})

test('reverse method', () => {
  expect(new CB().reverse().args()).toEqual(['-reverse'])
})

test('brightnessContrast method', () => {
  expect(new CB().brightnessContrast(10, 5).args()).toEqual(['-brightness-contrast', '10x5'])
  expect(new CB().brightnessContrast(-10, 20).args()).toEqual(['-brightness-contrast', '-10x20'])
  expect(new CB().brightnessContrast(0, -5).args()).toEqual(['-brightness-contrast', '0x-5'])
  expect(new CB().brightnessContrast('10%', '5%').args()).toEqual(['-brightness-contrast', '10%x5%'])
  expect(new CB().brightnessContrast(10).args()).toEqual(['-brightness-contrast', '10'])
})

test('channel method', () => {
  expect(new CB().channel('RGB').args()).toEqual(['-channel', 'RGB'])
  expect(new CB().channel('Red', 'Green').args()).toEqual(['-channel', 'Red,Green'])
  expect(new CB().channel('Red', 'Green', 'Blue').args()).toEqual(['-channel', 'Red,Green,Blue'])
  expect(new CB().channel().args()).toEqual(['+channel'])
})

test('charcoal method', () => {
  expect(new CB().charcoal(2).args()).toEqual(['-charcoal', '2'])
  expect(new CB().charcoal(0, 1).args()).toEqual(['-charcoal', '0x1'])
  expect(new CB().charcoal(5).args()).toEqual(['-charcoal', '5'])
})

test('chop method', () => {
  expect(new CB().chop(10, 10, 5, 5).args()).toEqual(['-chop', '10x10+5+5'])
  expect(new CB().chop(50, 50).args()).toEqual(['-chop', '50x50'])
  expect(new CB().chop(20, 15, -10, -5).args()).toEqual(['-chop', '20x15-10-5'])
  expect(new CB().chop(g => g.scale(10, 10).offset(0, 0)).args()).toEqual(['-chop', '10%x10%+0+0'])
})

test('compress method', () => {
  expect(new CB().compress('JPEG').args()).toEqual(['-compress', 'JPEG'])
  expect(new CB().compress('None').args()).toEqual(['-compress', 'None'])
  expect(new CB().compress('Zip').args()).toEqual(['-compress', 'Zip'])
})

/*
test('contrastStretch method', () => {
  expect(new CB().contrastStretch(2, 1).args()).toEqual(['-contrast-stretch', '2%x1%'])
  expect(new CB().contrastStretch(0, 0).args()).toEqual(['-contrast-stretch', '0x0'])
  expect(new CB().contrastStretch(5, 3).args()).toEqual(['-contrast-stretch', '5%x3%'])
})
*/

test('cycle method', () => {
  expect(new CB().cycle(50).args()).toEqual(['-cycle', '50'])
  expect(new CB().cycle(-25).args()).toEqual(['-cycle', '-25'])
  expect(new CB().cycle(100).args()).toEqual(['-cycle', '100'])
})

test('edge method', () => {
  expect(new CB().edge(1).args()).toEqual(['-edge', '1'])
  expect(new CB().edge(2).args()).toEqual(['-edge', '2'])
  expect(new CB().edge(0.5).args()).toEqual(['-edge', '0.5'])
})

test('emboss method', () => {
  expect(new CB().emboss(2).args()).toEqual(['-emboss', '2'])
  expect(new CB().emboss(0, 1).args()).toEqual(['-emboss', '0x1'])
  expect(new CB().emboss(3).args()).toEqual(['-emboss', '3'])
})

test('gamma method', () => {
  expect(new CB().gamma(0.8).args()).toEqual(['-gamma', '0.8'])
  expect(new CB().gamma(2.2).args()).toEqual(['-gamma', '2.2'])
  expect(new CB().gamma(1.0).args()).toEqual(['-gamma', '1'])
  expect(new CB().gamma(2.2, true).args()).toEqual(['+gamma', '2.2'])
})

test('grayscale method', () => {
  expect(new CB().grayscale('average').args()).toEqual(['-grayscale', 'average'])
  expect(new CB().grayscale('rec709luma').args()).toEqual(['-grayscale', 'rec709luma'])
  expect(new CB().grayscale('lightness').args()).toEqual(['-grayscale', 'lightness'])
})

test('help method', () => {
  expect(new CB().help().args()).toEqual(['-help'])
})

test('implode method', () => {
  expect(new CB().implode(0.5).args()).toEqual(['-implode', '0.5'])
  expect(new CB().implode(-1).args()).toEqual(['-implode', '-1'])
  expect(new CB().implode(2).args()).toEqual(['-implode', '2'])
})

test('median method', () => {
  expect(new CB().median(2).args()).toEqual(['-median', '2'])
  expect(new CB().median(0, 1).args()).toEqual(['-median', '0x1'])
  expect(new CB().median(3).args()).toEqual(['-median', '3'])
})

test('autoOrient method', () => {
  expect(new CB().autoOrient().args()).toEqual(['-auto-orient'])
})

test('blackPointCompensation method', () => {
  expect(new CB().blackPointCompensation().args()).toEqual(['-black-point-compensation'])
})

test('convolve method', () => {
  expect(new CB().convolve('1,2,1,2,4,2,1,2,1').args()).toEqual(['-convolve', '1,2,1,2,4,2,1,2,1'])
  expect(new CB().convolve('0,-1,0,-1,5,-1,0,-1,0').args()).toEqual(['-convolve', '0,-1,0,-1,5,-1,0,-1,0'])
  expect(new CB().convolve('1,1,1,1,1,1,1,1,1').args()).toEqual(['-convolve', '1,1,1,1,1,1,1,1,1'])
})

test('debug method', () => {
  expect(new CB().debug('All').args()).toEqual(['-debug', 'All'])
  expect(new CB().debug('Cache', 'Blob').args()).toEqual(['-debug', 'Cache,Blob'])
  expect(new CB().debug('Cache', 'Blob', 'Resource').args()).toEqual(['-debug', 'Cache,Blob,Resource'])
  expect(new CB().debug('None').args()).toEqual(['-debug', 'None'])
  expect(new CB().debug().args()).toEqual(['+debug'])
})

test('define method', () => {
  expect(new CB().define('jpeg:quality', 90).args()).toEqual(['-define', 'jpeg:quality=90'])
  expect(new CB().define('registry:temporary-path', '/tmp').args()).toEqual(['-define', 'registry:temporary-path=/tmp'])
  expect(new CB().define('ps:imagemask').args()).toEqual(['-define', 'ps:imagemask'])
})

test('undefine method', () => {
  expect(new CB().undefine('jpeg:quality').args()).toEqual(['+define', 'jpeg:quality'])
  expect(new CB().undefine('*').args()).toEqual(['+define', '*'])
})

test('delay method', () => {
  expect(new CB().delay(30).args()).toEqual(['-delay', '30'])
  expect(new CB().delay(30, 100).args()).toEqual(['-delay', '30x100'])
  expect(new CB().delay(50, 200).args()).toEqual(['-delay', '50x200'])
  expect(new CB().delay(10, '>').args()).toEqual(['-delay', '10>'])
  expect(new CB().delay(5, '<').args()).toEqual(['-delay', '5<'])
  expect(new CB().delay(30, 100, '>').args()).toEqual(['-delay', '30x100>'])
})

test('direction method', () => {
  expect(new CB().direction('right-to-left').args()).toEqual(['-direction', 'right-to-left'])
  expect(new CB().direction('left-to-right').args()).toEqual(['-direction', 'left-to-right'])
})

test('display method', () => {
  expect(new CB().display(':0.0').args()).toEqual(['-display', ':0.0'])
  expect(new CB().display('localhost:10.0').args()).toEqual(['-display', 'localhost:10.0'])
})

test('dispose method', () => {
  expect(new CB().dispose('Background').args()).toEqual(['-dispose', 'Background'])
  expect(new CB().dispose('None').args()).toEqual(['-dispose', 'None'])
  expect(new CB().dispose('Previous').args()).toEqual(['-dispose', 'Previous'])
})

test('distort method', () => {
  expect(new CB().distort('Perspective', '0,0,0,0,0,90,0,90').args()).toEqual([
    '-distort',
    'Perspective',
    '0,0,0,0,0,90,0,90',
  ])
  expect(new CB().distort('Arc', '60').args()).toEqual(['-distort', 'Arc', '60'])
  expect(new CB().distort('SRT', '30').args()).toEqual(['-distort', 'SRT', '30'])
  expect(new CB().distort('SRT', '45', true).args()).toEqual(['+distort', 'SRT', '45'])
})

test('dither method', () => {
  expect(new CB().dither('FloydSteinberg').args()).toEqual(['-dither', 'FloydSteinberg'])
  expect(new CB().dither('Riemersma').args()).toEqual(['-dither', 'Riemersma'])
  expect(new CB().dither().args()).toEqual(['+dither'])
})

test('draw method', () => {
  expect(new CB().draw(d => d.circle(10, 10, 20, 20)).args()).toEqual(['-draw', 'circle 10,10 20,20'])
  expect(new CB().draw(d => d.rectangle(0, 0, 100, 100)).args()).toEqual(['-draw', 'rectangle 0,0 100,100'])
  expect(new CB().draw(d => d.text(0, 0, 'Hello World')).args()).toEqual(['-draw', 'text 0,0 "Hello World"'])
})

test('draw method - shape primitives', () => {
  expect(new CB().draw(d => d.point(10, 20)).args()).toEqual(['-draw', 'point 10,20'])
  expect(new CB().draw(d => d.line(0, 0, 100, 100)).args()).toEqual(['-draw', 'line 0,0 100,100'])
  expect(new CB().draw(d => d.rectangle(10, 10, 50, 50)).args()).toEqual(['-draw', 'rectangle 10,10 50,50'])
  expect(new CB().draw(d => d.roundRectangle(10, 10, 50, 50, 5, 5)).args()).toEqual([
    '-draw',
    'roundRectangle 10,10 50,50 5,5',
  ])
  expect(new CB().draw(d => d.arc(10, 10, 50, 50, 0, 90)).args()).toEqual(['-draw', 'arc 10,10 50,50 0,90'])
  expect(new CB().draw(d => d.ellipse(25, 25, 20, 15, 0, 360)).args()).toEqual(['-draw', 'ellipse 25,25 20,15 0,360'])
  expect(new CB().draw(d => d.circle(50, 50, 70, 50)).args()).toEqual(['-draw', 'circle 50,50 70,50'])
})

test('draw method - polyline and polygon', () => {
  expect(new CB().draw(d => d.polyline([10, 10], [20, 20], [30, 10])).args()).toEqual([
    '-draw',
    'polyline 10,10 20,20 30,10',
  ])
  expect(new CB().draw(d => d.polygon([10, 10], [20, 5], [30, 15], [15, 20])).args()).toEqual([
    '-draw',
    'polygon 10,10 20,5 30,15 15,20',
  ])
  expect(new CB().draw(d => d.bezier([10, 10], [20, 5], [30, 15], [40, 10])).args()).toEqual([
    '-draw',
    'bezier 10,10 20,5 30,15 40,10',
  ])
})

test('draw method - path and image', () => {
  expect(new CB().draw(d => d.path('M 10,10 L 20,20 Z')).args()).toEqual(['-draw', 'path "M 10,10 L 20,20 Z"'])
  expect(new CB().draw(d => d.image('Over', 10, 10, 100, 100, 'test.png')).args()).toEqual([
    '-draw',
    'image Over 10,10 100,100 "test.png"',
  ])
})

test('draw method - text and gravity', () => {
  expect(new CB().draw(d => d.text(50, 50, 'Hello World')).args()).toEqual(['-draw', 'text 50,50 "Hello World"'])
  expect(new CB().draw(d => d.gravity('Center')).args()).toEqual(['-draw', 'gravity Center'])
  expect(new CB().draw(d => d.gravity('NorthWest')).args()).toEqual(['-draw', 'gravity NorthWest'])
  expect(new CB().draw(d => d.gravity('SouthEast')).args()).toEqual(['-draw', 'gravity SouthEast'])
})

test('draw method - transformations', () => {
  expect(new CB().draw(d => d.rotate(45)).args()).toEqual(['-draw', 'rotate 45'])
  expect(new CB().draw(d => d.translate(10, 20)).args()).toEqual(['-draw', 'translate 10,20'])
  expect(new CB().draw(d => d.scale(2, 1.5)).args()).toEqual(['-draw', 'scale 2,1.5'])
  expect(new CB().draw(d => d.skewX(15)).args()).toEqual(['-draw', 'skewX 15'])
  expect(new CB().draw(d => d.skewY(10)).args()).toEqual(['-draw', 'skewY 10'])
})

test('draw method - pixel operations', () => {
  expect(new CB().draw(d => d.color(10, 10, 'point')).args()).toEqual(['-draw', 'color 10,10 point'])
  expect(new CB().draw(d => d.color(20, 20, 'replace')).args()).toEqual(['-draw', 'color 20,20 replace'])
  expect(new CB().draw(d => d.alpha(15, 15, 'floodfill')).args()).toEqual(['-draw', 'alpha 15,15 floodfill'])
  expect(new CB().draw(d => d.matte(15, 15, 'floodfill')).args()).toEqual(['-draw', 'matte 15,15 floodfill'])
})

test('draw method - multiple primitives', () => {
  expect(new CB().draw(d => d.circle(25, 25, 35, 25).text(10, 60, 'Hello')).args()).toEqual([
    '-draw',
    'circle 25,25 35,25 text 10,60 "Hello"',
  ])
  expect(new CB().draw(d => d.translate(50, 50).rotate(45).rectangle(0, 0, 20, 20)).args()).toEqual([
    '-draw',
    'translate 50,50 rotate 45 rectangle 0,0 20,20',
  ])
  expect(new CB().draw(d => d.gravity('Center').text(0, 0, 'Centered').point(0, 0)).args()).toEqual([
    '-draw',
    'gravity Center text 0,0 "Centered" point 0,0',
  ])
})

test('draw method - complex example', () => {
  expect(
    new CB()
      .draw(d =>
        d
          .translate(100, 100)
          .rotate(45)
          .scale(2, 2)
          .rectangle(-10, -10, 10, 10)
          .gravity('NorthEast')
          .text(0, 0, 'Rotated!')
      )
      .args()
  ).toEqual([
    '-draw',
    'translate 100,100 rotate 45 scale 2,2 rectangle -10,-10 10,10 gravity NorthEast text 0,0 "Rotated!"',
  ])
})

test('duplicate method', () => {
  expect(new CB().duplicate(2).args()).toEqual(['-duplicate', '2'])
  expect(new CB().duplicate(5, 0, 1, 2).args()).toEqual(['-duplicate', '5,0,1,2'])
  expect(new CB().duplicate(3, 1, 3, 5).args()).toEqual(['-duplicate', '3,1,3,5'])
  expect(new CB().duplicate().args()).toEqual(['+duplicate'])
})

test('encoding method', () => {
  expect(new CB().encoding('UTF-8').args()).toEqual(['-encoding', 'UTF-8'])
  expect(new CB().encoding('Latin1').args()).toEqual(['-encoding', 'Latin1'])
})

test('endian method', () => {
  expect(new CB().endian('LSB').args()).toEqual(['-endian', 'LSB'])
  expect(new CB().endian('MSB').args()).toEqual(['-endian', 'MSB'])
})

test('evaluate method', () => {
  expect(new CB().evaluate('Add', 50).args()).toEqual(['-evaluate', 'Add', '50'])
  expect(new CB().evaluate('Multiply', 1.5).args()).toEqual(['-evaluate', 'Multiply', '1.5'])
  expect(new CB().evaluate('Set', 128).args()).toEqual(['-evaluate', 'Set', '128'])
})

test('extract method', () => {
  expect(new CB().extract('100x100+50+25').args()).toEqual(['-extract', '100x100+50+25'])
  expect(new CB().extract('200x150').args()).toEqual(['-extract', '200x150'])
})

test('family method', () => {
  expect(new CB().family('Arial').args()).toEqual(['-family', 'Arial'])
  expect(new CB().family('Times New Roman').args()).toEqual(['-family', 'Times New Roman'])
})

test('format method', () => {
  expect(new CB().format('%wx%h').args()).toEqual(['-format', '%wx%h'])
  expect(new CB().format('%f').args()).toEqual(['-format', '%f'])
})

test('frame method', () => {
  expect(new CB().frame(10, 10).args()).toEqual(['-frame', '10x10'])
  expect(new CB().frame(15, 20, 5).args()).toEqual(['-frame', '15x20+5'])
  expect(new CB().frame(20, 25, 8, 3).args()).toEqual(['-frame', '20x25+8+3'])
  expect(new CB().frame(5).args()).toEqual(['-frame', '5'])
})

test('function method', () => {
  expect(new CB().function('Polynomial', 1, 2, 3).args()).toEqual(['-function', 'Polynomial', '1,2,3'])
  expect(new CB().function('Sinusoid', 1, 0, 0.5).args()).toEqual(['-function', 'Sinusoid', '1,0,0.5'])
})

test('fuzz method', () => {
  expect(new CB().fuzz('10%').args()).toEqual(['-fuzz', '10%'])
  expect(new CB().fuzz(5).args()).toEqual(['-fuzz', '5'])
})

test('fx method', () => {
  expect(new CB().fx('u*0.5').args()).toEqual(['-fx', 'u*0.5'])
  expect(new CB().fx('(u+v)/2').args()).toEqual(['-fx', '(u+v)/2'])
})

test('identify method', () => {
  expect(new CB().identify().args()).toEqual(['-identify'])
})

test('insert method', () => {
  expect(new CB().insert(0).args()).toEqual(['-insert', '0'])
  expect(new CB().insert(3).args()).toEqual(['-insert', '3'])
})

test('intent method', () => {
  expect(new CB().intent('Perceptual').args()).toEqual(['-intent', 'Perceptual'])
  expect(new CB().intent('Relative').args()).toEqual(['-intent', 'Relative'])
})

test('interlace method', () => {
  expect(new CB().interlace('None').args()).toEqual(['-interlace', 'None'])
  expect(new CB().interlace('Line').args()).toEqual(['-interlace', 'Line'])
  expect(new CB().interlace('Plane').args()).toEqual(['-interlace', 'Plane'])
})

test('kerning method', () => {
  expect(new CB().kerning(2).args()).toEqual(['-kerning', '2'])
  expect(new CB().kerning(-1.5).args()).toEqual(['-kerning', '-1.5'])
})

test('lat method', () => {
  expect(new CB().lat(10, 10).args()).toEqual(['-lat', '10x10'])
  expect(new CB().lat(10, 10, 5).args()).toEqual(['-lat', '10x10+5'])
  expect(new CB().lat(20, 15, '8%').args()).toEqual(['-lat', '20x15+8%'])

  // negative offset increases sensitivity; must emit -5, not +-5
  expect(new CB().lat(10, 10, -5).args()).toEqual(['-lat', '10x10-5'])
})

test('layers method', () => {
  expect(new CB().layers('coalesce').args()).toEqual(['-layers', 'coalesce'])
  expect(new CB().layers('optimize').args()).toEqual(['-layers', 'optimize'])
})

test('level method', () => {
  expect(new CB().level(0, 100).args()).toEqual(['-level', '0,100'])
  expect(new CB().level(10, 90, 1.2).args()).toEqual(['-level', '10,90,1.2'])
})

test('limit method', () => {
  expect(new CB().limit('memory', '256MB').args()).toEqual(['-limit', 'memory', '256MB'])
  expect(new CB().limit('disk', '1GB').args()).toEqual(['-limit', 'disk', '1GB'])
  expect(new CB().limit('thread', '4').args()).toEqual(['-limit', 'thread', '4'])
})

test('linearStretch method', () => {
  expect(new CB().linearStretch(1, 2).args()).toEqual(['-linear-stretch', '1x2'])
  expect(new CB().linearStretch(5).args()).toEqual(['-linear-stretch', '5'])
  expect(new CB().linearStretch('1%', '2%').args()).toEqual(['-linear-stretch', '1%x2%'])
})

test('liquidRescale method', () => {
  expect(new CB().liquidRescale(75).args()).toEqual(['-liquid-rescale', '75'])
  expect(new CB().liquidRescale(100, 150).args()).toEqual(['-liquid-rescale', '100x150'])
  expect(new CB().liquidRescale(200, 300, 5).args()).toEqual(['-liquid-rescale', '200x300+5'])
  expect(new CB().liquidRescale(150, 200, 3, 1).args()).toEqual(['-liquid-rescale', '150x200+3+1'])
})

test('loop method', () => {
  expect(new CB().loop(0).args()).toEqual(['-loop', '0'])
  expect(new CB().loop(5).args()).toEqual(['-loop', '5'])
  expect(new CB().loop(10).args()).toEqual(['-loop', '10'])
})

test('matteColor method', () => {
  expect(new CB().mattecolor('blue').args()).toEqual(['-mattecolor', 'blue'])
  expect(new CB().mattecolor('#FF0000').args()).toEqual(['-mattecolor', '#FF0000'])
  expect(new CB().mattecolor('transparent').args()).toEqual(['-mattecolor', 'transparent'])
})

test('modulate method', () => {
  expect(new CB().modulate().args()).toEqual(['-modulate', '100'])
  expect(new CB().modulate(120).args()).toEqual(['-modulate', '120'])
  expect(new CB().modulate(100, 150).args()).toEqual(['-modulate', '100,150'])
  expect(new CB().modulate(100, 150, 80).args()).toEqual(['-modulate', '100,150,80'])
})

test('monitor method', () => {
  expect(new CB().monitor().args()).toEqual(['-monitor'])
  expect(new CB().monitor(true).args()).toEqual(['-monitor'])
  expect(new CB().monitor(false).args()).toEqual(['+monitor'])
})

test('morphology method', () => {
  expect(new CB().morphology('Erode', 'diamond:1').args()).toEqual(['-morphology', 'Erode', 'diamond:1'])
  expect(new CB().morphology('Dilate', 'square:2').args()).toEqual(['-morphology', 'Dilate', 'square:2'])
  expect(new CB().morphology('Open', 'disk:3', 2).args()).toEqual(['-morphology', 'Open:2', 'disk:3'])
})

test('mosaic method', () => {
  expect(new CB().mosaic().args()).toEqual(['-mosaic'])
})

test('motionBlur method', () => {
  expect(new CB().motionBlur(0, 20, 45).args()).toEqual(['-motion-blur', '0x20+45'])
  expect(new CB().motionBlur(5, 10, 90).args()).toEqual(['-motion-blur', '5x10+90'])
  expect(new CB().motionBlur(2, 5, 180).args()).toEqual(['-motion-blur', '2x5+180'])
  expect(new CB().motionBlur(0, 5, -45).args()).toEqual(['-motion-blur', '0x5-45'])
})

test('noise method', () => {
  // +noise type adds noise
  expect(new CB().noise('Gaussian').args()).toEqual(['+noise', 'Gaussian'])
  expect(new CB().noise('Poisson').args()).toEqual(['+noise', 'Poisson'])

  // -noise radius reduces noise
  expect(new CB().noise(3).args()).toEqual(['-noise', '3'])
})

test('orderedDither method', () => {
  expect(new CB().orderedDither('4x4').args()).toEqual(['-ordered-dither', '4x4'])
  expect(new CB().orderedDither('o8x8').args()).toEqual(['-ordered-dither', 'o8x8'])
  expect(new CB().orderedDither('h8x8a').args()).toEqual(['-ordered-dither', 'h8x8a'])
})

test('orient method', () => {
  expect(new CB().orient('TopLeft').args()).toEqual(['-orient', 'TopLeft'])
  expect(new CB().orient('RightTop').args()).toEqual(['-orient', 'RightTop'])
  expect(new CB().orient('BottomRight').args()).toEqual(['-orient', 'BottomRight'])
})

test('page method', () => {
  expect(new CB().page('A4').args()).toEqual(['-page', 'A4'])
  expect(new CB().page('612x792+0+0').args()).toEqual(['-page', '612x792+0+0'])
  expect(new CB().page().args()).toEqual(['+page'])
})

test('paint method', () => {
  expect(new CB().paint(5).args()).toEqual(['-paint', '5'])
  expect(new CB().paint(10).args()).toEqual(['-paint', '10'])
  expect(new CB().paint(2).args()).toEqual(['-paint', '2'])
})

test('polaroid method', () => {
  expect(new CB().polaroid(15).args()).toEqual(['-polaroid', '15'])
  expect(new CB().polaroid(-10).args()).toEqual(['-polaroid', '-10'])
  expect(new CB().polaroid(45).args()).toEqual(['-polaroid', '45'])
  expect(new CB().polaroid().args()).toEqual(['+polaroid'])
})

test('posterize method', () => {
  expect(new CB().posterize(4).args()).toEqual(['-posterize', '4'])
  expect(new CB().posterize(8).args()).toEqual(['-posterize', '8'])
  expect(new CB().posterize(16).args()).toEqual(['-posterize', '16'])
})

test('preview method', () => {
  expect(new CB().preview('Rotate').args()).toEqual(['-preview', 'Rotate'])
  expect(new CB().preview('Blur').args()).toEqual(['-preview', 'Blur'])
  expect(new CB().preview('Sharpen').args()).toEqual(['-preview', 'Sharpen'])
})

test('print method', () => {
  expect(new CB().print('Image: %f\n').args()).toEqual(['-print', 'Image: %f\n'])
  expect(new CB().print('%wx%h').args()).toEqual(['-print', '%wx%h'])
  expect(new CB().print('%[fx:mean]').args()).toEqual(['-print', '%[fx:mean]'])
})

test('profile method', () => {
  expect(new CB().profile('sRGB.icc').args()).toEqual(['-profile', 'sRGB.icc'])
  expect(new CB().profile('AdobeRGB.icc').args()).toEqual(['-profile', 'AdobeRGB.icc'])
  expect(new CB().profile('!xmp,*', true).args()).toEqual(['+profile', '!xmp,*'])
})

test('quantize method', () => {
  expect(new CB().quantize('YUV').args()).toEqual(['-quantize', 'YUV'])
  expect(new CB().quantize('RGB').args()).toEqual(['-quantize', 'RGB'])
  expect(new CB().quantize('Gray').args()).toEqual(['-quantize', 'Gray'])
})

test('quiet method', () => {
  expect(new CB().quiet().args()).toEqual(['-quiet'])
  expect(new CB().quiet(true).args()).toEqual(['-quiet'])
  expect(new CB().quiet(false).args()).toEqual(['+quiet'])
})

test('rotationalBlur method', () => {
  expect(new CB().rotationalBlur(10).args()).toEqual(['-rotational-blur', '10'])
  expect(new CB().rotationalBlur(45).args()).toEqual(['-rotational-blur', '45'])
  expect(new CB().rotationalBlur(5).args()).toEqual(['-rotational-blur', '5'])
})

test('raise method', () => {
  expect(new CB().raise(10, 10).args()).toEqual(['-raise', '10x10'])
  expect(new CB().raise(5, 5, true).args()).toEqual(['+raise', '5x5'])
  expect(new CB().raise(8).args()).toEqual(['-raise', '8'])
})

test('randomThreshold method', () => {
  expect(new CB().randomThreshold('20%', '80%').args()).toEqual(['-random-threshold', '20%,80%'])
  expect(new CB().randomThreshold(20, 80).args()).toEqual(['-random-threshold', '20,80'])
  expect(new CB().randomThreshold('10%', '90%').args()).toEqual(['-random-threshold', '10%,90%'])
})

test('redPrimary method', () => {
  expect(new CB().redPrimary(0.64, 0.33).args()).toEqual(['-red-primary', '0.64,0.33'])
  expect(new CB().redPrimary(0.7, 0.3).args()).toEqual(['-red-primary', '0.7,0.3'])
})

test('regardWarnings method', () => {
  expect(new CB().regardWarnings().args()).toEqual(['-regard-warnings'])
  expect(new CB().regardWarnings(true).args()).toEqual(['-regard-warnings'])
  expect(new CB().regardWarnings(false).args()).toEqual(['+regard-warnings'])
})

test('remap method', () => {
  expect(new CB().remap('palette.gif').args()).toEqual(['-remap', 'palette.gif'])
  expect(new CB().remap('colors.png').args()).toEqual(['-remap', 'colors.png'])
})

test('render method', () => {
  expect(new CB().render().args()).toEqual(['-render'])
  expect(new CB().render(true).args()).toEqual(['-render'])
  expect(new CB().render(false).args()).toEqual(['+render'])
})

test('repage method', () => {
  expect(new CB().repage('100x100+0+0').args()).toEqual(['-repage', '100x100+0+0'])
  expect(new CB().repage('200x150').args()).toEqual(['-repage', '200x150'])
  expect(new CB().repage().args()).toEqual(['+repage'])
})

test('resample method', () => {
  expect(new CB().resample('300x300').args()).toEqual(['-resample', '300x300'])
  expect(new CB().resample('72').args()).toEqual(['-resample', '72'])
  expect(new CB().resample('150x150').args()).toEqual(['-resample', '150x150'])
})

test('roll method', () => {
  expect(new CB().roll(20, 10).args()).toEqual(['-roll', '+20+10'])
  expect(new CB().roll(-50, -25).args()).toEqual(['-roll', '-50-25'])
  expect(new CB().roll(30, -15).args()).toEqual(['-roll', '+30-15'])

  // zero coordinates must keep their sign so digits do not merge
  expect(new CB().roll(5, 0).args()).toEqual(['-roll', '+5+0'])
  expect(new CB().roll(0, 5).args()).toEqual(['-roll', '+0+5'])
})

test('sample method', () => {
  expect(new CB().sample(200, 100).args()).toEqual(['-sample', '200x100'])
  expect(new CB().sample(400).args()).toEqual(['-sample', '400'])
  expect(new CB().sample(g => g.scale(50)).args()).toEqual(['-sample', '50%'])
  expect(new CB().sample(g => g.size(300, 200).flag('!')).args()).toEqual(['-sample', '300x200!'])
})

test('samplingFactor method', () => {
  expect(new CB().samplingFactor('4:2:0').args()).toEqual(['-sampling-factor', '4:2:0'])
  expect(new CB().samplingFactor('4:4:4').args()).toEqual(['-sampling-factor', '4:4:4'])
  expect(new CB().samplingFactor('2x2').args()).toEqual(['-sampling-factor', '2x2'])
})

test('scale method', () => {
  expect(new CB().scale(200, 100).args()).toEqual(['-scale', '200x100'])
  expect(new CB().scale(400).args()).toEqual(['-scale', '400'])
  expect(new CB().scale(g => g.scale(50)).args()).toEqual(['-scale', '50%'])
  expect(new CB().scale(g => g.size(300, 200).flag('exact')).args()).toEqual(['-scale', '300x200!'])
})

test('scene method', () => {
  expect(new CB().scene(5).args()).toEqual(['-scene', '5'])
  expect(new CB().scene(0).args()).toEqual(['-scene', '0'])
  expect(new CB().scene(100).args()).toEqual(['-scene', '100'])
})

test('seed method', () => {
  expect(new CB().seed(123).args()).toEqual(['-seed', '123'])
  expect(new CB().seed(456).args()).toEqual(['-seed', '456'])
  expect(new CB().seed(0).args()).toEqual(['-seed', '0'])
})

test('segment method', () => {
  expect(new CB().segment(1, 1.5).args()).toEqual(['-segment', '1x1.5'])
  expect(new CB().segment(2, 2.0).args()).toEqual(['-segment', '2x2'])
  expect(new CB().segment(0.5, 0.8).args()).toEqual(['-segment', '0.5x0.8'])
})

test('selectiveBlur method', () => {
  expect(new CB().selectiveBlur(0, 1, '10%').args()).toEqual(['-selective-blur', '0x1+10%'])
  expect(new CB().selectiveBlur(2, 3, '5%').args()).toEqual(['-selective-blur', '2x3+5%'])
  expect(new CB().selectiveBlur(5, 2, '15%').args()).toEqual(['-selective-blur', '5x2+15%'])
})

test('separate method', () => {
  expect(new CB().separate().args()).toEqual(['-separate'])
})

test('sepiaTone method', () => {
  expect(new CB().sepiaTone('80%').args()).toEqual(['-sepia-tone', '80%'])
  expect(new CB().sepiaTone('50%').args()).toEqual(['-sepia-tone', '50%'])
  expect(new CB().sepiaTone('90%').args()).toEqual(['-sepia-tone', '90%'])
})

test('set method', () => {
  expect(new CB().set('comment', 'My photo').args()).toEqual(['-set', 'comment', 'My photo'])
  expect(new CB().set('label', 'Test Image').args()).toEqual(['-set', 'label', 'Test Image'])
  expect(new CB().set('comment').args()).toEqual(['+set', 'comment'])
})

test('shade method', () => {
  expect(new CB().shade(30, 30).args()).toEqual(['-shade', '30x30'])
  expect(new CB().shade(60, 20).args()).toEqual(['-shade', '60x20'])
})

test('shadow method', () => {
  expect(new CB().shadow(80, 3, 5, 5).args()).toEqual(['-shadow', '80x3+5+5'])
  expect(new CB().shadow(60, 4).args()).toEqual(['-shadow', '60x4'])
  expect(new CB().shadow(80).args()).toEqual(['-shadow', '80'])
  expect(new CB().shadow(80, 3, -5, -5).args()).toEqual(['-shadow', '80x3-5-5'])
})

test('shave method', () => {
  expect(new CB().shave(10, 10).args()).toEqual(['-shave', '10x10'])
  expect(new CB().shave(5, 8).args()).toEqual(['-shave', '5x8'])
  expect(new CB().shave('10%', '10%').args()).toEqual(['-shave', '10%x10%'])
})

test('shear method', () => {
  expect(new CB().shear(30, 0).args()).toEqual(['-shear', '30x0'])
  expect(new CB().shear(0, 30).args()).toEqual(['-shear', '0x30'])
  expect(new CB().shear(15, 10).args()).toEqual(['-shear', '15x10'])

  // single value: imagemagick applies it to both axes
  expect(new CB().shear(20).args()).toEqual(['-shear', '20'])
})

test('sigmoidalContrast method', () => {
  expect(new CB().sigmoidalContrast(3, 50).args()).toEqual(['-sigmoidal-contrast', '3x50'])
  expect(new CB().sigmoidalContrast(3, '50%').args()).toEqual(['-sigmoidal-contrast', '3x50%'])
  expect(new CB().sigmoidalContrast(3, '50%', true).args()).toEqual(['-sigmoidal-contrast', '3x50%'])
  expect(new CB().sigmoidalContrast(3, '50%', false).args()).toEqual(['+sigmoidal-contrast', '3x50%'])
  expect(new CB().sigmoidalContrast(5, 25).args()).toEqual(['-sigmoidal-contrast', '5x25'])
})

test('sketch method', () => {
  expect(new CB().sketch(0, 20, 120).args()).toEqual(['-sketch', '0x20+120'])
  expect(new CB().sketch(2, 10, 90).args()).toEqual(['-sketch', '2x10+90'])
  expect(new CB().sketch(5, 15, 45).args()).toEqual(['-sketch', '5x15+45'])
})

test('smush method', () => {
  // -smush stacks top-to-bottom (like -append); +smush joins left-to-right
  expect(new CB().smush(10).args()).toEqual(['-smush', '10'])
  expect(new CB().smush(-5).args()).toEqual(['-smush', '-5'])
  expect(new CB().smush(15, true).args()).toEqual(['+smush', '15'])
})

test('solarize method', () => {
  expect(new CB().solarize('50%').args()).toEqual(['-solarize', '50%'])
  expect(new CB().solarize(128).args()).toEqual(['-solarize', '128'])
  expect(new CB().solarize('75%').args()).toEqual(['-solarize', '75%'])
})

test('splice method', () => {
  expect(new CB().splice(10, 10, 100, 100).args()).toEqual(['-splice', '10x10+100+100'])
  expect(new CB().splice(20, 15, 50, 75).args()).toEqual(['-splice', '20x15+50+75'])
  expect(new CB().splice(5, 8, 25, 30).args()).toEqual(['-splice', '5x8+25+30'])
  expect(new CB().splice(g => g.size(0, 10).offset(0, 0)).args()).toEqual(['-splice', '0x10+0+0'])
})

test('spread method', () => {
  expect(new CB().spread(3).args()).toEqual(['-spread', '3'])
  expect(new CB().spread(5).args()).toEqual(['-spread', '5'])
  expect(new CB().spread(1).args()).toEqual(['-spread', '1'])
})

test('statistic method', () => {
  expect(new CB().statistic('Median', 2, 2).args()).toEqual(['-statistic', 'Median', '2x2'])
  expect(new CB().statistic('Mean', 3, 3).args()).toEqual(['-statistic', 'Mean', '3x3'])
  expect(new CB().statistic('Maximum', 1, 1).args()).toEqual(['-statistic', 'Maximum', '1x1'])
  expect(new CB().statistic('Contrast', 2, 2).args()).toEqual(['-statistic', 'Contrast', '2x2'])
  expect(new CB().statistic('NonPeak', 2, 2).args()).toEqual(['-statistic', 'NonPeak', '2x2'])
})

test('stretch method', () => {
  expect(new CB().stretch('Normal').args()).toEqual(['-stretch', 'Normal'])
  expect(new CB().stretch('Condensed').args()).toEqual(['-stretch', 'Condensed'])
  expect(new CB().stretch('Expanded').args()).toEqual(['-stretch', 'Expanded'])
})

test('stroke method', () => {
  expect(new CB().stroke('black').args()).toEqual(['-stroke', 'black'])
  expect(new CB().stroke('#FF0000').args()).toEqual(['-stroke', '#FF0000'])
  expect(new CB().stroke('blue').args()).toEqual(['-stroke', 'blue'])
})

test('strokeWidth method', () => {
  expect(new CB().strokewidth(2).args()).toEqual(['-strokewidth', '2'])
  expect(new CB().strokewidth(1).args()).toEqual(['-strokewidth', '1'])
  expect(new CB().strokewidth(5).args()).toEqual(['-strokewidth', '5'])
})

test('style method', () => {
  expect(new CB().style('Italic').args()).toEqual(['-style', 'Italic'])
  expect(new CB().style('Normal').args()).toEqual(['-style', 'Normal'])
  expect(new CB().style('Oblique').args()).toEqual(['-style', 'Oblique'])
})

test('virtualPixel method', () => {
  expect(new CB().virtualPixel('Edge').args()).toEqual(['-virtual-pixel', 'Edge'])
  expect(new CB().virtualPixel('Mirror').args()).toEqual(['-virtual-pixel', 'Mirror'])
  expect(new CB().virtualPixel('Transparent').args()).toEqual(['-virtual-pixel', 'Transparent'])
})

test('swirl method', () => {
  expect(new CB().swirl(90).args()).toEqual(['-swirl', '90'])
  expect(new CB().swirl(-45).args()).toEqual(['-swirl', '-45'])
  expect(new CB().swirl(180).args()).toEqual(['-swirl', '180'])
})

test('texture method', () => {
  expect(new CB().texture('pattern.jpg').args()).toEqual(['-texture', 'pattern.jpg'])
  expect(new CB().texture('tile.png').args()).toEqual(['-texture', 'tile.png'])
})

test('threshold method', () => {
  expect(new CB().threshold('50%').args()).toEqual(['-threshold', '50%'])
  expect(new CB().threshold(128).args()).toEqual(['-threshold', '128'])
  expect(new CB().threshold().args()).toEqual(['+threshold'])
})

test('thumbnail method', () => {
  expect(new CB().thumbnail(150, 150).args()).toEqual(['-thumbnail', '150x150'])
  expect(new CB().thumbnail(100).args()).toEqual(['-thumbnail', '100'])
  expect(new CB().thumbnail(undefined, 200).args()).toEqual(['-thumbnail', 'x200'])
})

test('thumbnail with callback', () => {
  expect(new CB().thumbnail(g => g.scale(50)).args()).toEqual(['-thumbnail', '50%'])
  expect(new CB().thumbnail(g => g.size(100, 100).flag('!')).args()).toEqual(['-thumbnail', '100x100!'])
})

test('tile method', () => {
  expect(new CB().tile('pattern.png').args()).toEqual(['-tile', 'pattern.png'])
  expect(new CB().tile('texture.jpg').args()).toEqual(['-tile', 'texture.jpg'])
})

test('tint method', () => {
  expect(new CB().tint('50%').args()).toEqual(['-tint', '50%'])
  expect(new CB().tint(25).args()).toEqual(['-tint', '25'])
  expect(new CB().tint('100%').args()).toEqual(['-tint', '100%'])
})

test('transform method', () => {
  expect(new CB().transform().args()).toEqual(['-transform'])
})

test('transparent method', () => {
  expect(new CB().transparent('white').args()).toEqual(['-transparent', 'white'])
  expect(new CB().transparent('#FF0000').args()).toEqual(['-transparent', '#FF0000'])
  expect(new CB().transparent('red', true).args()).toEqual(['+transparent', 'red'])
})

test('transpose method', () => {
  expect(new CB().transpose().args()).toEqual(['-transpose'])
})

test('transverse method', () => {
  expect(new CB().transverse().args()).toEqual(['-transverse'])
})

test('treedepth method', () => {
  expect(new CB().treedepth(8).args()).toEqual(['-treedepth', '8'])
  expect(new CB().treedepth(16).args()).toEqual(['-treedepth', '16'])
})

test('type method', () => {
  expect(new CB().type('Grayscale').args()).toEqual(['-type', 'Grayscale'])
  expect(new CB().type('Palette').args()).toEqual(['-type', 'Palette'])
  expect(new CB().type('TrueColorAlpha').args()).toEqual(['-type', 'TrueColorAlpha'])
})

test('undercolor method', () => {
  expect(new CB().undercolor('blue').args()).toEqual(['-undercolor', 'blue'])
  expect(new CB().undercolor('#00FF00').args()).toEqual(['-undercolor', '#00FF00'])
})

test('uniqueColors method', () => {
  expect(new CB().uniqueColors().args()).toEqual(['-unique-colors'])
})

test('units method', () => {
  expect(new CB().units('PixelsPerInch').args()).toEqual(['-units', 'PixelsPerInch'])
  expect(new CB().units('PixelsPerCentimeter').args()).toEqual(['-units', 'PixelsPerCentimeter'])
})

test('unsharp method', () => {
  expect(new CB().unsharp(0, 0.5, 0.5, 0.1).args()).toEqual(['-unsharp', '0x0.5+0.5+0.1'])
  expect(new CB().unsharp(2, 1, 1, 0.05).args()).toEqual(['-unsharp', '2x1+1+0.05'])
})

test('verbose method', () => {
  expect(new CB().verbose().args()).toEqual(['-verbose'])
  expect(new CB().verbose(true).args()).toEqual(['-verbose'])
  expect(new CB().verbose(false).args()).toEqual(['+verbose'])
})

test('version method', () => {
  expect(new CB().version().args()).toEqual(['-version'])
})

test('vignette method', () => {
  expect(new CB().vignette(0, 150).args()).toEqual(['-vignette', '0x150'])
  expect(new CB().vignette(2, 100, 5, 5).args()).toEqual(['-vignette', '2x100+5+5'])
  expect(new CB().vignette(5).args()).toEqual(['-vignette', '5'])
  expect(new CB().vignette(0, 2, '10%', '10%').args()).toEqual(['-vignette', '0x2+10%+10%'])
})

test('wave method', () => {
  expect(new CB().wave(25, 150).args()).toEqual(['-wave', '25x150'])
  expect(new CB().wave(10, 100).args()).toEqual(['-wave', '10x100'])
})

test('weight method', () => {
  expect(new CB().weight('Bold').args()).toEqual(['-weight', 'Bold'])
  expect(new CB().weight(400).args()).toEqual(['-weight', '400'])
})

test('whitePoint method', () => {
  expect(new CB().whitePoint(0.3127, 0.329).args()).toEqual(['-white-point', '0.3127,0.329'])
  expect(new CB().whitePoint(0.31, 0.33).args()).toEqual(['-white-point', '0.31,0.33'])
})

test('whiteThreshold method', () => {
  expect(new CB().whiteThreshold('80%').args()).toEqual(['-white-threshold', '80%'])
  expect(new CB().whiteThreshold(200).args()).toEqual(['-white-threshold', '200'])
})

test('write method', () => {
  expect(new CB().write('output.png').args()).toEqual(['-write', 'output.png'])
  expect(new CB().write('temp.jpg').args()).toEqual(['-write', 'temp.jpg'])
})

test('swap method', () => {
  expect(new CB().swap(0, 1).args()).toEqual(['-swap', '0,1'])
  expect(new CB().swap(2, 3).args()).toEqual(['-swap', '2,3'])
  expect(new CB().swap(1, 4).args()).toEqual(['-swap', '1,4'])
})

test('xc method variations', () => {
  expect(new CB().xc().args()).toEqual(['xc:'])
  expect(new CB().xc('red').args()).toEqual(['xc:red'])
  expect(new CB().xc('red', 200).args()).toEqual(['xc:red[200]'])
  expect(new CB().xc('red', 200, 100).args()).toEqual(['xc:red[200x100!]'])
  expect(new CB().xc(150).args()).toEqual(['xc:[150]'])
  expect(new CB().xc(300, 200).args()).toEqual(['xc:[300x200!]'])
  expect(new CB().xc('#FF0000').args()).toEqual(['xc:#FF0000'])
  expect(new CB().xc('#FF0000', 100).args()).toEqual(['xc:#FF0000[100]'])
  expect(new CB().xc('#FF0000', 100, 200).args()).toEqual(['xc:#FF0000[100x200!]'])
  expect(new CB().xc('blue').args()).toEqual(['xc:blue'])
  expect(new CB().xc('none').args()).toEqual(['xc:none'])
  expect(new CB().xc('white', 50).args()).toEqual(['xc:white[50]'])
})

test('canvas method (alias for xc)', () => {
  // canvas is exactly like xc but output canvas: prefix
  expect(new CB().canvas().args()).toEqual(['canvas:'])
  expect(new CB().canvas('red').args()).toEqual(['canvas:red'])
  expect(new CB().canvas('red', 200).args()).toEqual(['canvas:red[200]'])
  expect(new CB().canvas('red', 200, 100).args()).toEqual(['canvas:red[200x100!]'])
  expect(new CB().canvas(150).args()).toEqual(['canvas:[150]'])
  expect(new CB().canvas(300, 200).args()).toEqual(['canvas:[300x200!]'])
})

test('resource method with string', () => {
  const im = new CB()

  im.resource('image.png')

  expect(im.args()).toEqual(['image.png'])
})

test('resource method with buffer creates fd reference', () => {
  const im = new CB()
  const buffer = Buffer.from('test image data')

  im.resource(buffer)

  expect(im.args()).toEqual(['fd:3'])
  expect(im.buffers()).toEqual([buffer])
})

test('multiple buffers get sequential fd numbers', () => {
  const im = new CB()
  const buffer1 = Buffer.from('image1')
  const buffer2 = Buffer.from('image2')
  const buffer3 = Buffer.from('image3')

  im.resource(buffer1)
  im.resource(buffer2)
  im.resource(buffer3)

  expect(im.args()).toEqual(['fd:3', 'fd:4', 'fd:5'])
  expect(im.buffers()).toEqual([buffer1, buffer2, buffer3])
})

test('mixed string and buffer resources', () => {
  const im = new CB()
  const buffer = Buffer.from('test')

  im.resource('file1.png')
  im.resource(buffer)
  im.resource('file2.png')

  expect(im.args()).toEqual(['file1.png', 'fd:3', 'file2.png'])
  expect(im.buffers()).toEqual([buffer])
})

test('fds() returns copy of buffers array', () => {
  const im = new CB()
  const buffer = Buffer.from('test')

  im.resource(buffer)
  const fds1 = im.buffers()
  const fds2 = im.buffers()

  expect(fds1).toEqual([buffer])
  expect(fds2).toEqual([buffer])
  expect(fds1).not.toBe(fds2)
})

test('complex command with buffers', () => {
  const im = new CB()
  const backgroundBuffer = Buffer.from('background')
  const overlayBuffer = Buffer.from('overlay')

  im.resource(backgroundBuffer).resource(overlayBuffer).composite().resource('output.png')

  expect(im.args()).toEqual(['fd:3', 'fd:4', '-composite', 'output.png'])
  expect(im.buffers()).toEqual([backgroundBuffer, overlayBuffer])
})

test('buffers in nested builders get distinct fd numbers', () => {
  const backgroundBuffer = Buffer.from('background')
  const overlayBuffer = Buffer.from('overlay')

  const im = new CB(backgroundBuffer)
  im.parens(new CB(overlayBuffer).resize(10, 10))
  im.composite()

  expect(im.args()).toEqual(['fd:3', '(', 'fd:4', '-resize', '10x10', ')', '-composite'])
  expect(im.buffers()).toEqual([backgroundBuffer, overlayBuffer])
})

test('buffer added to a nested builder after embedding is still counted', () => {
  const buffer = Buffer.from('late')
  const nested = new CB()

  const im = new CB('base.png')
  im.parens(nested)
  nested.resource(buffer)

  expect(im.args()).toEqual(['base.png', '(', 'fd:3', ')'])
  expect(im.buffers()).toEqual([buffer])
})

test('same buffer used twice gets one fd per occurrence', () => {
  const buffer = Buffer.from('reused')

  const im = new CB(buffer)
  im.parens(new CB(buffer))

  expect(im.args()).toEqual(['fd:3', '(', 'fd:4', ')'])
  expect(im.buffers()).toEqual([buffer, buffer])
})

test('contrastStretch', () => {
  expect(new CB().contrastStretch(2, 5).args()).toEqual(['-contrast-stretch', '2x5'])
  expect(new CB().contrastStretch(1000).args()).toEqual(['-contrast-stretch', '1000'])
  expect(new CB().contrastStretch('2%', '1%').args()).toEqual(['-contrast-stretch', '2%x1%'])
})

test('labelProperty', () => {
  expect(new CB().labelProperty('hello').args()).toEqual(['-label', 'hello'])
})

test('label (resource creator, unchanged behavior)', () => {
  expect(new CB().label('hello').args()).toEqual(['label:hello'])
})

test('wordBreak', () => {
  expect(new CB().wordBreak('Normal').args()).toEqual(['-word-break', 'Normal'])
  expect(new CB().wordBreak('BreakWord').args()).toEqual(['-word-break', 'BreakWord'])
})

test('canny', () => {
  expect(new CB().canny(0, 1).args()).toEqual(['-canny', '0x1'])
})

test('canny with thresholds', () => {
  expect(new CB().canny(0, 1, '10%', '30%').args()).toEqual(['-canny', '0x1+10%+30%'])
  expect(new CB().canny(0, 1, 10, 30).args()).toEqual(['-canny', '0x1+10+30'])
})

test('clahe with percentage dimensions', () => {
  expect(new CB().clahe(50, 50).args()).toEqual(['-clahe', '50x50'])
  expect(new CB().clahe('25%', '25%').args()).toEqual(['-clahe', '25%x25%'])
})

test('clahe with tiles and limit', () => {
  expect(new CB().clahe(50, 50, 128, 3).args()).toEqual(['-clahe', '50x50+128+3'])
  expect(new CB().clahe('25%', '25%', 128, 3).args()).toEqual(['-clahe', '25%x25%+128+3'])
})

test('clahe with callback for exact tile flag', () => {
  expect(new CB().clahe(g => g.scale(50, 50).offset(128, 3).flag('!')).args()).toEqual(['-clahe', '50%x50%!+128+3'])
})

test('meanShift with percent distance', () => {
  expect(new CB().meanShift(7, 7, '10%').args()).toEqual(['-mean-shift', '7x7+10%'])
  expect(new CB().meanShift(7, 7, 10).args()).toEqual(['-mean-shift', '7x7+10'])
})

test('extract with callback', () => {
  expect(new CB().extract(g => g.size(100, 100).offset(50, 25)).args()).toEqual(['-extract', '100x100+50+25'])
})

test('interpolativeResize with callback', () => {
  expect(new CB().interpolativeResize(g => g.size(200, 100)).args()).toEqual(['-interpolative-resize', '200x100'])
})

test('liquidRescale with callback', () => {
  expect(new CB().liquidRescale(g => g.size(150, 200).offset(3, 1)).args()).toEqual(['-liquid-rescale', '150x200+3+1'])
})

test('page with callback', () => {
  expect(new CB().page(g => g.size(612, 792).offset(0, 0)).args()).toEqual(['-page', '612x792+0+0'])
})

test('repage with callback', () => {
  expect(new CB().repage(g => g.size(100, 100).offset(0, 0)).args()).toEqual(['-repage', '100x100+0+0'])
})

test('sample with callback', () => {
  expect(new CB().sample(g => g.size(200, 100)).args()).toEqual(['-sample', '200x100'])
})

test('scale with callback', () => {
  expect(new CB().scale(g => g.scale(50)).args()).toEqual(['-scale', '50%'])
})

test('copy method', () => {
  expect(new CB().copy(10, 10, 0, 0, 50, 50).args()).toEqual(['-copy', '10x10+0+0', '+50+50'])
  expect(
    new CB()
      .copy(
        g => g.size(10, 10).offset(0, 0),
        g => g.offset(50, 50)
      )
      .args()
  ).toEqual(['-copy', '10x10+0+0', '+50+50'])
})

test('rangeThreshold method', () => {
  expect(new CB().rangeThreshold('10%', '20%', '80%', '90%').args()).toEqual(['-range-threshold', '10%,20%,80%,90%'])
  expect(new CB().rangeThreshold(50, 100, 200, 250).args()).toEqual(['-range-threshold', '50,100,200,250'])
})

test('connectedComponents method', () => {
  expect(new CB().connectedComponents(4).args()).toEqual(['-connected-components', '4'])
  expect(new CB().connectedComponents(8).args()).toEqual(['-connected-components', '8'])
})

test('delete method', () => {
  expect(new CB().delete(0, 2).args()).toEqual(['-delete', '0,2'])
  expect(new CB().delete().args()).toEqual(['+delete'])
})

test('region method', () => {
  expect(new CB().region(100, 80).args()).toEqual(['-region', '100x80'])
  expect(new CB().region(100, 80, 10, 20).args()).toEqual(['-region', '100x80+10+20'])
  expect(new CB().region(g => g.size(100, 80).offset(-10, -20)).args()).toEqual(['-region', '100x80-10-20'])
})

test('metric method', () => {
  expect(new CB().metric('RMSE').args()).toEqual(['-metric', 'RMSE'])
  expect(new CB().metric('AE').args()).toEqual(['-metric', 'AE'])
})

test('highlight and lowlight colors', () => {
  expect(new CB().highlightColor('red').args()).toEqual(['-highlight-color', 'red'])
  expect(new CB().lowlightColor('blue').args()).toEqual(['-lowlight-color', 'blue'])
})
