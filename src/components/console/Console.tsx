import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import './Console.css'

function Console() {
    const terminalOutput = useAppStore((state) => state.terminalOutput)
    const addTerminalOutput = useAppStore((state) => state.addTerminalOutput)
    const outputRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Auto-scroll to bottom when new output is added
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
    }, [terminalOutput])

    useEffect(() => {
        // Add welcome message
        addTerminalOutput('🌙 Phantom-Native Console')
        addTerminalOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        addTerminalOutput('[System] Ready')
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const formatLine = (line: string) => {
        // Color-code different types of messages
        if (line.includes('✓') || line.toLowerCase().includes('success')) {
            return <span style={{ color: '#3fb950' }}>{line}</span>
        }
        if (line.includes('✗') || line.toLowerCase().includes('error')) {
            return <span style={{ color: '#f85149' }}>{line}</span>
        }
        if (line.includes('[Graphics]')) {
            return <span style={{ color: '#79c0ff' }}>{line}</span>
        }
        if (line.includes('[Runtime]')) {
            return <span style={{ color: '#d2a8ff' }}>{line}</span>
        }
        if (line.includes('[Renderer]')) {
            return <span style={{ color: '#ffa657' }}>{line}</span>
        }
        if (line.includes('[Event]')) {
            return <span style={{ color: '#f778ba' }}>{line}</span>
        }
        return line
    }

    return (
        <div className="console-content" ref={outputRef}>
            {terminalOutput.length === 0 ? (
                <div className="console-empty">No logs yet...</div>
            ) : (
                terminalOutput.map((line, index) => (
                    <div key={index} className="console-line">
                        <span style={{ color: '#8b949e', marginRight: '8px' }}>›</span>
                        {formatLine(line)}
                    </div>
                ))
            )}
        </div>
    )
}

export default Console
