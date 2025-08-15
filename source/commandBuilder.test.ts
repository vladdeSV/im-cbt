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

test('clone method variations (must be in parens irl)', () => {
  expect(new IMCB().clone().parts()).toEqual(['+clone'])
  expect(new IMCB().clone(1).parts()).toEqual(['-clone', '1'])
  expect(new IMCB().clone(-1).parts()).toEqual(['-clone', '-1'])
  expect(new IMCB().clone(1, 2).parts()).toEqual(['-clone', '1,2'])
  expect(new IMCB().clone(2, 4, -1).parts()).toEqual(['-clone', '2,4,-1'])
  expect(new IMCB().clone(0, 1, 2).parts()).toEqual(['-clone', '0,1,2'])
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

test('affine method', () => {
  expect(new IMCB().affine(1, 0, 0, 1).parts()).toEqual(['-affine', '1,0,0,1'])
  expect(new IMCB().affine(1, 0, 0, 1.5).parts()).toEqual(['-affine', '1,0,0,1.5'])
  expect(new IMCB().affine(1, 0, 0, 1, 10, 20).parts()).toEqual(['-affine', '1,0,0,1,10,20'])
})

test('annotate method', () => {
  expect(new IMCB().annotate(0, 'Hello').parts()).toEqual(['-annotate', '0', 'Hello'])
  expect(new IMCB().annotate(45, 'Rotated Text').parts()).toEqual(['-annotate', '45', 'Rotated Text'])
  expect(new IMCB().annotate(-90, 'Vertical').parts()).toEqual(['-annotate', '-90', 'Vertical'])
})

test('authenticate method', () => {
  expect(new IMCB().authenticate('password123').parts()).toEqual(['-authenticate', 'password123'])
  expect(new IMCB().authenticate('secret').parts()).toEqual(['-authenticate', 'secret'])
})

test('auto-gamma method', () => {
  expect(new IMCB().autoGamma().parts()).toEqual(['-auto-gamma'])
})

test('auto-level method', () => {
  expect(new IMCB().autoLevel().parts()).toEqual(['-auto-level'])
})

test('bias method', () => {
  expect(new IMCB().bias('50%').parts()).toEqual(['-bias', '50%'])
  expect(new IMCB().bias('0.5').parts()).toEqual(['-bias', '0.5'])
  expect(new IMCB().bias('25%').parts()).toEqual(['-bias', '25%'])
})

test('blackThreshold method', () => {
  expect(new IMCB().blackThreshold('50%').parts()).toEqual(['-black-threshold', '50%'])
  expect(new IMCB().blackThreshold('128').parts()).toEqual(['-black-threshold', '128'])
  expect(new IMCB().blackThreshold('25%').parts()).toEqual(['-black-threshold', '25%'])
})

test('border method', () => {
  expect(new IMCB().border(10, 10).parts()).toEqual(['-border', '10x10'])
  expect(new IMCB().border(5, 8).parts()).toEqual(['-border', '5x8'])
  expect(new IMCB().border(15).parts()).toEqual(['-border', '15'])
})

test('borderColor method', () => {
  expect(new IMCB().bordercolor('red').parts()).toEqual(['-bordercolor', 'red'])
  expect(new IMCB().bordercolor('#FF0000').parts()).toEqual(['-bordercolor', '#FF0000'])
  expect(new IMCB().bordercolor('blue').parts()).toEqual(['-bordercolor', 'blue'])
})

test('despeckle method', () => {
  expect(new IMCB().despeckle().parts()).toEqual(['-despeckle'])
})

test('gaussianBlur method', () => {
  expect(new IMCB().gaussianBlur(0, 1).parts()).toEqual(['-gaussian-blur', '0x1'])
  expect(new IMCB().gaussianBlur(5, 2).parts()).toEqual(['-gaussian-blur', '5x2'])
  expect(new IMCB().gaussianBlur(3).parts()).toEqual(['-gaussian-blur', '3'])
})

test('density method', () => {
  expect(new IMCB().density(300).parts()).toEqual(['-density', '300'])
  expect(new IMCB().density(300, 300).parts()).toEqual(['-density', '300x300'])
  expect(new IMCB().density(150, 200).parts()).toEqual(['-density', '150x200'])
})

test('depth method', () => {
  expect(new IMCB().depth(8).parts()).toEqual(['-depth', '8'])
  expect(new IMCB().depth(16).parts()).toEqual(['-depth', '16'])
  expect(new IMCB().depth(32).parts()).toEqual(['-depth', '32'])
})

test('normalize method', () => {
  expect(new IMCB().normalize().parts()).toEqual(['-normalize'])
})

test('negate method', () => {
  expect(new IMCB().negate().parts()).toEqual(['-negate'])
})

test('monochrome method', () => {
  expect(new IMCB().monochrome().parts()).toEqual(['-monochrome'])
})

test('equalize method', () => {
  expect(new IMCB().equalize().parts()).toEqual(['-equalize'])
})

test('flatten method', () => {
  expect(new IMCB().flatten().parts()).toEqual(['-flatten'])
})

test('ping method', () => {
  expect(new IMCB().ping().parts()).toEqual(['-ping'])
})

test('reverse method', () => {
  expect(new IMCB().reverse().parts()).toEqual(['-reverse'])
})

test('brightnessContrast method', () => {
  expect(new IMCB().brightnessContrast(10, 5).parts()).toEqual(['-brightness-contrast', '10x5'])
  expect(new IMCB().brightnessContrast(-10, 20).parts()).toEqual(['-brightness-contrast', '-10x20'])
  expect(new IMCB().brightnessContrast(0, -5).parts()).toEqual(['-brightness-contrast', '0x-5'])
})

test('channel method', () => {
  expect(new IMCB().channel('RGB').parts()).toEqual(['-channel', 'RGB'])
  expect(new IMCB().channel('Red', 'Green').parts()).toEqual(['-channel', 'Red,Green'])
  expect(new IMCB().channel('Red', 'Green', 'Blue').parts()).toEqual(['-channel', 'Red,Green,Blue'])
  expect(new IMCB().channel().parts()).toEqual(['+channel'])
})

test('charcoal method', () => {
  expect(new IMCB().charcoal(2).parts()).toEqual(['-charcoal', '2'])
  expect(new IMCB().charcoal(0, 1).parts()).toEqual(['-charcoal', '0x1'])
  expect(new IMCB().charcoal(5).parts()).toEqual(['-charcoal', '5'])
})

test('chop method', () => {
  expect(new IMCB().chop(10, 10, 5, 5).parts()).toEqual(['-chop', '10x10+5+5'])
  expect(new IMCB().chop(50, 50).parts()).toEqual(['-chop', '50x50'])
  expect(new IMCB().chop(20, 15, -10, -5).parts()).toEqual(['-chop', '20x15-10-5'])
})

test('compress method', () => {
  expect(new IMCB().compress('JPEG').parts()).toEqual(['-compress', 'JPEG'])
  expect(new IMCB().compress('None').parts()).toEqual(['-compress', 'None'])
  expect(new IMCB().compress('Zip').parts()).toEqual(['-compress', 'Zip'])
})

test('contrastStretch method', () => {
  expect(new IMCB().contrastStretch(2, 1).parts()).toEqual(['-contrast-stretch', '2%x1%'])
  expect(new IMCB().contrastStretch(0, 0).parts()).toEqual(['-contrast-stretch', '0x0'])
  expect(new IMCB().contrastStretch(5, 3).parts()).toEqual(['-contrast-stretch', '5%x3%'])
})

test('cycle method', () => {
  expect(new IMCB().cycle(50).parts()).toEqual(['-cycle', '50'])
  expect(new IMCB().cycle(-25).parts()).toEqual(['-cycle', '-25'])
  expect(new IMCB().cycle(100).parts()).toEqual(['-cycle', '100'])
})

test('edge method', () => {
  expect(new IMCB().edge(1).parts()).toEqual(['-edge', '1'])
  expect(new IMCB().edge(2).parts()).toEqual(['-edge', '2'])
  expect(new IMCB().edge(0.5).parts()).toEqual(['-edge', '0.5'])
})

test('emboss method', () => {
  expect(new IMCB().emboss(2).parts()).toEqual(['-emboss', '2'])
  expect(new IMCB().emboss(0, 1).parts()).toEqual(['-emboss', '0x1'])
  expect(new IMCB().emboss(3).parts()).toEqual(['-emboss', '3'])
})

test('gamma method', () => {
  expect(new IMCB().gamma(0.8).parts()).toEqual(['-gamma', '0.8'])
  expect(new IMCB().gamma(2.2).parts()).toEqual(['-gamma', '2.2'])
  expect(new IMCB().gamma(1.0).parts()).toEqual(['-gamma', '1'])
})

test('grayscale method', () => {
  expect(new IMCB().grayscale('average').parts()).toEqual(['-grayscale', 'average'])
  expect(new IMCB().grayscale('rec709luma').parts()).toEqual(['-grayscale', 'rec709luma'])
  expect(new IMCB().grayscale('lightness').parts()).toEqual(['-grayscale', 'lightness'])
})

test('help method', () => {
  expect(new IMCB().help().parts()).toEqual(['-help'])
})

test('implode method', () => {
  expect(new IMCB().implode(0.5).parts()).toEqual(['-implode', '0.5'])
  expect(new IMCB().implode(-1).parts()).toEqual(['-implode', '-1'])
  expect(new IMCB().implode(2).parts()).toEqual(['-implode', '2'])
})

test('median method', () => {
  expect(new IMCB().median(2).parts()).toEqual(['-median', '2'])
  expect(new IMCB().median(0, 1).parts()).toEqual(['-median', '0x1'])
  expect(new IMCB().median(3).parts()).toEqual(['-median', '3'])
})

test('autoOrient method', () => {
  expect(new IMCB().autoOrient().parts()).toEqual(['-auto-orient'])
})

test('blackPointCompensation method', () => {
  expect(new IMCB().blackPointCompensation().parts()).toEqual(['-black-point-compensation'])
})

test('convolve method', () => {
  expect(new IMCB().convolve('1,2,1,2,4,2,1,2,1').parts()).toEqual(['-convolve', '1,2,1,2,4,2,1,2,1'])
  expect(new IMCB().convolve('0,-1,0,-1,5,-1,0,-1,0').parts()).toEqual(['-convolve', '0,-1,0,-1,5,-1,0,-1,0'])
  expect(new IMCB().convolve('1,1,1,1,1,1,1,1,1').parts()).toEqual(['-convolve', '1,1,1,1,1,1,1,1,1'])
})

test('debug method', () => {
  expect(new IMCB().debug('All').parts()).toEqual(['-debug', 'All'])
  expect(new IMCB().debug('Cache', 'Blob').parts()).toEqual(['-debug', 'Cache,Blob'])
  expect(new IMCB().debug('Cache', 'Blob', 'Resource').parts()).toEqual(['-debug', 'Cache,Blob,Resource'])
  expect(new IMCB().debug('None').parts()).toEqual(['-debug', 'None'])
  expect(new IMCB().debug().parts()).toEqual(['+debug'])
})

test('define method', () => {
  expect(new IMCB().define('jpeg:quality=90').parts()).toEqual(['-define', 'jpeg:quality=90'])
  expect(new IMCB().define('registry:temporary-path=/tmp').parts()).toEqual(['-define', 'registry:temporary-path=/tmp'])
  expect(new IMCB().define('ps:imagemask').parts()).toEqual(['-define', 'ps:imagemask'])
  expect(new IMCB().define('*', true).parts()).toEqual(['+define', '*'])
})

test('delay method', () => {
  expect(new IMCB().delay(30).parts()).toEqual(['-delay', '30'])
  expect(new IMCB().delay('30x100').parts()).toEqual(['-delay', '30x100'])
  expect(new IMCB().delay('50x200').parts()).toEqual(['-delay', '50x200'])
  expect(new IMCB().delay(10, '>').parts()).toEqual(['-delay', '10>'])
  expect(new IMCB().delay(5, '<').parts()).toEqual(['-delay', '5<'])
})

test('direction method', () => {
  expect(new IMCB().direction('right-to-left').parts()).toEqual(['-direction', 'right-to-left'])
  expect(new IMCB().direction('left-to-right').parts()).toEqual(['-direction', 'left-to-right'])
})

test('display method', () => {
  expect(new IMCB().display(':0.0').parts()).toEqual(['-display', ':0.0'])
  expect(new IMCB().display('localhost:10.0').parts()).toEqual(['-display', 'localhost:10.0'])
})

test('dispose method', () => {
  expect(new IMCB().dispose('Background').parts()).toEqual(['-dispose', 'Background'])
  expect(new IMCB().dispose('None').parts()).toEqual(['-dispose', 'None'])
  expect(new IMCB().dispose('Previous').parts()).toEqual(['-dispose', 'Previous'])
})

test('distort method', () => {
  expect(new IMCB().distort('Perspective', '0,0,0,0,0,90,0,90').parts()).toEqual(['-distort', 'Perspective', '0,0,0,0,0,90,0,90'])
  expect(new IMCB().distort('Arc', '60').parts()).toEqual(['-distort', 'Arc', '60'])
  expect(new IMCB().distort('Rotate', '30').parts()).toEqual(['-distort', 'Rotate', '30'])
})

test('dither method', () => {
  expect(new IMCB().dither('FloydSteinberg').parts()).toEqual(['-dither', 'FloydSteinberg'])
  expect(new IMCB().dither('Riemersma').parts()).toEqual(['-dither', 'Riemersma'])
  expect(new IMCB().dither().parts()).toEqual(['+dither'])
})

test('draw method', () => {
  expect(new IMCB().draw(d => d.circle(10, 10, 20, 20)).parts()).toEqual(['-draw', 'circle 10,10 20,20'])
  expect(new IMCB().draw(d => d.rectangle(0, 0, 100, 100)).parts()).toEqual(['-draw', 'rectangle 0,0 100,100'])
  expect(new IMCB().draw(d => d.text(0, 0, 'Hello World')).parts()).toEqual(['-draw', "text 0,0 'Hello World'"])
})

test('draw method - shape primitives', () => {
  expect(new IMCB().draw(d => d.point(10, 20)).parts()).toEqual(['-draw', 'point 10,20'])
  expect(new IMCB().draw(d => d.line(0, 0, 100, 100)).parts()).toEqual(['-draw', 'line 0,0 100,100'])
  expect(new IMCB().draw(d => d.rectangle(10, 10, 50, 50)).parts()).toEqual(['-draw', 'rectangle 10,10 50,50'])
  expect(new IMCB().draw(d => d.roundRectangle(10, 10, 50, 50, 5, 5)).parts()).toEqual(['-draw', 'roundRectangle 10,10 50,50 5,5'])
  expect(new IMCB().draw(d => d.arc(10, 10, 50, 50, 0, 90)).parts()).toEqual(['-draw', 'arc 10,10 50,50 0,90'])
  expect(new IMCB().draw(d => d.ellipse(25, 25, 20, 15, 0, 360)).parts()).toEqual(['-draw', 'ellipse 25,25 20,15 0,360'])
  expect(new IMCB().draw(d => d.circle(50, 50, 70, 50)).parts()).toEqual(['-draw', 'circle 50,50 70,50'])
})

test('draw method - polyline and polygon', () => {
  expect(new IMCB().draw(d => d.polyline([10, 10], [20, 20], [30, 10])).parts()).toEqual(['-draw', 'polyline 10,10 20,20 30,10'])
  expect(new IMCB().draw(d => d.polygon([10, 10], [20, 5], [30, 15], [15, 20])).parts()).toEqual(['-draw', 'polygon 10,10 20,5 30,15 15,20'])
  expect(new IMCB().draw(d => d.bezier([10, 10], [20, 5], [30, 15], [40, 10])).parts()).toEqual(['-draw', 'bezier 10,10 20,5 30,15 40,10'])
})

test('draw method - path and image', () => {
  expect(new IMCB().draw(d => d.path('M 10,10 L 20,20 Z')).parts()).toEqual(['-draw', "path 'M 10,10 L 20,20 Z'"])
  expect(new IMCB().draw(d => d.image('Over', 10, 10, 100, 100, 'test.png')).parts()).toEqual(['-draw', "image Over 10,10 100,100 'test.png'"])
})

test('draw method - text and gravity', () => {
  expect(new IMCB().draw(d => d.text(50, 50, 'Hello World')).parts()).toEqual(['-draw', "text 50,50 'Hello World'"])
  expect(new IMCB().draw(d => d.gravity('Center')).parts()).toEqual(['-draw', 'gravity Center'])
  expect(new IMCB().draw(d => d.gravity('NorthWest')).parts()).toEqual(['-draw', 'gravity NorthWest'])
  expect(new IMCB().draw(d => d.gravity('SouthEast')).parts()).toEqual(['-draw', 'gravity SouthEast'])
})

test('draw method - transformations', () => {
  expect(new IMCB().draw(d => d.rotate(45)).parts()).toEqual(['-draw', 'rotate 45'])
  expect(new IMCB().draw(d => d.translate(10, 20)).parts()).toEqual(['-draw', 'translate 10,20'])
  expect(new IMCB().draw(d => d.scale(2, 1.5)).parts()).toEqual(['-draw', 'scale 2,1.5'])
  expect(new IMCB().draw(d => d.skewX(15)).parts()).toEqual(['-draw', 'skewX 15'])
  expect(new IMCB().draw(d => d.skewY(10)).parts()).toEqual(['-draw', 'skewY 10'])
})

test('draw method - pixel operations', () => {
  expect(new IMCB().draw(d => d.color(10, 10, 'point')).parts()).toEqual(['-draw', 'color 10,10 point'])
  expect(new IMCB().draw(d => d.color(20, 20, 'replace')).parts()).toEqual(['-draw', 'color 20,20 replace'])
  expect(new IMCB().draw(d => d.matte(15, 15, 'floodfill')).parts()).toEqual(['-draw', 'matte 15,15 floodfill'])
})

test('draw method - multiple primitives', () => {
  expect(new IMCB().draw(d => d.circle(25, 25, 35, 25).text(10, 60, 'Hello')).parts()).toEqual(['-draw', "circle 25,25 35,25 text 10,60 'Hello'"])
  expect(new IMCB().draw(d => d.translate(50, 50).rotate(45).rectangle(0, 0, 20, 20)).parts()).toEqual(['-draw', 'translate 50,50 rotate 45 rectangle 0,0 20,20'])
  expect(new IMCB().draw(d => d.gravity('Center').text(0, 0, 'Centered').point(0, 0)).parts()).toEqual(['-draw', "gravity Center text 0,0 'Centered' point 0,0"])
})

test('draw method - complex example', () => {
  expect(new IMCB().draw(d => d
    .translate(100, 100)
    .rotate(45)
    .scale(2, 2)
    .rectangle(-10, -10, 10, 10)
    .gravity('NorthEast')
    .text(0, 0, 'Rotated!')
  ).parts()).toEqual(['-draw', "translate 100,100 rotate 45 scale 2,2 rectangle -10,-10 10,10 gravity NorthEast text 0,0 'Rotated!'"])
})

test('duplicate method', () => {
  expect(new IMCB().duplicate(2).parts()).toEqual(['-duplicate', '2'])
  expect(new IMCB().duplicate(5, 0, 1, 2).parts()).toEqual(['-duplicate', '5,0,1,2'])
  expect(new IMCB().duplicate(3, 1, 3, 5).parts()).toEqual(['-duplicate', '3,1,3,5'])
})

test('encoding method', () => {
  expect(new IMCB().encoding('UTF-8').parts()).toEqual(['-encoding', 'UTF-8'])
  expect(new IMCB().encoding('Latin1').parts()).toEqual(['-encoding', 'Latin1'])
})

test('endian method', () => {
  expect(new IMCB().endian('LSB').parts()).toEqual(['-endian', 'LSB'])
  expect(new IMCB().endian('MSB').parts()).toEqual(['-endian', 'MSB'])
})

test('evaluate method', () => {
  expect(new IMCB().evaluate('Add', 50).parts()).toEqual(['-evaluate', 'Add', '50'])
  expect(new IMCB().evaluate('Multiply', 1.5).parts()).toEqual(['-evaluate', 'Multiply', '1.5'])
  expect(new IMCB().evaluate('Set', 128).parts()).toEqual(['-evaluate', 'Set', '128'])
})

test('extract method', () => {
  expect(new IMCB().extract('100x100+50+25').parts()).toEqual(['-extract', '100x100+50+25'])
  expect(new IMCB().extract('200x150').parts()).toEqual(['-extract', '200x150'])
})

test('family method', () => {
  expect(new IMCB().family('Arial').parts()).toEqual(['-family', 'Arial'])
  expect(new IMCB().family('Times New Roman').parts()).toEqual(['-family', 'Times New Roman'])
})

test('format method', () => {
  expect(new IMCB().format('%wx%h').parts()).toEqual(['-format', '%wx%h'])
  expect(new IMCB().format('%f').parts()).toEqual(['-format', '%f'])
})

test('frame method', () => {
  expect(new IMCB().frame(10, 10).parts()).toEqual(['-frame', '10x10'])
  expect(new IMCB().frame(15, 20, 5).parts()).toEqual(['-frame', '15x20+5'])
  expect(new IMCB().frame(20, 25, 8, 3).parts()).toEqual(['-frame', '20x25+8+3'])
})

test('func method', () => {
  expect(new IMCB().func('Polynomial', '1,2,3').parts()).toEqual(['-function', 'Polynomial', '1,2,3'])
  expect(new IMCB().func('Sinusoid', '1,0,0.5').parts()).toEqual(['-function', 'Sinusoid', '1,0,0.5'])
})

test('fuzz method', () => {
  expect(new IMCB().fuzz('10%').parts()).toEqual(['-fuzz', '10%'])
  expect(new IMCB().fuzz('5').parts()).toEqual(['-fuzz', '5'])
})

test('fx method', () => {
  expect(new IMCB().fx('u*0.5').parts()).toEqual(['-fx', 'u*0.5'])
  expect(new IMCB().fx('(u+v)/2').parts()).toEqual(['-fx', '(u+v)/2'])
})

test('identify method', () => {
  expect(new IMCB().identify().parts()).toEqual(['-identify'])
})

test('insert method', () => {
  expect(new IMCB().insert(0).parts()).toEqual(['-insert', '0'])
  expect(new IMCB().insert(3).parts()).toEqual(['-insert', '3'])
})

test('intent method', () => {
  expect(new IMCB().intent('Perceptual').parts()).toEqual(['-intent', 'Perceptual'])
  expect(new IMCB().intent('Relative').parts()).toEqual(['-intent', 'Relative'])
})

test('interlace method', () => {
  expect(new IMCB().interlace('None').parts()).toEqual(['-interlace', 'None'])
  expect(new IMCB().interlace('Line').parts()).toEqual(['-interlace', 'Line'])
  expect(new IMCB().interlace('Plane').parts()).toEqual(['-interlace', 'Plane'])
})

test('kerning method', () => {
  expect(new IMCB().kerning(2).parts()).toEqual(['-kerning', '2'])
  expect(new IMCB().kerning(-1.5).parts()).toEqual(['-kerning', '-1.5'])
})

test('lat method', () => {
  expect(new IMCB().lat(10, 10, 5).parts()).toEqual(['-lat', '10x10+5'])
  expect(new IMCB().lat(20, 15, 8, 10).parts()).toEqual(['-lat', '20x15+8%+10%'])
})

test('layers method', () => {
  expect(new IMCB().layers('coalesce').parts()).toEqual(['-layers', 'coalesce'])
  expect(new IMCB().layers('optimize').parts()).toEqual(['-layers', 'optimize'])
})

test('level method', () => {
  expect(new IMCB().level(0, 100).parts()).toEqual(['-level', '0,100'])
  expect(new IMCB().level(10, 90, 1.2).parts()).toEqual(['-level', '10,90,1.2'])
})

test('limit method', () => {
  expect(new IMCB().limit('memory', '256MB').parts()).toEqual(['-limit', 'memory', '256MB'])
  expect(new IMCB().limit('disk', '1GB').parts()).toEqual(['-limit', 'disk', '1GB'])
  expect(new IMCB().limit('thread', '4').parts()).toEqual(['-limit', 'thread', '4'])
})

test('linearStretch method', () => {
  expect(new IMCB().linearStretch(1, 2).parts()).toEqual(['-linear-stretch', '1%x2%'])
  expect(new IMCB().linearStretch(5, 10).parts()).toEqual(['-linear-stretch', '5%x10%'])
})

test('liquidRescale method', () => {
  expect(new IMCB().liquidRescale(75).parts()).toEqual(['-liquid-rescale', '75'])
  expect(new IMCB().liquidRescale(100, 150).parts()).toEqual(['-liquid-rescale', '100x150'])
  expect(new IMCB().liquidRescale(200, 300, 5).parts()).toEqual(['-liquid-rescale', '200x300+5'])
  expect(new IMCB().liquidRescale(150, 200, 3, 1).parts()).toEqual(['-liquid-rescale', '150x200+3+1'])
})

test('loop method', () => {
  expect(new IMCB().loop(0).parts()).toEqual(['-loop', '0'])
  expect(new IMCB().loop(5).parts()).toEqual(['-loop', '5'])
  expect(new IMCB().loop(10).parts()).toEqual(['-loop', '10'])
})

test('matteColor method', () => {
  expect(new IMCB().mattecolor('blue').parts()).toEqual(['-mattecolor', 'blue'])
  expect(new IMCB().mattecolor('#FF0000').parts()).toEqual(['-mattecolor', '#FF0000'])
  expect(new IMCB().mattecolor('transparent').parts()).toEqual(['-mattecolor', 'transparent'])
})

test('modulate method', () => {
  expect(new IMCB().modulate().parts()).toEqual(['-modulate', '100'])
  expect(new IMCB().modulate(120).parts()).toEqual(['-modulate', '120'])
  expect(new IMCB().modulate(100, 150).parts()).toEqual(['-modulate', '100,150'])
  expect(new IMCB().modulate(100, 150, 80).parts()).toEqual(['-modulate', '100,150,80'])
})

test('monitor method', () => {
  expect(new IMCB().monitor().parts()).toEqual(['-monitor'])
  expect(new IMCB().monitor(true).parts()).toEqual(['-monitor'])
  expect(new IMCB().monitor(false).parts()).toEqual(['+monitor'])
})

test('morphology method', () => {
  expect(new IMCB().morphology('Erode', 'diamond:1').parts()).toEqual(['-morphology', 'Erode', 'diamond:1'])
  expect(new IMCB().morphology('Dilate', 'square:2').parts()).toEqual(['-morphology', 'Dilate', 'square:2'])
  expect(new IMCB().morphology('Open', 'disk:3', 2).parts()).toEqual(['-morphology', 'Open:2', 'disk:3'])
})

test('mosaic method', () => {
  expect(new IMCB().mosaic().parts()).toEqual(['-mosaic'])
})

test('motionBlur method', () => {
  expect(new IMCB().motionBlur(0, 20, 45).parts()).toEqual(['-motion-blur', '0x20+45'])
  expect(new IMCB().motionBlur(5, 10, 90).parts()).toEqual(['-motion-blur', '5x10+90'])
  expect(new IMCB().motionBlur(2, 5, 180).parts()).toEqual(['-motion-blur', '2x5+180'])
})

test('noise method', () => {
  expect(new IMCB().noise('Gaussian').parts()).toEqual(['-noise', 'Gaussian'])
  expect(new IMCB().noise('Poisson').parts()).toEqual(['-noise', 'Poisson'])
  expect(new IMCB().noise().parts()).toEqual(['+noise'])
})

test('orderedDither method', () => {
  expect(new IMCB().orderedDither('4x4').parts()).toEqual(['-ordered-dither', '4x4'])
  expect(new IMCB().orderedDither('o8x8').parts()).toEqual(['-ordered-dither', 'o8x8'])
  expect(new IMCB().orderedDither('h8x8a').parts()).toEqual(['-ordered-dither', 'h8x8a'])
})

test('orient method', () => {
  expect(new IMCB().orient('TopLeft').parts()).toEqual(['-orient', 'TopLeft'])
  expect(new IMCB().orient('RightTop').parts()).toEqual(['-orient', 'RightTop'])
  expect(new IMCB().orient('BottomRight').parts()).toEqual(['-orient', 'BottomRight'])
})

test('page method', () => {
  expect(new IMCB().page('A4').parts()).toEqual(['-page', 'A4'])
  expect(new IMCB().page('612x792+0+0').parts()).toEqual(['-page', '612x792+0+0'])
  expect(new IMCB().page().parts()).toEqual(['+page'])
})

test('paint method', () => {
  expect(new IMCB().paint(5).parts()).toEqual(['-paint', '5'])
  expect(new IMCB().paint(10).parts()).toEqual(['-paint', '10'])
  expect(new IMCB().paint(2).parts()).toEqual(['-paint', '2'])
})

test('polaroid method', () => {
  expect(new IMCB().polaroid(15).parts()).toEqual(['-polaroid', '15'])
  expect(new IMCB().polaroid(-10).parts()).toEqual(['-polaroid', '-10'])
  expect(new IMCB().polaroid(45).parts()).toEqual(['-polaroid', '45'])
})

test('posterize method', () => {
  expect(new IMCB().posterize(4).parts()).toEqual(['-posterize', '4'])
  expect(new IMCB().posterize(8).parts()).toEqual(['-posterize', '8'])
  expect(new IMCB().posterize(16).parts()).toEqual(['-posterize', '16'])
})

test('preview method', () => {
  expect(new IMCB().preview('Rotate').parts()).toEqual(['-preview', 'Rotate'])
  expect(new IMCB().preview('Blur').parts()).toEqual(['-preview', 'Blur'])
  expect(new IMCB().preview('Sharpen').parts()).toEqual(['-preview', 'Sharpen'])
})

test('print method', () => {
  expect(new IMCB().print('Image: %f\n').parts()).toEqual(['-print', 'Image: %f\n'])
  expect(new IMCB().print('%wx%h').parts()).toEqual(['-print', '%wx%h'])
  expect(new IMCB().print('%[fx:mean]').parts()).toEqual(['-print', '%[fx:mean]'])
})

test('profile method', () => {
  expect(new IMCB().profile('sRGB.icc').parts()).toEqual(['-profile', 'sRGB.icc'])
  expect(new IMCB().profile('AdobeRGB.icc').parts()).toEqual(['-profile', 'AdobeRGB.icc'])
  expect(new IMCB().profile().parts()).toEqual(['+profile'])
})

test('quantize method', () => {
  expect(new IMCB().quantize('YUV').parts()).toEqual(['-quantize', 'YUV'])
  expect(new IMCB().quantize('RGB').parts()).toEqual(['-quantize', 'RGB'])
  expect(new IMCB().quantize('Gray').parts()).toEqual(['-quantize', 'Gray'])
})

test('quiet method', () => {
  expect(new IMCB().quiet().parts()).toEqual(['-quiet'])
  expect(new IMCB().quiet(true).parts()).toEqual(['-quiet'])
  expect(new IMCB().quiet(false).parts()).toEqual(['+quiet'])
})

test('rotationalBlur method', () => {
  expect(new IMCB().rotationalBlur(10).parts()).toEqual(['-rotational-blur', '10'])
  expect(new IMCB().rotationalBlur(45).parts()).toEqual(['-rotational-blur', '45'])
  expect(new IMCB().rotationalBlur(5).parts()).toEqual(['-rotational-blur', '5'])
})

test('raise method', () => {
  expect(new IMCB().raise(10, 10).parts()).toEqual(['-raise', '10x10'])
  expect(new IMCB().raise(5, 5, true).parts()).toEqual(['+raise', '5x5'])
  expect(new IMCB().raise(8).parts()).toEqual(['-raise', '8'])
})

test('randomThreshold method', () => {
  expect(new IMCB().randomThreshold(20, 80).parts()).toEqual(['-random-threshold', '20%,80%'])
  expect(new IMCB().randomThreshold(10, 90).parts()).toEqual(['-random-threshold', '10%,90%'])
  expect(new IMCB().randomThreshold(0, 50).parts()).toEqual(['-random-threshold', '0%,50%'])
})

test('redPrimary method', () => {
  expect(new IMCB().redPrimary(0.64, 0.33).parts()).toEqual(['-red-primary', '0.64,0.33'])
  expect(new IMCB().redPrimary(0.7, 0.3).parts()).toEqual(['-red-primary', '0.7,0.3'])
})

test('regardWarnings method', () => {
  expect(new IMCB().regardWarnings().parts()).toEqual(['-regard-warnings'])
  expect(new IMCB().regardWarnings(true).parts()).toEqual(['-regard-warnings'])
  expect(new IMCB().regardWarnings(false).parts()).toEqual(['+regard-warnings'])
})

test('remap method', () => {
  expect(new IMCB().remap('palette.gif').parts()).toEqual(['-remap', 'palette.gif'])
  expect(new IMCB().remap('colors.png').parts()).toEqual(['-remap', 'colors.png'])
})

test('render method', () => {
  expect(new IMCB().render().parts()).toEqual(['-render'])
  expect(new IMCB().render(true).parts()).toEqual(['-render'])
  expect(new IMCB().render(false).parts()).toEqual(['+render'])
})

test('repage method', () => {
  expect(new IMCB().repage('100x100+0+0').parts()).toEqual(['-repage', '100x100+0+0'])
  expect(new IMCB().repage('200x150').parts()).toEqual(['-repage', '200x150'])
  expect(new IMCB().repage().parts()).toEqual(['+repage'])
})

test('resample method', () => {
  expect(new IMCB().resample('300x300').parts()).toEqual(['-resample', '300x300'])
  expect(new IMCB().resample('72').parts()).toEqual(['-resample', '72'])
  expect(new IMCB().resample('150x150').parts()).toEqual(['-resample', '150x150'])
})

test('roll method', () => {
  expect(new IMCB().roll(20, 10).parts()).toEqual(['-roll', '+20+10'])
  expect(new IMCB().roll(-50, -25).parts()).toEqual(['-roll', '-50-25'])
  expect(new IMCB().roll(30, -15).parts()).toEqual(['-roll', '+30-15'])
})

test('sample method', () => {
  expect(new IMCB().sample('50%').parts()).toEqual(['-sample', '50%'])
  expect(new IMCB().sample('200x100').parts()).toEqual(['-sample', '200x100'])
  expect(new IMCB().sample('300x200!').parts()).toEqual(['-sample', '300x200!'])
})

test('samplingFactor method', () => {
  expect(new IMCB().samplingFactor('4:2:0').parts()).toEqual(['-sampling-factor', '4:2:0'])
  expect(new IMCB().samplingFactor('4:4:4').parts()).toEqual(['-sampling-factor', '4:4:4'])
  expect(new IMCB().samplingFactor('2x2').parts()).toEqual(['-sampling-factor', '2x2'])
})

test('scale method', () => {
  expect(new IMCB().scale('50%').parts()).toEqual(['-scale', '50%'])
  expect(new IMCB().scale('200x100').parts()).toEqual(['-scale', '200x100'])
  expect(new IMCB().scale('300x200!').parts()).toEqual(['-scale', '300x200!'])
})

test('scene method', () => {
  expect(new IMCB().scene(5).parts()).toEqual(['-scene', '5'])
  expect(new IMCB().scene(0).parts()).toEqual(['-scene', '0'])
  expect(new IMCB().scene(100).parts()).toEqual(['-scene', '100'])
})

test('seed method', () => {
  expect(new IMCB().seed(123).parts()).toEqual(['-seed', '123'])
  expect(new IMCB().seed(456).parts()).toEqual(['-seed', '456'])
  expect(new IMCB().seed(0).parts()).toEqual(['-seed', '0'])
})

test('segment method', () => {
  expect(new IMCB().segment(1, 1.5).parts()).toEqual(['-segment', '1x1.5'])
  expect(new IMCB().segment(2, 2.0).parts()).toEqual(['-segment', '2x2'])
  expect(new IMCB().segment(0.5, 0.8).parts()).toEqual(['-segment', '0.5x0.8'])
})

test('selectiveBlur method', () => {
  expect(new IMCB().selectiveBlur(0, 1, '10%').parts()).toEqual(['-selective-blur', '0x1+10%'])
  expect(new IMCB().selectiveBlur(2, 3, '5%').parts()).toEqual(['-selective-blur', '2x3+5%'])
  expect(new IMCB().selectiveBlur(5, 2, '15%').parts()).toEqual(['-selective-blur', '5x2+15%'])
})

test('separate method', () => {
  expect(new IMCB().separate().parts()).toEqual(['-separate'])
})

test('sepiaTone method', () => {
  expect(new IMCB().sepiaTone('80%').parts()).toEqual(['-sepia-tone', '80%'])
  expect(new IMCB().sepiaTone('50%').parts()).toEqual(['-sepia-tone', '50%'])
  expect(new IMCB().sepiaTone('90%').parts()).toEqual(['-sepia-tone', '90%'])
})

test('set method', () => {
  expect(new IMCB().set('comment', 'My photo').parts()).toEqual(['-set', 'comment', 'My photo'])
  expect(new IMCB().set('label', 'Test Image').parts()).toEqual(['-set', 'label', 'Test Image'])
  expect(new IMCB().set('comment').parts()).toEqual(['+set', 'comment'])
})

test('shade method', () => {
  expect(new IMCB().shade(30, 30).parts()).toEqual(['-shade', '30x30'])
  expect(new IMCB().shade(45, 45, true).parts()).toEqual(['+shade', '45x45'])
  expect(new IMCB().shade(60, 20).parts()).toEqual(['-shade', '60x20'])
})

test('shadow method', () => {
  expect(new IMCB().shadow(0, 5, 3, 3).parts()).toEqual(['-shadow', '0x5+3+3'])
  expect(new IMCB().shadow(2, 4, 5, 5).parts()).toEqual(['-shadow', '2x4+5+5'])
  expect(new IMCB().shadow(1, 3, 2, 2).parts()).toEqual(['-shadow', '1x3+2+2'])
})

test('shave method', () => {
  expect(new IMCB().shave(10, 10).parts()).toEqual(['-shave', '10x10'])
  expect(new IMCB().shave(5, 8).parts()).toEqual(['-shave', '5x8'])
  expect(new IMCB().shave(20, 15).parts()).toEqual(['-shave', '20x15'])
})

test('shear method', () => {
  expect(new IMCB().shear(30, 0).parts()).toEqual(['-shear', '30x0'])
  expect(new IMCB().shear(0, 30).parts()).toEqual(['-shear', '0x30'])
  expect(new IMCB().shear(15, 10).parts()).toEqual(['-shear', '15x10'])
})

test('sigmoidalContrast method', () => {
  expect(new IMCB().sigmoidalContrast(3, 50).parts()).toEqual(['-sigmoidal-contrast', '3x50%'])
  expect(new IMCB().sigmoidalContrast(3, 50, true).parts()).toEqual(['+sigmoidal-contrast', '3x50%'])
  expect(new IMCB().sigmoidalContrast(5, 25).parts()).toEqual(['-sigmoidal-contrast', '5x25%'])
})

test('sketch method', () => {
  expect(new IMCB().sketch(0, 20, 120).parts()).toEqual(['-sketch', '0x20+120'])
  expect(new IMCB().sketch(2, 10, 90).parts()).toEqual(['-sketch', '2x10+90'])
  expect(new IMCB().sketch(5, 15, 45).parts()).toEqual(['-sketch', '5x15+45'])
})

test('smush method', () => {
  expect(new IMCB().smush(10).parts()).toEqual(['+smush', '10'])
  expect(new IMCB().smush(-5).parts()).toEqual(['+smush', '-5'])
  expect(new IMCB().smush(15, true).parts()).toEqual(['-smush', '15'])
})

test('solarize method', () => {
  expect(new IMCB().solarize('50%').parts()).toEqual(['-solarize', '50%'])
  expect(new IMCB().solarize('128').parts()).toEqual(['-solarize', '128'])
  expect(new IMCB().solarize('75%').parts()).toEqual(['-solarize', '75%'])
})

test('splice method', () => {
  expect(new IMCB().splice(10, 10, 100, 100).parts()).toEqual(['-splice', '10x10+100+100'])
  expect(new IMCB().splice(20, 15, 50, 75).parts()).toEqual(['-splice', '20x15+50+75'])
  expect(new IMCB().splice(5, 8, 25, 30).parts()).toEqual(['-splice', '5x8+25+30'])
})

test('spread method', () => {
  expect(new IMCB().spread(3).parts()).toEqual(['-spread', '3'])
  expect(new IMCB().spread(5).parts()).toEqual(['-spread', '5'])
  expect(new IMCB().spread(1).parts()).toEqual(['-spread', '1'])
})

test('statistic method', () => {
  expect(new IMCB().statistic('Median', 2, 2).parts()).toEqual(['-statistic', 'Median', '2x2'])
  expect(new IMCB().statistic('Mean', 3, 3).parts()).toEqual(['-statistic', 'Mean', '3x3'])
  expect(new IMCB().statistic('Maximum', 1, 1).parts()).toEqual(['-statistic', 'Maximum', '1x1'])
})

test('stretch method', () => {
  expect(new IMCB().stretch('Normal').parts()).toEqual(['-stretch', 'Normal'])
  expect(new IMCB().stretch('Condensed').parts()).toEqual(['-stretch', 'Condensed'])
  expect(new IMCB().stretch('Expanded').parts()).toEqual(['-stretch', 'Expanded'])
})

test('stroke method', () => {
  expect(new IMCB().stroke('black').parts()).toEqual(['-stroke', 'black'])
  expect(new IMCB().stroke('#FF0000').parts()).toEqual(['-stroke', '#FF0000'])
  expect(new IMCB().stroke('blue').parts()).toEqual(['-stroke', 'blue'])
})

test('strokeWidth method', () => {
  expect(new IMCB().strokewidth(2).parts()).toEqual(['-strokewidth', '2'])
  expect(new IMCB().strokewidth(1).parts()).toEqual(['-strokewidth', '1'])
  expect(new IMCB().strokewidth(5).parts()).toEqual(['-strokewidth', '5'])
})

test('style method', () => {
  expect(new IMCB().style('Italic').parts()).toEqual(['-style', 'Italic'])
  expect(new IMCB().style('Normal').parts()).toEqual(['-style', 'Normal'])
  expect(new IMCB().style('Oblique').parts()).toEqual(['-style', 'Oblique'])
})

test('virtualPixel method', () => {
  expect(new IMCB().virtualPixel('Edge').parts()).toEqual(['-virtual-pixel', 'Edge'])
  expect(new IMCB().virtualPixel('Mirror').parts()).toEqual(['-virtual-pixel', 'Mirror'])
  expect(new IMCB().virtualPixel('Transparent').parts()).toEqual(['-virtual-pixel', 'Transparent'])
})

test('swirl method', () => {
  expect(new IMCB().swirl(90).parts()).toEqual(['-swirl', '90'])
  expect(new IMCB().swirl(-45).parts()).toEqual(['-swirl', '-45'])
  expect(new IMCB().swirl(180).parts()).toEqual(['-swirl', '180'])
})

test('texture method', () => {
  expect(new IMCB().texture('pattern.jpg').parts()).toEqual(['-texture', 'pattern.jpg'])
  expect(new IMCB().texture('tile.png').parts()).toEqual(['-texture', 'tile.png'])
})

test('threshold method', () => {
  expect(new IMCB().threshold(50).parts()).toEqual(['-threshold', '50%'])
  expect(new IMCB().threshold().parts()).toEqual(['+threshold'])
  expect(new IMCB().threshold(75).parts()).toEqual(['-threshold', '75%'])
})

test('thumbnail method', () => {
  expect(new IMCB().thumbnail(150, 150).parts()).toEqual(['-thumbnail', '150x150'])
  expect(new IMCB().thumbnail(100).parts()).toEqual(['-thumbnail', '100'])
  expect(new IMCB().thumbnail(undefined, 200).parts()).toEqual(['-thumbnail', 'x200'])
})

test('thumbnailExt method', () => {
  expect(new IMCB().thumbnailExt(g => g.scale(50)).parts()).toEqual(['-thumbnail', '50%'])
  expect(new IMCB().thumbnailExt(g => g.size(100, 100).flag('!')).parts()).toEqual(['-thumbnail', '100x100!'])
})

test('tile method', () => {
  expect(new IMCB().tile('pattern.png').parts()).toEqual(['-tile', 'pattern.png'])
  expect(new IMCB().tile('texture.jpg').parts()).toEqual(['-tile', 'texture.jpg'])
})

test('tint method', () => {
  expect(new IMCB().tint(50).parts()).toEqual(['-tint', '50%'])
  expect(new IMCB().tint(25).parts()).toEqual(['-tint', '25%'])
  expect(new IMCB().tint(100).parts()).toEqual(['-tint', '100%'])
})

test('transform method', () => {
  expect(new IMCB().transform().parts()).toEqual(['-transform'])
})

test('transparent method', () => {
  expect(new IMCB().transparent('white').parts()).toEqual(['-transparent', 'white'])
  expect(new IMCB().transparent('#FF0000').parts()).toEqual(['-transparent', '#FF0000'])
})

test('transpose method', () => {
  expect(new IMCB().transpose().parts()).toEqual(['-transpose'])
})

test('transverse method', () => {
  expect(new IMCB().transverse().parts()).toEqual(['-transverse'])
})

test('treedepth method', () => {
  expect(new IMCB().treedepth(8).parts()).toEqual(['-treedepth', '8'])
  expect(new IMCB().treedepth(16).parts()).toEqual(['-treedepth', '16'])
})

test('type method', () => {
  expect(new IMCB().type('grayscale').parts()).toEqual(['-type', 'grayscale'])
  expect(new IMCB().type('palette').parts()).toEqual(['-type', 'palette'])
})

test('undercolor method', () => {
  expect(new IMCB().undercolor('blue').parts()).toEqual(['-undercolor', 'blue'])
  expect(new IMCB().undercolor('#00FF00').parts()).toEqual(['-undercolor', '#00FF00'])
})

test('uniqueColors method', () => {
  expect(new IMCB().uniqueColors().parts()).toEqual(['-unique-colors'])
})

test('units method', () => {
  expect(new IMCB().units('pixelsperinch').parts()).toEqual(['-units', 'pixelsperinch'])
  expect(new IMCB().units('pixelspercentimeter').parts()).toEqual(['-units', 'pixelspercentimeter'])
})

test('unsharp method', () => {
  expect(new IMCB().unsharp(0, 0.5, 0.5, 0.1).parts()).toEqual(['-unsharp', '0x0.5+0.5x0.1'])
  expect(new IMCB().unsharp(2, 1, 1, 0.05).parts()).toEqual(['-unsharp', '2x1+1x0.05'])
})

test('verbose method', () => {
  expect(new IMCB().verbose().parts()).toEqual(['-verbose'])
  expect(new IMCB().verbose(true).parts()).toEqual(['-verbose'])
  expect(new IMCB().verbose(false).parts()).toEqual(['+verbose'])
})

test('version method', () => {
  expect(new IMCB().version().parts()).toEqual(['-version'])
})

test('vignette method', () => {
  expect(new IMCB().vignette(0, 150).parts()).toEqual(['-vignette', '0x150'])
  expect(new IMCB().vignette(2, 100, 5, 5).parts()).toEqual(['-vignette', '2x100+5+5'])
})

test('wave method', () => {
  expect(new IMCB().wave(25, 150).parts()).toEqual(['-wave', '25x150'])
  expect(new IMCB().wave(10, 100).parts()).toEqual(['-wave', '10x100'])
})

test('weight method', () => {
  expect(new IMCB().weight('bold').parts()).toEqual(['-weight', 'bold'])
  expect(new IMCB().weight('400').parts()).toEqual(['-weight', '400'])
})

test('whitePoint method', () => {
  expect(new IMCB().whitePoint(0.3127, 0.329).parts()).toEqual(['-white-point', '0.3127,0.329'])
  expect(new IMCB().whitePoint(0.31, 0.33).parts()).toEqual(['-white-point', '0.31,0.33'])
})

test('whiteThreshold method', () => {
  expect(new IMCB().whiteThreshold('80%').parts()).toEqual(['-white-threshold', '80%'])
  expect(new IMCB().whiteThreshold('200').parts()).toEqual(['-white-threshold', '200'])
})

test('write method', () => {
  expect(new IMCB().write('output.png').parts()).toEqual(['-write', 'output.png'])
  expect(new IMCB().write('temp.jpg').parts()).toEqual(['-write', 'temp.jpg'])
})

test('swap method', () => {
  expect(new IMCB().swap(0, 1).parts()).toEqual(['-swap', '0,1'])
  expect(new IMCB().swap(2, 3).parts()).toEqual(['-swap', '2,3'])
  expect(new IMCB().swap(1, 4).parts()).toEqual(['-swap', '1,4'])
})

test('xc method variations', () => {
  expect(new IMCB().xc().parts()).toEqual(['xc:'])
  expect(new IMCB().xc('red').parts()).toEqual(['xc:red'])
  expect(new IMCB().xc('red', 200).parts()).toEqual(['xc:red[200]'])
  expect(new IMCB().xc('red', 200, 100).parts()).toEqual(['xc:red[200x100!]'])
  expect(new IMCB().xc(150).parts()).toEqual(['xc:[150]'])
  expect(new IMCB().xc(300, 200).parts()).toEqual(['xc:[300x200!]'])
  expect(new IMCB().xc('#FF0000').parts()).toEqual(['xc:#FF0000'])
  expect(new IMCB().xc('#FF0000', 100).parts()).toEqual(['xc:#FF0000[100]'])
  expect(new IMCB().xc('#FF0000', 100, 200).parts()).toEqual(['xc:#FF0000[100x200!]'])
  expect(new IMCB().xc('blue').parts()).toEqual(['xc:blue'])
  expect(new IMCB().xc('none').parts()).toEqual(['xc:none'])
  expect(new IMCB().xc('white', 50).parts()).toEqual(['xc:white[50]'])
})

test('canvas method (alias for xc)', () => {
  // canvas is exactly like xc but output canvas: prefix
  expect(new IMCB().canvas().parts()).toEqual(['canvas:'])
  expect(new IMCB().canvas('red').parts()).toEqual(['canvas:red'])
  expect(new IMCB().canvas('red', 200).parts()).toEqual(['canvas:red[200]'])
  expect(new IMCB().canvas('red', 200, 100).parts()).toEqual(['canvas:red[200x100!]'])
  expect(new IMCB().canvas(150).parts()).toEqual(['canvas:[150]'])
  expect(new IMCB().canvas(300, 200).parts()).toEqual(['canvas:[300x200!]'])
})

test('resource method with string', () => {
  const im = new IMCB()

  im.resource('image.png')

  expect(im.parts()).toEqual(['image.png'])
})

test('resource method with buffer creates fd reference', () => {
  const im = new IMCB()
  const buffer = Buffer.from('test image data')

  im.resource(buffer)

  expect(im.parts()).toEqual(['fd:3'])
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

  expect(im.parts()).toEqual(['fd:3', 'fd:4', 'fd:5'])
  expect(im.fds()).toEqual([buffer1, buffer2, buffer3])
})

test('mixed string and buffer resources', () => {
  const im = new IMCB()
  const buffer = Buffer.from('test')

  im.resource('file1.png')
  im.resource(buffer)
  im.resource('file2.png')

  expect(im.parts()).toEqual(['file1.png', 'fd:3', 'file2.png'])
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
  expect(fds1).not.toBe(fds2) // Should be different array instances
})

test('complex command with buffers', () => {
  const im = new IMCB()
  const backgroundBuffer = Buffer.from('background')
  const overlayBuffer = Buffer.from('overlay')

  im.resource(backgroundBuffer)
    .resource(overlayBuffer)
    .composite()
    .resource('output.png')

  expect(im.parts()).toEqual(['fd:3', 'fd:4', '-composite', 'output.png'])
  expect(im.fds()).toEqual([backgroundBuffer, overlayBuffer])
})
