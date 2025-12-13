/**
 * Skia Renderer V2
 * 
 * Renders serializable node trees (from worker) to canvas using Skia CanvasKit.
 * This renderer works with the JSON format, not the heavy RenderNode class.
 */

import type { SerializableNode } from '../runtime/worker-bridge'
import { getCanvasKit, getSurface, getCanvas } from './skia-renderer'

/**
 * Render a serializable tree to the canvas
 */
export function renderSerializableTree(tree: SerializableNode, clearColor: string = '#0a0a0f') {
    const canvas = getCanvas()
    const CanvasKit = getCanvasKit()

    if (!canvas || !CanvasKit) {
        throw new Error('Skia not initialized')
    }

    // Clear canvas
    const paint = new CanvasKit.Paint()
    paint.setColor(CanvasKit.parseColorString(clearColor))
    paint.setStyle(CanvasKit.PaintStyle.Fill)
    canvas.drawPaint(paint)
    paint.delete()

    // Render tree
    renderNode(tree, 0, 0, CanvasKit, canvas)

    // Flush to screen
    getSurface()?.flush()
}

/**
 * Recursively render a node and its children
 */
function renderNode(
    node: SerializableNode,
    offsetX: number,
    offsetY: number,
    CanvasKit: any,
    canvas: any
) {
    const x = offsetX + node.layout.left
    const y = offsetY + node.layout.top
    const width = node.layout.width
    const height = node.layout.height

    // Render based on type
    if (node.type === 'view') {
        drawView(x, y, width, height, node.style || {}, CanvasKit, canvas)
    } else if (node.type === 'text' && node.text) {
        // Draw text background if backgroundColor is set
        if (node.style?.backgroundColor) {
            drawView(x, y, width, height, node.style, CanvasKit, canvas)
        }
        drawText(node.text, x, y, width, node.textStyle || {}, CanvasKit, canvas)
    }

    // Render children
    node.children.forEach(child => {
        renderNode(child, x, y, CanvasKit, canvas)
    })
}

/**
 * Draw a view (rectangle) with styling
 */
function drawView(
    x: number,
    y: number,
    width: number,
    height: number,
    style: SerializableNode['style'],
    CanvasKit: any,
    canvas: any
) {
    if (!style) return

    const paint = new CanvasKit.Paint()
    paint.setAntiAlias(true)

    // Background color
    if (style.backgroundColor) {
        paint.setColor(CanvasKit.parseColorString(style.backgroundColor))
        paint.setStyle(CanvasKit.PaintStyle.Fill)

        if (style.borderRadius) {
            const rect = CanvasKit.RRectXY(
                CanvasKit.LTRBRect(x, y, x + width, y + height),
                style.borderRadius,
                style.borderRadius
            )
            canvas.drawRRect(rect, paint)
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
            const rect = CanvasKit.RRectXY(
                CanvasKit.LTRBRect(x, y, x + width, y + height),
                style.borderRadius,
                style.borderRadius
            )
            canvas.drawRRect(rect, paint)
        } else {
            canvas.drawRect(CanvasKit.LTRBRect(x, y, x + width, y + height), paint)
        }
    }

    // Shadow
    if (style.shadowColor && style.shadowOpacity) {
        // Simplified shadow implementation
        const shadowPaint = new CanvasKit.Paint()
        shadowPaint.setColor(CanvasKit.parseColorString(style.shadowColor))
        shadowPaint.setAlphaf(style.shadowOpacity)
        shadowPaint.setStyle(CanvasKit.PaintStyle.Fill)
        shadowPaint.setMaskFilter(
            CanvasKit.MaskFilter.MakeBlur(CanvasKit.BlurStyle.Normal, style.shadowRadius || 4, true)
        )

        const shadowX = x + (style.shadowOffset?.width || 0)
        const shadowY = y + (style.shadowOffset?.height || 0)

        if (style.borderRadius) {
            const rect = CanvasKit.RRectXY(
                CanvasKit.LTRBRect(shadowX, shadowY, shadowX + width, shadowY + height),
                style.borderRadius,
                style.borderRadius
            )
            canvas.drawRRect(rect, shadowPaint)
        } else {
            canvas.drawRect(
                CanvasKit.LTRBRect(shadowX, shadowY, shadowX + width, shadowY + height),
                shadowPaint
            )
        }

        shadowPaint.delete()
    }

    paint.delete()
}

/**
 * Draw text
 */
function drawText(
    text: string,
    x: number,
    y: number,
    width: number,
    textStyle: NonNullable<SerializableNode['textStyle']>,
    CanvasKit: any,
    canvas: any
) {
    const paint = new CanvasKit.Paint()
    paint.setAntiAlias(true)
    paint.setColor(CanvasKit.parseColorString(textStyle.color || '#ffffff'))

    const fontMgr = CanvasKit.FontMgr.RefDefault()
    const fontSize = textStyle.fontSize || 16
    const fontStyle = CanvasKit.FontStyle.Normal
    const typeface = fontMgr.matchFamilyStyle('Inter, Arial, sans-serif', fontStyle)
    const font = new CanvasKit.Font(typeface, fontSize)

    // Measure text
    const textBlob = CanvasKit.TextBlob.MakeFromText(text, font)

    // Calculate position based on alignment
    let textX = x
    if (textStyle.textAlign === 'center') {
        const blob = CanvasKit.TextBlob.MakeFromText(text, font)
        const bounds = blob.getBounds()
        textX = x + (width - bounds[2]) / 2
    } else if (textStyle.textAlign === 'right') {
        const blob = CanvasKit.TextBlob.MakeFromText(text, font)
        const bounds = blob.getBounds()
        textX = x + width - bounds[2]
    }

    canvas.drawTextBlob(textBlob, textX, y + fontSize, paint)

    paint.delete()
    font.delete()
    typeface.delete()
    fontMgr.delete()
}
