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
export function renderSerializableTree(tree: SerializableNode) {
    const { CanvasKit, surface, canvas } = getSkia()

    if (!CanvasKit || !surface || !canvas) {
        console.error('[Renderer] Canvas not initialized')
        return
    }

    console.log('[Renderer] Rendering tree:', JSON.stringify(tree, null, 2))

    // Clear canvas with dark background (not pure black so we can debug)
    const clearColor = CanvasKit.Color(10, 10, 15, 1.0) // Very dark gray
    canvas.clear(clearColor)

    try {
        // Render root node - tree IS the root node, start at (0, 0)
        console.log('[Renderer] Starting to render root node...')
        renderNode(tree, 0, 0, CanvasKit, canvas)

        // Flush to screen
        surface.flush()

        console.log('[Renderer] ✓ Render complete and flushed')
    } catch (error) {
        console.error('[Renderer] Render error:', error)
        console.error('[Renderer] Error stack:', (error as Error).stack)
    }
}

/**
 * Recursively render a node and its children
 * @param offsetX - accumulated X offset from parent
 * @param offsetY - accumulated Y offset from parent
 */
function renderNode(
    node: SerializableNode,
    offsetX: number,
    offsetY: number,
    CanvasKit: any,
    canvas: any
) {
    if (!node || !node.layout) {
        console.warn('[Renderer] Node missing layout:', node)
        return
    }

    const { left, top, width, height } = node.layout

    // Calculate absolute position by adding parent offset
    const absoluteX = offsetX + left
    const absoluteY = offsetY + top

    console.log(`[Renderer] Drawing ${node.type} at (${absoluteX}, ${absoluteY}) size (${width}x${height})`)

    // Draw based on type at absolute position
    if (node.type === 'view') {
        drawView(absoluteX, absoluteY, width, height, node.style, CanvasKit, canvas)
    } else if (node.type === 'text' && node.text) {
        const textStyle = node.textStyle || {}
        drawText(node.text, absoluteX, absoluteY, width, textStyle, CanvasKit, canvas)
    }

    // Render children with accumulated offset
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            renderNode(child, absoluteX, absoluteY, CanvasKit, canvas)
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
    paint.setStyle(CanvasKit.PaintStyle.Fill)

    const fontSize = textStyle.fontSize || 16

    // Use simple font - this should work on all systems
    const font = new CanvasKit.Font(null, fontSize)

    // Simple text rendering - draw directly
    const textY = y + fontSize

    // Draw the text
    canvas.drawText(text, x, textY, paint, font)

    // Cleanup
    paint.delete()
    font.delete()
}
