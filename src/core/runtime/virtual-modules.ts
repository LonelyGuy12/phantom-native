/**
 * Virtual React Native Modules
 * 
 * Provides mock implementations of React Native components and APIs
 */

import { RenderNode } from '../renderer/render-node'
import type { ViewStyle, TextStyle } from '../renderer/skia-renderer'
import type { LayoutStyle } from '../renderer/yoga-layout'

// Virtual component tree for current render
let currentRenderTree: RenderNode | null = null
let stateUpdateCallback: (() => void) | null = null

export function setStateUpdateCallback(callback: () => void) {
    stateUpdateCallback = callback
}

// Simple state management
let stateIndex = 0
const stateValues: any[] = []

export function resetState() {
    stateIndex = 0
}

// Mock React hooks
export const React = {
    createElement,
    useState: (initialValue: any) => {
        const currentIndex = stateIndex

        if (stateValues[currentIndex] === undefined) {
            stateValues[currentIndex] = initialValue
        }

        const value = stateValues[currentIndex]
        const setValue = (newValue: any) => {
            stateValues[currentIndex] = typeof newValue === 'function'
                ? newValue(stateValues[currentIndex])
                : newValue

            // Trigger re-render
            if (stateUpdateCallback) {
                stateUpdateCallback()
            }
        }

        stateIndex++
        return [value, setValue]
    },
    useEffect: () => { }, // Simplified - not implemented
    useCallback: (fn: any) => fn,
    useMemo: (fn: any) => fn(),
}

// Mock React Native components
export const ReactNative = {
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    TouchableOpacity: 'TouchableOpacity',
    StyleSheet: {
        create: (styles: any) => styles,
    },
}

interface ElementProps {
    style?: any
    children?: any
    onPress?: () => void
    [key: string]: any
}

function createElement(
    type: string | Function,
    props: ElementProps | null,
    ...children: any[]
): VirtualElement {
    const actualProps = props || {}
    const actualChildren = children.filter(child =>
        child !== null && child !== undefined && child !== false
    )

    return {
        type,
        props: {
            ...actualProps,
            children: actualChildren.length === 1 ? actualChildren[0] : actualChildren,
        }
    }
}

export interface VirtualElement {
    type: string | Function
    props: {
        children?: any
        style?: any
        onPress?: () => void
        [key: string]: any
    }
}

/**
 * Convert Virtual Element tree to RenderNode tree
 */
export function buildRenderTree(element: VirtualElement): RenderNode | null {
    if (!element) return null

    // Handle function components
    if (typeof element.type === 'function') {
        resetState()
        const result = element.type(element.props)
        return buildRenderTree(result)
    }

    const { type, props } = element
    const { children, style = {}, onPress, ...otherProps } = props

    // Convert to RenderNode
    if (type === 'View' || type === 'TouchableOpacity') {
        const childNodes: RenderNode[] = []

        if (children) {
            const childArray = Array.isArray(children) ? children : [children]
            for (const child of childArray) {
                if (typeof child === 'object' && child.type) {
                    const childNode = buildRenderTree(child)
                    if (childNode) childNodes.push(childNode)
                }
            }
        }

        const node = new RenderNode({
            type: 'view',
            style: flattenStyle(style),
            children: childNodes,
        })

        // Attach event handler
        if (onPress) {
            node.onPress = onPress
        }

        return node
    }

    if (type === 'Text') {
        let textContent = ''

        if (children) {
            const childArray = Array.isArray(children) ? children : [children]
            textContent = childArray
                .map(child => typeof child === 'string' || typeof child === 'number' ? String(child) : '')
                .join('')
        }

        return new RenderNode({
            type: 'text',
            text: textContent,
            style: flattenStyle(style),
        })
    }

    return null
}

/**
 * Flatten StyleSheet styles into single style object
 */
function flattenStyle(style: any): LayoutStyle & ViewStyle & TextStyle {
    if (!style) return {}

    if (Array.isArray(style)) {
        return style.reduce((acc, s) => ({ ...acc, ...flattenStyle(s) }), {})
    }

    return style
}

/**
 * Setup global React and React Native
 */
export function setupVirtualModules() {
    (window as any).__REACT__ = React;
    (window as any).__REACT_NATIVE__ = ReactNative
    console.log('✓ Virtual modules initialized')
}
