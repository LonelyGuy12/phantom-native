/**
 * Skia Renderer V2
 * 
 * Renders serializable node trees (from worker) to canvas using Skia CanvasKit.
 * This renderer works with the JSON format, not the heavy RenderNode class.
 */

import type { SerializableNode, SerializableRenderTree } from '../runtime/worker-bridge'
import { getSkia } from './skia-renderer'

/**
 * Render a serializable tree to canvas
 */
export function renderSerializableTree(tree: SerializableRenderTree) {
    const { CanvasKit, surface, canvas } = getSkia()

    if (!CanvasKit || !surface || !canvas) {
        console.error('[Renderer] Canvas not initialized')
        return
    }

    console.log('[Renderer] Rendering tree:', tree)

    // Clear canvas
    canvas.clear(CanvasKit.BLACK)

    try {
        // Render root node
        renderNode(tree.root, CanvasKit, canvas)

        // Flush to screen
        surface.flush()

        console.log('[Renderer] ✓ Render complete')
    } catch (error) {
        console.error('[Renderer] Render error:', error)
    }
}

/**
 * Recursively render a node and its children
 */
function renderNode(node: SerializableNode, CanvasKit: any, canvas: any) {
    if (!node || !node.layout) {
        console.warn('[Renderer] Node missing layout:', node)
        return
    }

    const { left, top, width, height } = node.layout

    console.log(`[Renderer] Drawing ${node.type} at (${left}, ${top}) size (${width}x${height})`)

    // Draw based on type
    if (node.type === 'view') {
        drawView(left, top, width, height, node.style, CanvasKit, canvas)
    } else if (node.type === 'text' && node.text) {
        const textStyle = node.textStyle || {}
        drawText(node.text, left, top, width, textStyle, CanvasKit, canvas)
    }

    // Render children
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            renderNode(child, CanvasKit, canvas)
        })
    }
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

    const fontSize = textStyle.fontSize || 16

    // Create font with null typeface (uses default system font)
    const font = new CanvasKit.Font(null, fontSize)

    // Calculate position based on alignment
    let textX = x
    if (textStyle.textAlign === 'center') {
        // Approximate text width for centering
        const approxWidth = text.length * fontSize * 0.6
        textX = x + (width - approxWidth) / 2
    } else if (textStyle.textAlign === 'right') {
        const approxWidth = text.length * fontSize * 0.6
        textX = x + width - approxWidth
    }

    // Draw text
    canvas.drawText(text, textX, y + fontSize, paint, font)

    paint.delete()
    font.delete()
}
