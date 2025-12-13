/**
 * Simple RenderNode for Worker Context
 * 
 * Lightweight version that uses fallback layout instead of Yoga WASM
 */

import type { SerializableNode } from '../runtime/worker-bridge'
import { generateNodeId } from '../runtime/worker-bridge'
import type { LayoutStyle, LayoutNode } from './fallback-layout'
import { calculateLayout } from './fallback-layout'

type NodeType = 'view' | 'text'

interface ViewStyle {
    backgroundColor?: string
    borderRadius?: number
    borderColor?: string
    borderWidth?: number
    shadowColor?: string
    shadowOffset?: { width: number; height: number }
    shadowOpacity?: number
    shadowRadius?: number
}

interface TextStyle {
    color?: string
    fontSize?: number
    fontWeight?: string
    textAlign?: 'left' | 'center' | 'right'
}

interface RenderNodeProps {
    type: NodeType
    style?: LayoutStyle & ViewStyle & TextStyle
    text?: string
    children?: SimpleRenderNode[]
    onPress?: () => void
}

export class SimpleRenderNode {
    id: string
    type: NodeType
    style: LayoutStyle & ViewStyle & TextStyle
    text?: string
    children: SimpleRenderNode[]
    layout: LayoutNode['layout']
    onPress?: () => void

    constructor(props: RenderNodeProps) {
        this.id = generateNodeId()
        this.type = props.type
        this.style = props.style || {}
        this.text = props.text
        this.children = props.children || []
        this.onPress = props.onPress
        this.layout = undefined
    }

    /**
     * Calculate layout for this node and all children
     */
    calculateLayout(width?: number, height?: number) {
        const layoutNode = this.toLayoutNode()
        const result = calculateLayout(layoutNode, width || 393, height || 852)
        this.layout = result

        // Update children layouts from layoutNode
        this.updateLayoutsFromNode(layoutNode)
    }

    /**
     * Convert to layout node format
     */
    private toLayoutNode(): LayoutNode {
        return {
            style: this.style,
            children: this.children.map(child => child.toLayoutNode()),
            layout: this.layout,
        }
    }

    /**
     * Update layouts from calculated layout node
     */
    private updateLayoutsFromNode(layoutNode: LayoutNode) {
        this.layout = layoutNode.layout

        this.children.forEach((child, index) => {
            if (layoutNode.children[index]) {
                child.updateLayoutsFromNode(layoutNode.children[index])
            }
        })
    }

    /**
     * Convert to serializable format for main thread
     */
    toSerializable(): SerializableNode {
        if (!this.layout) {
            throw new Error('Layout not calculated. Call calculateLayout() first.')
        }

        return {
            id: this.id,
            type: this.type,
            layout: {
                left: this.layout.left,
                top: this.layout.top,
                width: this.layout.width,
                height: this.layout.height,
            },
            style: {
                backgroundColor: this.style.backgroundColor,
                borderRadius: this.style.borderRadius,
                borderColor: this.style.borderColor,
                borderWidth: this.style.borderWidth,
                shadowColor: this.style.shadowColor,
                shadowOffset: this.style.shadowOffset,
                shadowOpacity: this.style.shadowOpacity,
                shadowRadius: this.style.shadowRadius,
            },
            text: this.text,
            textStyle: this.type === 'text' ? {
                color: this.style.color,
                fontSize: this.style.fontSize,
                fontWeight: this.style.fontWeight,
                textAlign: this.style.textAlign,
            } : undefined,
            hasOnPress: !!this.onPress,
            children: this.children.map(child => child.toSerializable()),
        }
    }
}
