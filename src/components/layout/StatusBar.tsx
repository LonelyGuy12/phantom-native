import { useAppStore } from '@/store/useAppStore'
import './StatusBar.css'

function StatusBar() {
    const vmStatus = useAppStore((state) => state.vmStatus)
    const buildStatus = useAppStore((state) => state.buildStatus)
    const currentFile = useAppStore((state) => state.currentFile)

    const getStatusColor = () => {
        if (vmStatus === 'error') return 'var(--accent-red)'
        if (vmStatus === 'ready') return 'var(--accent-green)'
        if (vmStatus === 'booting' || vmStatus === 'building') return 'var(--accent-blue)'
        return 'var(--text-tertiary)'
    }

    return (
        <div className="status-bar">
            <div className="status-section">
                <span className="status-item">
                    <span className="status-dot" style={{ background: getStatusColor() }}></span>
                    VM: {vmStatus}
                </span>
                {buildStatus !== 'idle' && (
                    <span className="status-item">
                        Build: {buildStatus}
                    </span>
                )}
            </div>
            <div className="status-section status-right">
                {currentFile && (
                    <span className="status-item">
                        {currentFile}
                    </span>
                )}
                <span className="status-item">
                    Phantom-Native v1.0.0-alpha
                </span>
            </div>
        </div>
    )
}

export default StatusBar
