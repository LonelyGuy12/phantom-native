/**
 * Message Bridge Protocol
 * 
 * Type definitions for communication between Main Thread and Web Worker
 */

// Main Thread → Worker Messages
export type MainToWorkerMessage =
    | { type: 'INIT_WORKER' }
    | { type: 'EXECUTE_CODE'; code: string; deviceWidth: number; deviceHeight: number }
    | { type: 'DISPATCH_EVENT'; nodeId: string; eventType: 'press' }

// Worker → Main Thread Messages
export type WorkerToMainMessage =
    | { type: 'WORKER_READY' }
    | { type: 'RENDER_TREE'; tree: SerializableRenderTree }
    | { type: 'EXECUTION_ERROR'; error: string }
    | { type: 'LOG'; level: 'info' | 'error' | 'warn'; message: string }

// Serializable Render Tree Format
export interface SerializableNode {
    id: string // Unique identifier for event targeting
    type: 'view' | 'text'

    // Computed layout (from Yoga)
    layout: {
        left: number
        top: number
        width: number
        height: number
    }

    // Rendering properties
    style?: {
        backgroundColor?: string
        borderRadius?: number
        borderColor?: string
        borderWidth?: number
        shadowColor?: string
        shadowOffset?: { width: number; height: number }
        shadowOpacity?: number
        shadowRadius?: number
    }

    // Text-specific
    text?: string
    textStyle?: {
        color?: string
        fontSize?: number
        fontWeight?: string
        textAlign?: 'left' | 'center' | 'right'
    }

    // Event handlers (flags only, not functions)
    hasOnPress?: boolean

    // Children
    children: SerializableNode[]
}

export type SerializableRenderTree = SerializableNode

/**
 * Helper to generate unique node IDs
 */
let nodeIdCounter = 0
export function generateNodeId(): string {
    return `node_${++nodeIdCounter}`
}

/**
 * Reset node ID counter (useful for testing)
 */
export function resetNodeIdCounter(): void {
    nodeIdCounter = 0
}
