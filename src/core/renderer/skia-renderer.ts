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

/**
 * Load CanvasKit from CDN using script injection
 * This is the recommended way to load canvaskit-wasm in the browser
 */
async function loadCanvasKitFromCDN(): Promise<any> {
    return new Promise((resolve, reject) => {
        // Check if already loaded globally
        if ((window as any).CanvasKitInit) {
            resolve((window as any).CanvasKitInit)
            return
        }

        // Create script tag to load from CDN
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/canvaskit-wasm@0.39.1/bin/canvaskit.js'
        script.async = true

        script.onload = () => {
            console.log('[Skia] Script loaded, CanvasKitInit available:', !!(window as any).CanvasKitInit)
            if ((window as any).CanvasKitInit) {
                resolve((window as any).CanvasKitInit)
            } else {
                reject(new Error('CanvasKitInit not found on window after script load'))
            }
        }

        script.onerror = () => {
            reject(new Error('Failed to load CanvasKit script from CDN'))
        }

        document.head.appendChild(script)
    })
}

export async function initSkia(canvasElement: HTMLCanvasElement) {
    if (CanvasKit && surface && canvas) {
        return { CanvasKit, surface, canvas }
    }

    try {
        console.log('[Skia] Initializing CanvasKit from CDN...')

        // Load CanvasKit script from CDN
        const CanvasKitInit = await loadCanvasKitFromCDN()
        console.log('[Skia] CanvasKitInit loaded, type:', typeof CanvasKitInit)

        // Initialize CanvasKit
        CanvasKit = await CanvasKitInit({
            locateFile: (file: string) => {
                return `https://unpkg.com/canvaskit-wasm@0.39.1/bin/${file}`
            }
        })

        console.log('[Skia] CanvasKit initialized')

        // Create surface from canvas
        surface = CanvasKit.MakeWebGLCanvasSurface(canvasElement)
        if (!surface) {
            throw new Error('Failed to create WebGL surface')
        }

        canvas = surface.getCanvas()

        // Scale canvas to account for devicePixelRatio
        const scale = window.devicePixelRatio || 1
        if (scale !== 1) {
            console.log(`[Skia] Applying devicePixelRatio scale: ${scale}`)
            canvas.scale(scale, scale)
        }

        console.log('✓ Skia CanvasKit ready')

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

export function getCanvasKit() {
    return CanvasKit
}

export function getSurface() {
    return surface
}

export function getCanvas() {
    return canvas
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
