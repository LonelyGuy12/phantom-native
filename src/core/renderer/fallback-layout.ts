/**
 * Fallback Layout System
 * 
 * Simple layout calculator that doesn't require Yoga WASM.
 * Implements basic flexbox-like behavior in pure JavaScript.
 */

export interface LayoutStyle {
    width?: number | string
    height?: number | string
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    padding?: number
    paddingTop?: number
    paddingBottom?: number
    paddingLeft?: number
    paddingRight?: number
    margin?: number
    marginTop?: number
    marginBottom?: number
    marginLeft?: number
    marginRight?: number
    flexDirection?: 'row' | 'column'
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch'
    flex?: number
}

export interface LayoutResult {
    left: number
    top: number
    width: number
    height: number
}

export interface LayoutNode {
    style: LayoutStyle
    children: LayoutNode[]
    layout?: LayoutResult
}

/**
 * Calculate layout for a node and its children
 */
export function calculateLayout(
    node: LayoutNode,
    containerWidth: number,
    containerHeight: number
): LayoutResult {
    const style = node.style || {}

    // Get padding values
    const paddingTop = style.paddingTop ?? style.padding ?? 0
    const paddingBottom = style.paddingBottom ?? style.padding ?? 0
    const paddingLeft = style.paddingLeft ?? style.padding ?? 0
    const paddingRight = style.paddingRight ?? style.padding ?? 0

    // Calculate own dimensions
    let width: number
    let height: number

    // Handle flex: 1 to take full container size
    if (style.flex && style.flex > 0) {
        width = containerWidth
        height = containerHeight
    } else {
        width = parseSize(style.width, containerWidth) ?? containerWidth
        height = parseSize(style.height, containerHeight) ?? containerHeight
    }

    // Apply min/max constraints
    if (style.minWidth) width = Math.max(width, style.minWidth)
    if (style.maxWidth) width = Math.min(width, style.maxWidth)
    if (style.minHeight) height = Math.max(height, style.minHeight)
    if (style.maxHeight) height = Math.min(height, style.maxHeight)

    const layout: LayoutResult = {
        left: 0,
        top: 0,
        width,
        height,
    }

    node.layout = layout

    // Calculate children layout
    if (node.children && node.children.length > 0) {
        const flexDirection = style.flexDirection || 'column'
        const justifyContent = style.justifyContent || 'flex-start'
        const alignItems = style.alignItems || 'flex-start'

        const contentWidth = width - paddingLeft - paddingRight
        const contentHeight = height - paddingTop - paddingBottom

        layoutChildren(
            node.children,
            contentWidth,
            contentHeight,
            paddingLeft,
            paddingTop,
            flexDirection,
            justifyContent,
            alignItems
        )
    }

    return layout
}

/**
 * Layout children within a container
 */
function layoutChildren(
    children: LayoutNode[],
    containerWidth: number,
    containerHeight: number,
    offsetX: number,
    offsetY: number,
    flexDirection: 'row' | 'column',
    justifyContent: string,
    alignItems: string
) {
    const isRow = flexDirection === 'row'
    const mainSize = isRow ? containerWidth : containerHeight
    const crossSize = isRow ? containerHeight : containerWidth

    // Calculate children sizes
    let totalFixedSize = 0
    let totalFlex = 0

    children.forEach(child => {
        const childStyle = child.style || {}
        const size = isRow
            ? parseSize(childStyle.width, containerWidth)
            : parseSize(childStyle.height, containerHeight)

        if (size !== null) {
            totalFixedSize += size
        } else if (childStyle.flex) {
            totalFlex += childStyle.flex
        }
    })

    const flexSpace = Math.max(0, mainSize - totalFixedSize)
    const flexUnit = totalFlex > 0 ? flexSpace / totalFlex : 0

    // Position children
    let currentPos = offsetX
    if (flexDirection === 'column') currentPos = offsetY

    // Calculate spacing for justifyContent
    let spacing = 0
    let startOffset = 0

    if (justifyContent === 'center') {
        startOffset = (mainSize - totalFixedSize - (flexUnit * totalFlex)) / 2
    } else if (justifyContent === 'flex-end') {
        startOffset = mainSize - totalFixedSize - (flexUnit * totalFlex)
    } else if (justifyContent === 'space-between' && children.length > 1) {
        spacing = (mainSize - totalFixedSize - (flexUnit * totalFlex)) / (children.length - 1)
    } else if (justifyContent === 'space-around') {
        spacing = (mainSize - totalFixedSize - (flexUnit * totalFlex)) / children.length
        startOffset = spacing / 2
    }

    currentPos += startOffset

    children.forEach((child) => {
        const childStyle = child.style || {}

        // Calculate child main size
        let childMainSize = isRow
            ? parseSize(childStyle.width, containerWidth)
            : parseSize(childStyle.height, containerHeight)

        if (childMainSize === null) {
            if (childStyle.flex) {
                childMainSize = flexUnit * childStyle.flex
            } else {
                childMainSize = 100 // Default size
            }
        }

        // Calculate child cross size
        let childCrossSize = isRow
            ? parseSize(childStyle.height, containerHeight)
            : parseSize(childStyle.width, containerWidth)

        if (childCrossSize === null) {
            if (alignItems === 'stretch') {
                childCrossSize = crossSize
            } else {
                childCrossSize = 100 // Default size
            }
        }

        // Calculate cross axis position based on alignItems
        let crossPos = isRow ? offsetY : offsetX
        if (alignItems === 'center') {
            crossPos += (crossSize - childCrossSize) / 2
        } else if (alignItems === 'flex-end') {
            crossPos += crossSize - childCrossSize
        }

        // Calculate layout for this child with its dimensions
        const childWidth = isRow ? childMainSize : childCrossSize
        const childHeight = isRow ? childCrossSize : childMainSize

        calculateLayout(child, childWidth, childHeight)

        // Now update the position
        if (child.layout) {
            child.layout.left = isRow ? currentPos : crossPos
            child.layout.top = isRow ? crossPos : currentPos
        }

        currentPos += childMainSize + spacing
    })
}

/**
 * Parse size value (number or percentage string)
 */
function parseSize(size: number | string | undefined, containerSize: number): number | null {
    if (size === undefined) return null
    if (typeof size === 'number') return size
    if (typeof size === 'string' && size.endsWith('%')) {
        const percent = parseFloat(size)
        return (percent / 100) * containerSize
    }
    return null
}
