/**
 * Hit Testing
 * 
 * Determines which RenderNode was clicked based on canvas coordinates
 */

import type { RenderNode } from './render-node'

export interface Point {
    x: number
    y: number
}

/**
 * Perform hit testing to find the topmost node at given coordinates
 */
export function hitTest(
    node: RenderNode,
    point: Point,
    offsetX: number = 0,
    offsetY: number = 0
): RenderNode | null {
    if (!node.layout) return null

    const x = offsetX + node.layout.left
    const y = offsetY + node.layout.top
    const width = node.layout.width
    const height = node.layout.height

    // Check if point is within this node's bounds
    const isInside =
        point.x >= x &&
        point.x <= x + width &&
        point.y >= y &&
        point.y <= y + height

    if (!isInside) return null

    // Check children first (they're on top)
    for (let i = node.children.length - 1; i >= 0; i--) {
        const child = node.children[i]
        const hit = hitTest(child, point, x, y)
        if (hit) return hit
    }

    // If no children were hit and this node has an onPress handler, return it
    if (node.onPress) {
        return node
    }

    // Otherwise return null (pass through to parent)
    return null
}
