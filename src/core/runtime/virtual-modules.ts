/**
 * Virtual React Native Modules
 * 
 * Mocks React Native components and React hooks for in-browser execution
 */

import { SimpleRenderNode } from '../renderer/simple-render-node'
import type { ViewStyle, TextStyle } from '../renderer/skia-renderer'
import type { LayoutStyle } from '../renderer/yoga-layout'

// Virtual component tree for current render
let currentRenderTree: SimpleRenderNode | null = null
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
 * Build a RenderNode tree from virtual elements
 */
export function buildRenderTree(element: VirtualElement): SimpleRenderNode | null {
    if (!element) return null

    const children: SimpleRenderNode[] = []
    if (element.props.children) {
        const childArray = Array.isArray(element.props.children)
            ? element.props.children
            : [element.props.children]

        childArray.forEach(child => {
            if (typeof child === 'string' || typeof child === 'number') {
                // Text child
                children.push(new SimpleRenderNode({
                    type: 'text',
                    text: String(child),
                    style: {},
                }))
            } else if (typeof child === 'object' && child) {
                const childNode = buildRenderTree(child)
                if (childNode) children.push(childNode)
            }
        })
    }

    const type = element.type === 'View' || element.type === 'TouchableOpacity'
        ? 'view'
        : element.type === 'Text'
            ? 'text'
            : 'view'

    return new SimpleRenderNode({
        type,
        style: flattenStyle(element.props.style) || {},
        text: type === 'text' && children.length === 1 && children[0].text
            ? children[0].text
            : undefined,
        children: type === 'text' && children.length === 1 ? [] : children,
        onPress: element.props.onPress,
    })
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
    // Expose React and ReactNative globally in worker context
    // Use self instead of window for worker compatibility
    (self as any).__REACT__ = React;
    (self as any).__REACT_NATIVE__ = ReactNative
    console.log('✓ Virtual modules initialized')
}
