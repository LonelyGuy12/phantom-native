import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { initYoga } from '@/core/renderer/yoga-layout'
import { initSkia, clearCanvas, flush } from '@/core/renderer/skia-renderer'
import { createDemoScene } from '@/core/renderer/render-node'
import { executeCode, reExecute } from '@/core/runtime/code-executor'
import { hitTest } from '@/core/renderer/hit-testing'
import type { RenderNode } from '@/core/renderer/render-node'
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
    const setCanvasReady = useAppStore((state) => state.setCanvasReady)
    const setVMStatus = useAppStore((state) => state.setVMStatus)
    const addTerminalOutput = useAppStore((state) => state.addTerminalOutput)
    const editorContent = useAppStore((state) => state.editorContent)
    const runTrigger = useAppStore((state) => state.runTrigger)
    const [deviceFrame, setDeviceFrame] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const [currentScene, setCurrentScene] = useState<RenderNode | null>(null)

    const config = DEVICE_CONFIG[device]

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

                // Initialize Yoga WASM
                addTerminalOutput('[Graphics] Loading Yoga WASM...')
                console.log('[DEBUG] Loading Yoga...')
                await initYoga()
                console.log('[DEBUG] Yoga loaded')

                // Initialize Skia CanvasKit
                addTerminalOutput('[Graphics] Loading Skia CanvasKit...')
                console.log('[DEBUG] Loading Skia...')
                await initSkia(canvas)
                console.log('[DEBUG] Skia loaded')

                addTerminalOutput('[Graphics] ✓ Graphics engine ready!')
                console.log('[DEBUG] Graphics engine ready!')
                setCanvasReady(true)
                setVMStatus('ready')
                setInitialized(true)

                // Render demo scene initially
                console.log('[DEBUG] Rendering demo scene...')
                renderDemoScene()
            } catch (error: any) {
                console.error('[DEBUG] Graphics initialization error:', error)
                addTerminalOutput(`[Graphics] ✗ Error: ${error.message || error}`)
                setVMStatus('error')

                // Fallback to 2D context for error display
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.fillStyle = '#0a0a0f'
                    ctx.fillRect(0, 0, config.width, config.height)
                    ctx.fillStyle = '#ef4444'
                    ctx.font = '16px Inter, sans-serif'
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText('Graphics Engine Error', config.width / 2, config.height / 2 - 20)
                    ctx.fillStyle = '#75758a'
                    ctx.font = '14px Inter, sans-serif'
                    ctx.fillText('See console for details', config.width / 2, config.height / 2 + 10)
                }
            }
        }

        console.log('[DEBUG] PhonePreview mounted, initializing...')
        initializeGraphicsEngine()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Execute code when editor content changes (with debounce)
    useEffect(() => {
        if (!initialized || !editorContent) return

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
        if (initialized && currentScene) {
            renderScene(currentScene)
        }
    }, [device, initialized, currentScene]) // eslint-disable-line react-hooks/exhaustive-deps

    const executeUserCode = () => {
        try {
            console.log('[DEBUG] executeUserCode called')
            console.log('[DEBUG] Editor content length:', editorContent?.length)

            setVMStatus('building')
            addTerminalOutput(`[Runtime] Executing user code...`)

            const result = executeCode(editorContent, handleStateUpdate)

            console.log('[DEBUG] Execution result:', result)

            if (result.success && result.renderTree) {
                addTerminalOutput('[Runtime] ✓ Code executed successfully')
                setCurrentScene(result.renderTree)
                renderScene(result.renderTree)
                setVMStatus('ready')
            } else {
                console.error('[DEBUG] Execution failed:', result.error)
                addTerminalOutput(`[Runtime] ✗ ${result.error}`)
                setVMStatus('error')
            }
        } catch (error: any) {
            console.error('[DEBUG] Execution error:', error)
            addTerminalOutput(`[Runtime] ✗ ${error.message}`)
            setVMStatus('error')
        }
    }

    const handleStateUpdate = () => {
        // Re-execute code on state update
        const result = reExecute()
        if (result.success && result.renderTree) {
            setCurrentScene(result.renderTree)
            renderScene(result.renderTree)
        }
    }

    const renderDemoScene = () => {
        try {
            addTerminalOutput(`[Renderer] Rendering ${config.name} scene...`)

            clearCanvas('#0a0a0f')

            const scene = createDemoScene()
            scene.calculateLayout(config.width, config.height)
            scene.render()

            flush()

            addTerminalOutput('[Renderer] ✓ Scene rendered!')
            scene.destroy()
        } catch (error) {
            console.error('Render error:', error)
            addTerminalOutput(`[Renderer] ✗ Render error: ${error}`)
        }
    }

    const renderScene = (scene: RenderNode) => {
        try {
            clearCanvas('#0a0a0f')

            scene.calculateLayout(config.width, config.height)
            scene.render()

            flush()
        } catch (error) {
            console.error('Render error:', error)
            addTerminalOutput(`[Renderer] ✗ Render error: ${error}`)
        }
    }

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!currentScene) return

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        // Perform hit testing
        const hitNode = hitTest(currentScene, { x, y })

        if (hitNode && hitNode.onPress) {
            addTerminalOutput('[Event] Touch event fired')
            hitNode.onPress()
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
