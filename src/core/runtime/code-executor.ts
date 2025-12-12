/**
 * Code Executor
 * 
 * Safely executes transformed React Native code and returns component tree
 */

import { transformCode, wrapCode } from './babel-transformer'
import { buildRenderTree, setupVirtualModules, setStateUpdateCallback, type VirtualElement } from './virtual-modules'
import type { RenderNode } from '../renderer/render-node'

export interface ExecutionResult {
    success: boolean
    renderTree?: RenderNode
    error?: string
}

let lastExecutedCode = ''
let lastRenderCallback: (() => void) | null = null

/**
 * Execute user code and return render tree
 */
export function executeCode(sourceCode: string, onUpdate?: () => void): ExecutionResult {
    try {
        // Setup virtual modules if not already done
        setupVirtualModules()

        // Set state update callback
        if (onUpdate) {
            lastRenderCallback = onUpdate
            setStateUpdateCallback(onUpdate)
        }

        // Transform JSX/TS to JS
        const { code, error } = transformCode(sourceCode)

        if (error) {
            return {
                success: false,
                error: `Transform error: ${error}`
            }
        }

        // Wrap code to provide module environment
        const wrappedCode = wrapCode(code)
        lastExecutedCode = wrappedCode

        // Execute code safely
        const AppComponent = eval(wrappedCode)

        if (typeof AppComponent !== 'function') {
            return {
                success: false,
                error: 'Code must export a default function component'
            }
        }

        // Render component to virtual element tree
        const element: VirtualElement = AppComponent({})

        // Build RenderNode tree from virtual elements
        const renderTree = buildRenderTree(element)

        if (!renderTree) {
            return {
                success: false,
                error: 'Failed to build render tree'
            }
        }

        return {
            success: true,
            renderTree
        }
    } catch (error: any) {
        return {
            success: false,
            error: `Execution error: ${error.message || String(error)}`
        }
    }
}

/**
 * Re-execute last code (for state updates)
 */
export function reExecute(): ExecutionResult {
    if (!lastExecutedCode) {
        return {
            success: false,
            error: 'No code to re-execute'
        }
    }

    try {
        const AppComponent = eval(lastExecutedCode)
        const element: VirtualElement = AppComponent({})
        const renderTree = buildRenderTree(element)

        if (!renderTree) {
            return {
                success: false,
                error: 'Failed to build render tree'
            }
        }

        return {
            success: true,
            renderTree
        }
    } catch (error: any) {
        return {
            success: false,
            error: `Re-execution error: ${error.message || String(error)}`
        }
    }
}
