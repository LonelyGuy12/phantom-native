import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { initSkia } from '@/core/renderer/skia-renderer'
import { renderSerializableTree } from '@/core/renderer/skia-renderer-v2'
import { hitTest } from '@/core/renderer/hit-testing'
import type { WorkerToMainMessage, MainToWorkerMessage, SerializableRenderTree } from '@/core/runtime/worker-bridge'
import './PhonePreview.css'

type DeviceType = 'ios' | 'android' | 'web'

interface PhonePreviewProps {
    device: DeviceType
}

// Device configurations
const DEVICE_CONFIG = {
    ios: {
        name: 'iPhone 14 Pro',
        width: 393,
        height: 852,
        hasNotch: true,
        hasHomeIndicator: true,
        borderRadius: 47,
    },
    android: {
        name: 'Pixel 7',
        width: 412,
        height: 915,
        hasNotch: false,
        hasHomeIndicator: false,
        borderRadius: 32,
    },
    web: {
        name: 'Browser',
        width: 450,
        height: 800,
        hasNotch: false,
        hasHomeIndicator: false,
        borderRadius: 0,
    },
}

function PhonePreview({ device }: PhonePreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const workerRef = useRef<Worker | null>(null)
    const setCanvasReady = useAppStore((state) => state.setCanvasReady)
    const setVMStatus = useAppStore((state) => state.setVMStatus)
    const addTerminalOutput = useAppStore((state) => state.addTerminalOutput)
    const editorContent = useAppStore((state) => state.editorContent)
    const runTrigger = useAppStore((state) => state.runTrigger)
    const [deviceFrame, setDeviceFrame] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const [currentTree, setCurrentTree] = useState<SerializableRenderTree | null>(null)

    const config = DEVICE_CONFIG[device]

    // Initialize Skia (main thread) and Worker
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || initialized) return

        async function initializeGraphicsEngine() {
            if (!canvas) return

            try {
                console.log('[DEBUG] Starting graphics engine initialization...')
                setVMStatus('booting')
                addTerminalOutput('[Graphics] Initializing graphics engine...')

                // Set canvas size based on device
                const scale = window.devicePixelRatio || 1
                canvas.width = config.width * scale
                canvas.height = config.height * scale
                canvas.style.width = `${config.width}px`
                canvas.style.height = `${config.height}px`

                // Initialize Skia CanvasKit (Main Thread)
                addTerminalOutput('[Graphics] Loading Skia CanvasKit...')
                console.log('[DEBUG] Loading Skia...')
                await initSkia(canvas)
                console.log('[DEBUG] Skia loaded')
                addTerminalOutput('[Graphics] ✓ Skia ready!')

                // Initialize Worker
                addTerminalOutput('[Worker] Initializing runtime worker...')
                console.log('[DEBUG] Creating worker...')

                // Use Vite's worker import syntax
                const worker = new Worker(
                    new URL('@/core/runtime/worker.ts', import.meta.url),
                    { type: 'module' }
                )

                workerRef.current = worker

                // Listen for messages from worker
                worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
                    handleWorkerMessage(event.data)
                }

                worker.onerror = (error) => {
                    console.error('[DEBUG] Worker error:', error)
                    addTerminalOutput(`[Worker] ✗ Error: ${error.message}`)
                    setVMStatus('error')
                }

                // Initialize the worker
                const initMsg: MainToWorkerMessage = { type: 'INIT_WORKER' }
                worker.postMessage(initMsg)

                console.log('[DEBUG] Worker created, waiting for ready...')
            } catch (error: any) {
                console.error('[DEBUG] Graphics initialization error:', error)
                addTerminalOutput(`[Graphics] ✗ Error: ${error.message || error}`)
                setVMStatus('error')
            }
        }

        console.log('[DEBUG] PhonePreview mounted, initializing...')
        initializeGraphicsEngine()

        return () => {
            // Cleanup worker on unmount
            if (workerRef.current) {
                workerRef.current.terminate()
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Handle messages from worker
    const handleWorkerMessage = (message: WorkerToMainMessage) => {
        console.log('[DEBUG] Worker message:', message)

        switch (message.type) {
            case 'WORKER_READY':
                addTerminalOutput('[Worker] ✓ Runtime ready!')
                setVMStatus('ready')
                setCanvasReady(true)
                setInitialized(true)
                break

            case 'RENDER_TREE':
                console.log('[DEBUG] Received render tree')
                setCurrentTree(message.tree)
                renderSerializableTree(message.tree)
                addTerminalOutput('[Renderer] ✓ Canvas updated')
                break

            case 'EXECUTION_ERROR':
                console.error('[DEBUG] Execution error:', message.error)
                addTerminalOutput(`[Runtime] ✗ ${message.error}`)
                setVMStatus('error')
                break

            case 'LOG':
                addTerminalOutput(`[Worker] ${message.message}`)
                break
        }
    }

    // Execute code when editor content changes (with debounce)
    useEffect(() => {
        if (!initialized || !editorContent || !workerRef.current) return

        const timer = setTimeout(() => {
            executeUserCode()
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [editorContent, initialized]) // eslint-disable-line react-hooks/exhaustive-deps

    // Execute code when Run button is clicked
    useEffect(() => {
        if (!initialized || runTrigger === 0) return
        executeUserCode()
    }, [runTrigger, initialized]) // eslint-disable-line react-hooks/exhaustive-deps

    // Re-render when device changes
    useEffect(() => {
        if (initialized && currentTree) {
            renderSerializableTree(currentTree)
        }
    }, [device, initialized, currentTree]) // eslint-disable-line react-hooks/exhaustive-deps

    const executeUserCode = () => {
        if (!workerRef.current) return

        console.log('[DEBUG] Sending code to worker')
        setVMStatus('building')

        const msg: MainToWorkerMessage = {
            type: 'EXECUTE_CODE',
            code: editorContent,
            deviceWidth: config.width,
            deviceHeight: config.height,
        }

        workerRef.current.postMessage(msg)
    }

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!currentTree || !workerRef.current) return

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        // Perform hit testing
        const nodeId = hitTest(currentTree, { x, y })

        if (nodeId) {
            console.log('[DEBUG] Node clicked:', nodeId)
            addTerminalOutput(`[Event] Click on node ${nodeId}`)

            // Dispatch event to worker
            const msg: MainToWorkerMessage = {
                type: 'DISPATCH_EVENT',
                nodeId,
                eventType: 'press',
            }
            workerRef.current.postMessage(msg)
        }
    }

    return (
        <div className="phone-preview-container">
            <div className="preview-toolbar">
                <button
                    className={`toolbar-btn ${deviceFrame ? 'active' : ''}`}
                    onClick={() => setDeviceFrame(!deviceFrame)}
                    title="Toggle device frame"
                >
                    {device === 'ios' ? '📱' : device === 'android' ? '🤖' : '🌐'}
                </button>
                <span className="device-label">{config.name}</span>
            </div>

            <div className="preview-content">
                <div
                    className={`phone-frame ${deviceFrame ? 'visible' : 'hidden'} device-${device}`}
                    style={{
                        width: `${config.width}px`,
                        borderRadius: deviceFrame ? `${config.borderRadius}px` : '0px',
                    }}
                >
                    {deviceFrame && config.hasNotch && (
                        <div className="phone-notch"></div>
                    )}
                    <div
                        className="phone-screen"
                        style={{
                            borderRadius: deviceFrame ? `${config.borderRadius - 10}px` : '0px',
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            className="render-canvas"
                            style={{
                                width: `${config.width}px`,
                                height: `${config.height}px`,
                                cursor: 'pointer',
                            }}
                            onClick={handleCanvasClick}
                        />
                    </div>
                    {deviceFrame && config.hasHomeIndicator && (
                        <div className="phone-home-indicator"></div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PhonePreview
