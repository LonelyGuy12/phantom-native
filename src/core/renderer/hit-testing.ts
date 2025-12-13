/**
 * Hit Testing
 * 
 * Determines which node was clicked based on canvas coordinates.
 * Updated to work with SerializableNode format from worker.
 */

import type { SerializableNode } from '../runtime/worker-bridge'

export interface Point {
    x: number
    y: number
}

/**
 * Perform hit testing to find the topmost node at given coordinates
 * Returns the node ID instead of the node itself (for worker communication)
 */
export function hitTest(
    node: SerializableNode,
    point: Point,
    offsetX: number = 0,
    offsetY: number = 0
): string | null {
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
        const hitNodeId = hitTest(child, point, x, y)
        if (hitNodeId) return hitNodeId
    }

    // If no children were hit and this node has an onPress handler, return its ID
    if (node.hasOnPress) {
        return node.id
    }

    // Otherwise return null (pass through to parent)
    return null
}
