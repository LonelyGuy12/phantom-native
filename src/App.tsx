import { useEffect, useState } from 'react'
import CodeEditor from './components/editor/CodeEditor'
import PhonePreview from './components/preview/PhonePreview'
import FileTree from './components/filesystem/FileTree'
import Console from './components/console/Console'
import { useAppStore } from './store/useAppStore'
import './App.css'

type DeviceType = 'ios' | 'android' | 'web'
type Theme = 'dark' | 'light'

function App() {
    const vmStatus = useAppStore((state) => state.vmStatus)
    const setVMStatus = useAppStore((state) => state.setVMStatus)
    const triggerRun = useAppStore((state) => state.triggerRun)
    const [device, setDevice] = useState<DeviceType>('ios')
    const [theme, setTheme] = useState<Theme>('dark')
    const [showConsole, setShowConsole] = useState(true)

    useEffect(() => {
        console.log('🌙 Phantom-Native starting...')
        setVMStatus('idle')
    }, [setVMStatus])

    return (
        <div className={`app-container theme-${theme}`}>
            {/* Top Navigation */}
            <header className="app-navbar">
                <div className="navbar-left">
                    <div className="app-logo">
                        <span className="logo-icon">🌙</span>
                        <span className="logo-text">Phantom Native</span>
                    </div>
                    <div className="project-name">
                        <input
                            type="text"
                            defaultValue="My RN Project"
                            className="project-name-input"
                        />
                    </div>
                </div>

                <div className="navbar-center">
                    <div className="device-selector">
                        <button
                            className={`device-btn ${device === 'ios' ? 'active' : ''}`}
                            onClick={() => setDevice('ios')}
                        >
                            <span className="device-icon">📱</span>
                            iOS
                        </button>
                        <button
                            className={`device-btn ${device === 'android' ? 'active' : ''}`}
                            onClick={() => setDevice('android')}
                        >
                            <span className="device-icon">🤖</span>
                            Android
                        </button>
                        <button
                            className={`device-btn ${device === 'web' ? 'active' : ''}`}
                            onClick={() => setDevice('web')}
                        >
                            <span className="device-icon">🌐</span>
                            Web
                        </button>
                    </div>
                </div>

                <div className="navbar-right">
                    <button className="nav-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button className="nav-btn primary" onClick={triggerRun}>
                        ▶️ Run
                    </button>
                    <button className="nav-btn">
                        💾 Save
                    </button>
                    <button className="nav-btn">
                        🔗 Share
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="app-workspace">
                {/* Left Panel - File Explorer */}
                <aside className="panel-files">
                    <div className="panel-header">
                        <span className="panel-title">Files</span>
                        <div className="panel-actions">
                            <button className="icon-btn" title="New file">+📄</button>
                            <button className="icon-btn" title="New folder">+📁</button>
                        </div>
                    </div>
                    <FileTree />
                </aside>

                {/* Center Panel - Editor */}
                <section className="panel-editor">
                    <CodeEditor />
                </section>

                {/* Right Panel - Preview */}
                <aside className="panel-preview">
                    <div className="preview-header">
                        <span className="preview-title">Preview</span>
                        <div className={`status-badge status-${vmStatus}`}>
                            {vmStatus}
                        </div>
                    </div>
                    <PhonePreview device={device} />
                </aside>
            </main>

            {/* Bottom Panel - Console */}
            {showConsole && (
                <footer className="app-console">
                    <div className="console-header">
                        <div className="console-tabs">
                            <button className="console-tab active">Logs</button>
                            <button className="console-tab">Problems</button>
                        </div>
                        <button
                            className="console-close"
                            onClick={() => setShowConsole(false)}
                        >
                            ✕
                        </button>
                    </div>
                    <Console />
                </footer>
            )}

            {/* Console Toggle */}
            {!showConsole && (
                <button
                    className="console-toggle"
                    onClick={() => setShowConsole(true)}
                >
                    📋 Show Console
                </button>
            )}
        </div>
    )
}

export default App
