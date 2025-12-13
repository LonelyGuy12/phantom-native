/**
 * Runtime Worker
 * 
 * Executes user code and handles layout calculations off the main thread.
 * Communicates with main thread via message passing.
 */

import type { MainToWorkerMessage, WorkerToMainMessage } from './worker-bridge'
import { resetNodeIdCounter } from './worker-bridge'
import { initYoga } from '../renderer/yoga-layout'
import { transformCode, wrapCode } from './babel-transformer'
import { buildRenderTree, setupVirtualModules, setStateUpdateCallback, resetState } from './virtual-modules'
import type { VirtualElement } from './virtual-modules'

// Worker state
let initialized = false
let currentRenderTree: any = null
let eventHandlers: Map<string, () => void> = new Map()
let lastDeviceWidth = 393
let lastDeviceHeight = 852

/**
 * Log helper that forwards to main thread
 */
function log(level: 'info' | 'error' | 'warn', message: string) {
    const msg: WorkerToMainMessage = { type: 'LOG', level, message }
    self.postMessage(msg)
}

/**
 * Initialize the worker
 */
async function initWorker() {
    if (initialized) return

    try {
        log('info', '[Worker] Initializing...')

        // Initialize Yoga WASM in worker context
        await initYoga()
        log('info', '[Worker] Yoga WASM loaded')

        // Setup virtual React Native modules
        setupVirtualModules()
        log('info', '[Worker] Virtual modules ready')

        initialized = true

        const msg: WorkerToMainMessage = { type: 'WORKER_READY' }
        self.postMessage(msg)
        log('info', '[Worker] ✓ Ready')
    } catch (error: any) {
        log('error', `[Worker] Initialization failed: ${error.message}`)
        const msg: WorkerToMainMessage = {
            type: 'EXECUTION_ERROR',
            error: `Worker initialization failed: ${error.message}`
        }
        self.postMessage(msg)
    }
}

/**
 * Execute user code and build render tree
 */
function executeCode(code: string, deviceWidth: number, deviceHeight: number) {
    try {
        log('info', '[Worker] Executing code...')

        // Reset state for fresh execution
        resetState()
        resetNodeIdCounter()
        eventHandlers.clear()
        lastDeviceWidth = deviceWidth
        lastDeviceHeight = deviceHeight

        // Transform JSX/TS to JS
        const { code: transformedCode, error } = transformCode(code)

        if (error) {
            throw new Error(`Transform error: ${error}`)
        }

        // Wrap code to provide module environment
        const wrappedCode = wrapCode(transformedCode)

        // Execute code safely
        const AppComponent = eval(wrappedCode)

        if (typeof AppComponent !== 'function') {
            throw new Error('Code must export a default function component')
        }

        // Render component to virtual element tree
        const element: VirtualElement = AppComponent({})

        // Build RenderNode tree from virtual elements
        const renderTree = buildRenderTree(element)

        if (!renderTree) {
            throw new Error('Failed to build render tree')
        }

        // Calculate layout with device dimensions
        renderTree.calculateLayout(deviceWidth, deviceHeight)

        // Store render tree and extract event handlers
        currentRenderTree = renderTree
        extractEventHandlers(renderTree)

        // Convert to serializable format
        const serializableTree = renderTree.toSerializable()

        // Send to main thread
        const msg: WorkerToMainMessage = { type: 'RENDER_TREE', tree: serializableTree }
        self.postMessage(msg)

        log('info', '[Worker] ✓ Code executed, tree sent to main thread')
    } catch (error: any) {
        log('error', `[Worker] Execution error: ${error.message}`)
        const msg: WorkerToMainMessage = {
            type: 'EXECUTION_ERROR',
            error: error.message || String(error)
        }
        self.postMessage(msg)
    }
}

/**
 * Extract event handlers from render tree and store by node ID
 */
function extractEventHandlers(node: any) {
    if (node.onPress) {
        eventHandlers.set(node.id, node.onPress)
    }

    node.children.forEach((child: any) => extractEventHandlers(child))
}

/**
 * Dispatch event to node
 */
function dispatchEvent(nodeId: string, eventType: 'press') {
    try {
        log('info', `[Worker] Dispatching ${eventType} to node ${nodeId}`)

        const handler = eventHandlers.get(nodeId)

        if (!handler) {
            log('warn', `[Worker] No handler found for node ${nodeId}`)
            return
        }

        // Execute the handler
        handler()

        // Handler may have changed state, re-execute code
        // TODO: This is a simplified approach; ideally we'd only re-render
        if (currentRenderTree) {
            log('info', '[Worker] Re-executing after state change...')
            // Re-execute with last code (stored in closure)
            // For now, we rely on state update callback in virtual-modules
        }
    } catch (error: any) {
        log('error', `[Worker] Event dispatch error: ${error.message}`)
    }
}

/**
 * Handle state update from virtual modules
 */
function handleStateUpdate() {
    try {
        log('info', '[Worker] State updated, re-rendering...')

        // Import re-execute from code-executor
        // For now, we'll need to re-execute the code
        // This is handled by the state update callback in virtual-modules
        // which will trigger a re-execution

        // TODO: Implement proper re-execution flow
    } catch (error: any) {
        log('error', `[Worker] State update error: ${error.message}`)
    }
}

// Set state update callback
setStateUpdateCallback(handleStateUpdate)

/**
 * Message handler
 */
self.onmessage = async (event: MessageEvent<MainToWorkerMessage>) => {
    const message = event.data

    switch (message.type) {
        case 'INIT_WORKER':
            await initWorker()
            break

        case 'EXECUTE_CODE':
            executeCode(message.code, message.deviceWidth, message.deviceHeight)
            break

        case 'DISPATCH_EVENT':
            dispatchEvent(message.nodeId, message.eventType)
            break

        default:
            log('warn', `[Worker] Unknown message type: ${(message as any).type}`)
    }
}

// Log that worker script has loaded
console.log('[Worker] Script loaded, waiting for INIT_WORKER message')
