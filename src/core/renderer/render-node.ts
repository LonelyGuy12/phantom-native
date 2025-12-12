/**
 * RenderNode
 * 
 * Represents a node in the virtual view tree.
 * Combines layout (Yoga) and rendering (Skia) for each React Native component.
 */

import { createYogaNode, calculateLayout, type LayoutStyle, type LayoutResult } from './yoga-layout'
import { drawView, drawText, type ViewStyle, type TextStyle } from './skia-renderer'

export type NodeType = 'view' | 'text' | 'image'

export interface RenderNodeProps {
    type: NodeType
    style?: LayoutStyle & ViewStyle & TextStyle
    text?: string
    children?: RenderNode[]
    onPress?: () => void
}

export class RenderNode {
    type: NodeType
    style: LayoutStyle & ViewStyle & TextStyle
    text?: string
    children: RenderNode[]
    yogaNode: any
    layout: LayoutResult | null = null
    onPress?: () => void // Event handler for touch/click

    constructor(props: RenderNodeProps) {
        this.type = props.type
        this.style = props.style || {}
        this.text = props.text
        this.children = props.children || []
        this.onPress = props.onPress

        // Create Yoga node for layout
        this.yogaNode = createYogaNode(this.style)

        // Add children to Yoga node
        this.children.forEach((child, index) => {
            this.yogaNode.insertChild(child.yogaNode, index)
        })
    }

    /**
     * Calculate layout for this node and all children
     */
    calculateLayout(width?: number, height?: number) {
        this.layout = calculateLayout(this.yogaNode, width, height)

        // Recursively calculate children layouts
        this.children.forEach(child => {
            child.calculateLayout()
        })
    }

    /**
     * Render this node and all children to canvas
     */
    render(offsetX: number = 0, offsetY: number = 0) {
        if (!this.layout) {
            throw new Error('Layout not calculated. Call calculateLayout() first.')
        }

        const x = offsetX + this.layout.left
        const y = offsetY + this.layout.top
        const width = this.layout.width
        const height = this.layout.height

        // Render based on type
        if (this.type === 'view') {
            drawView(x, y, width, height, this.style)
        } else if (this.type === 'text' && this.text) {
            // Draw text background if backgroundColor is set
            if (this.style.backgroundColor) {
                drawView(x, y, width, height, this.style)
            }
            drawText(this.text, x, y, width, this.style)
        }

        // Render children
        this.children.forEach(child => {
            child.render(x, y)
        })
    }

    /**
     * Clean up Yoga node
     */
    destroy() {
        this.children.forEach(child => child.destroy())
        this.yogaNode.free()
    }

    /**
     * Update node properties
     */
    update(props: Partial<RenderNodeProps>) {
        if (props.text !== undefined) {
            this.text = props.text
        }
        if (props.style) {
            this.style = { ...this.style, ...props.style }
            // TODO: Update Yoga node with new style
        }
        if (props.children) {
            // Clean up old children
            this.children.forEach(child => child.destroy())
            // Set new children
            this.children = props.children
            // Update Yoga tree
            this.yogaNode.removeAllChildren()
            this.children.forEach((child, index) => {
                this.yogaNode.insertChild(child.yogaNode, index)
            })
        }
    }
}

/**
 * Create a simple demo scene
 */
export function createDemoScene(): RenderNode {
    return new RenderNode({
        type: 'view',
        style: {
            width: 393,
            height: 852,
            backgroundColor: '#0a0a0f',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
        },
        children: [
            new RenderNode({
                type: 'view',
                style: {
                    width: 300,
                    height: 200,
                    backgroundColor: '#1a1a24',
                    borderRadius: 16,
                    padding: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                },
                children: [
                    new RenderNode({
                        type: 'text',
                        text: 'Hello, Phantom! 🌙',
                        style: {
                            color: '#a78bfa',
                            fontSize: 32,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginBottom: 12,
                        },
                    }),
                    new RenderNode({
                        type: 'text',
                        text: 'Skia + Yoga = 💜',
                        style: {
                            color: '#a8a8b8',
                            fontSize: 16,
                            textAlign: 'center',
                        },
                    }),
                ],
            }),
        ],
    })
}
