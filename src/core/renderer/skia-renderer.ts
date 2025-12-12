/**
 * Skia Renderer
 * 
 * Initializes CanvasKit (Skia WASM) and provides rendering functions
 * for drawing React Native components to canvas using pixel-perfect rendering.
 */

import type { Canvas, Surface, CanvasKit as CanvasKitType } from 'canvaskit-wasm'

let CanvasKit: CanvasKitType | null = null
let surface: Surface | null = null
let canvas: Canvas | null = null

export async function initSkia(canvasElement: HTMLCanvasElement) {
    if (CanvasKit && surface && canvas) {
        return { CanvasKit, surface, canvas }
    }

    try {
        // Load CanvasKit WASM
        const CanvasKitInit = (await import('canvaskit-wasm')).default
        CanvasKit = await CanvasKitInit({
            locateFile: (file: string) => {
                return `/node_modules/canvaskit-wasm/bin/${file}`
            }
        })

        // Create surface from canvas
        surface = CanvasKit.MakeWebGLCanvasSurface(canvasElement)
        if (!surface) {
            throw new Error('Failed to create WebGL surface')
        }

        canvas = surface.getCanvas()
        console.log('✓ Skia CanvasKit initialized')

        return { CanvasKit, surface, canvas }
    } catch (error) {
        console.error('Failed to initialize Skia:', error)
        throw error
    }
}

export function getSkia() {
    if (!CanvasKit || !surface || !canvas) {
        throw new Error('Skia not initialized. Call initSkia() first.')
    }
    return { CanvasKit, surface, canvas }
}

export interface ViewStyle {
    backgroundColor?: string
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    shadowColor?: string
    shadowOffset?: { width: number; height: number }
    shadowOpacity?: number
    shadowRadius?: number
    opacity?: number
}

export interface TextStyle {
    color?: string
    fontSize?: number
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
    fontFamily?: string
    textAlign?: 'left' | 'center' | 'right'
    lineHeight?: number
}

export function drawView(
    x: number,
    y: number,
    width: number,
    height: number,
    style: ViewStyle = {}
) {
    const { CanvasKit, canvas } = getSkia()
    if (!canvas) return

    const paint = new CanvasKit.Paint()

    // Shadow
    if (style.shadowColor && style.shadowOpacity && style.shadowRadius) {
        const shadowPaint = new CanvasKit.Paint()
        shadowPaint.setColor(CanvasKit.parseColorString(style.shadowColor))
        shadowPaint.setAlphaf(style.shadowOpacity)

        const shadowOffsetX = style.shadowOffset?.width || 0
        const shadowOffsetY = style.shadowOffset?.height || 0

        const shadowFilter = CanvasKit.ImageFilter.MakeDropShadow(
            shadowOffsetX,
            shadowOffsetY,
            style.shadowRadius,
            style.shadowRadius,
            CanvasKit.parseColorString(style.shadowColor),
            null
        )
        shadowPaint.setImageFilter(shadowFilter)

        if (style.borderRadius) {
            const rect = CanvasKit.LTRBRect(x, y, x + width, y + height)
            const rrect = CanvasKit.RRectXY(rect, style.borderRadius, style.borderRadius)
            canvas.drawRRect(rrect, shadowPaint)
        } else {
            canvas.drawRect(CanvasKit.LTRBRect(x, y, x + width, y + height), shadowPaint)
        }

        shadowPaint.delete()
    }

    // Background
    if (style.backgroundColor) {
        paint.setColor(CanvasKit.parseColorString(style.backgroundColor))
        paint.setStyle(CanvasKit.PaintStyle.Fill)

        if (style.opacity !== undefined) {
            paint.setAlphaf(style.opacity)
        }

        if (style.borderRadius) {
            const rect = CanvasKit.LTRBRect(x, y, x + width, y + height)
            const rrect = CanvasKit.RRectXY(rect, style.borderRadius, style.borderRadius)
            canvas.drawRRect(rrect, paint)
        } else {
            canvas.drawRect(CanvasKit.LTRBRect(x, y, x + width, y + height), paint)
        }
    }

    // Border
    if (style.borderWidth && style.borderColor) {
        paint.setColor(CanvasKit.parseColorString(style.borderColor))
        paint.setStyle(CanvasKit.PaintStyle.Stroke)
        paint.setStrokeWidth(style.borderWidth)

        if (style.borderRadius) {
            const rect = CanvasKit.LTRBRect(x, y, x + width, y + height)
            const rrect = CanvasKit.RRectXY(rect, style.borderRadius, style.borderRadius)
            canvas.drawRRect(rrect, paint)
        } else {
            canvas.drawRect(CanvasKit.LTRBRect(x, y, x + width, y + height), paint)
        }
    }

    paint.delete()
}

export function drawText(
    text: string,
    x: number,
    y: number,
    width: number,
    style: TextStyle = {}
) {
    const { CanvasKit, canvas } = getSkia()
    if (!canvas) return

    const paint = new CanvasKit.Paint()
    paint.setColor(CanvasKit.parseColorString(style.color || '#000000'))
    paint.setAntiAlias(true)

    const fontSize = style.fontSize || 16

    // Create a simple font (using null typeface will use default system font)
    const font = new CanvasKit.Font(null, fontSize)
    font.setSubpixel(true)

    // Text alignment
    let textX = x
    const textAlign = style.textAlign || 'left'

    if (textAlign === 'center') {
        // Approximate text width for centering (CanvasKit measureText API varies)
        const approxWidth = text.length * fontSize * 0.6
        textX = x + (width - approxWidth) / 2
    } else if (textAlign === 'right') {
        const approxWidth = text.length * fontSize * 0.6
        textX = x + width - approxWidth
    }

    // Draw text
    canvas.drawText(text, textX, y + fontSize, paint, font)

    paint.delete()
    font.delete()
}

export function clearCanvas(color: string = '#000000') {
    const { CanvasKit, canvas } = getSkia()
    if (!canvas) return

    canvas.clear(CanvasKit.parseColorString(color))
}

export function flush() {
    const { surface } = getSkia()
    if (!surface) return

    surface.flush()
}
