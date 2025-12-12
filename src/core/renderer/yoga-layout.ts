/**
 * Yoga Layout Engine
 * 
 * Initializes Yoga WASM and provides layout calculation functions
 * using the same flexbox algorithm React Native uses internally.
 */

import Yoga from 'yoga-wasm-web'

let yogaInstance: any = null

export async function initYoga() {
    if (yogaInstance) {
        return yogaInstance
    }

    try {
        console.log('[Yoga] Initializing...')
        // Yoga default export is a function that returns a promise
        // @ts-ignore - Yoga types expect config but works without it
        yogaInstance = await Yoga()
        console.log('[Yoga] ✓ Initialized successfully')
        return yogaInstance
    } catch (error) {
        console.error('[Yoga] Failed to initialize:', error)
        throw error
    }
}

export function getYoga() {
    if (!yogaInstance) {
        throw new Error('Yoga not initialized. Call initYoga() first.')
    }
    return yogaInstance
}

export interface LayoutStyle {
    width?: number | 'auto'
    height?: number | 'auto'
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number

    // Flexbox
    flex?: number
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    flexWrap?: 'wrap' | 'nowrap'
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'

    // Spacing
    padding?: number
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number
    margin?: number
    marginTop?: number
    marginRight?: number
    marginBottom?: number
    marginLeft?: number

    // Position
    position?: 'relative' | 'absolute'
    top?: number
    right?: number
    bottom?: number
    left?: number
}

export interface LayoutResult {
    left: number
    top: number
    width: number
    height: number
}

export function createYogaNode(style: LayoutStyle): any {
    const yoga = getYoga()
    const node = yoga.Node.create()

    // Dimensions
    if (style.width === 'auto') {
        node.setWidthAuto()
    } else if (typeof style.width === 'number') {
        node.setWidth(style.width)
    }

    if (style.height === 'auto') {
        node.setHeightAuto()
    } else if (typeof style.height === 'number') {
        node.setHeight(style.height)
    }

    if (style.minWidth) node.setMinWidth(style.minWidth)
    if (style.minHeight) node.setMinHeight(style.minHeight)
    if (style.maxWidth) node.setMaxWidth(style.maxWidth)
    if (style.maxHeight) node.setMaxHeight(style.maxHeight)

    // Flex
    if (style.flex !== undefined) node.setFlex(style.flex)
    if (style.flexDirection) {
        const dirMap: Record<string, number> = {
            'row': yoga.FLEX_DIRECTION_ROW,
            'column': yoga.FLEX_DIRECTION_COLUMN,
            'row-reverse': yoga.FLEX_DIRECTION_ROW_REVERSE,
            'column-reverse': yoga.FLEX_DIRECTION_COLUMN_REVERSE,
        }
        node.setFlexDirection(dirMap[style.flexDirection])
    }

    if (style.justifyContent) {
        const justifyMap: Record<string, number> = {
            'flex-start': yoga.JUSTIFY_FLEX_START,
            'flex-end': yoga.JUSTIFY_FLEX_END,
            'center': yoga.JUSTIFY_CENTER,
            'space-between': yoga.JUSTIFY_SPACE_BETWEEN,
            'space-around': yoga.JUSTIFY_SPACE_AROUND,
        }
        node.setJustifyContent(justifyMap[style.justifyContent])
    }

    if (style.alignItems) {
        const alignMap: Record<string, number> = {
            'flex-start': yoga.ALIGN_FLEX_START,
            'flex-end': yoga.ALIGN_FLEX_END,
            'center': yoga.ALIGN_CENTER,
            'stretch': yoga.ALIGN_STRETCH,
            'baseline': yoga.ALIGN_BASELINE,
        }
        node.setAlignItems(alignMap[style.alignItems])
    }

    // Padding
    if (style.padding !== undefined) {
        node.setPadding(yoga.EDGE_ALL, style.padding)
    }
    if (style.paddingTop !== undefined) node.setPadding(yoga.EDGE_TOP, style.paddingTop)
    if (style.paddingRight !== undefined) node.setPadding(yoga.EDGE_RIGHT, style.paddingRight)
    if (style.paddingBottom !== undefined) node.setPadding(yoga.EDGE_BOTTOM, style.paddingBottom)
    if (style.paddingLeft !== undefined) node.setPadding(yoga.EDGE_LEFT, style.paddingLeft)

    // Margin
    if (style.margin !== undefined) {
        node.setMargin(yoga.EDGE_ALL, style.margin)
    }
    if (style.marginTop !== undefined) node.setMargin(yoga.EDGE_TOP, style.marginTop)
    if (style.marginRight !== undefined) node.setMargin(yoga.EDGE_RIGHT, style.marginRight)
    if (style.marginBottom !== undefined) node.setMargin(yoga.EDGE_BOTTOM, style.marginBottom)
    if (style.marginLeft !== undefined) node.setMargin(yoga.EDGE_LEFT, style.marginLeft)

    // Position
    if (style.position === 'absolute') {
        node.setPositionType(yoga.POSITION_TYPE_ABSOLUTE)
    }
    if (style.top !== undefined) node.setPosition(yoga.EDGE_TOP, style.top)
    if (style.right !== undefined) node.setPosition(yoga.EDGE_RIGHT, style.right)
    if (style.bottom !== undefined) node.setPosition(yoga.EDGE_BOTTOM, style.bottom)
    if (style.left !== undefined) node.setPosition(yoga.EDGE_LEFT, style.left)

    return node
}

export function calculateLayout(node: any, width?: number, height?: number): LayoutResult {
    node.calculateLayout(width, height)

    return {
        left: node.getComputedLeft(),
        top: node.getComputedTop(),
        width: node.getComputedWidth(),
        height: node.getComputedHeight(),
    }
}
