import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import './FileTree.css'

interface FileNode {
    name: string
    type: 'file' | 'directory'
    path: string
    children?: FileNode[]
}

// Mock file tree (will be replaced with real data from WebContainer)
const mockFileTree: FileNode[] = [
    {
        name: 'src',
        type: 'directory',
        path: '/src',
        children: [
            { name: 'App.tsx', type: 'file', path: '/src/App.tsx' },
            { name: 'index.tsx', type: 'file', path: '/src/index.tsx' },
            {
                name: 'components',
                type: 'directory',
                path: '/src/components',
                children: [
                    { name: 'Button.tsx', type: 'file', path: '/src/components/Button.tsx' },
                    { name: 'Screen.tsx', type: 'file', path: '/src/components/Screen.tsx' },
                ],
            },
        ],
    },
    { name: 'package.json', type: 'file', path: '/package.json' },
    { name: 'tsconfig.json', type: 'file', path: '/tsconfig.json' },
]

function FileTreeNode({ node, level = 0 }: { node: FileNode; level?: number }) {
    const [expanded, setExpanded] = useState(level === 0)
    const currentFile = useAppStore((state) => state.currentFile)
    const setCurrentFile = useAppStore((state) => state.setCurrentFile)

    const isDirectory = node.type === 'directory'
    const isActive = currentFile === node.path

    const handleClick = () => {
        if (isDirectory) {
            setExpanded(!expanded)
        } else {
            setCurrentFile(node.path)
        }
    }

    const icon = isDirectory ? (expanded ? '📂' : '📁') : '📄'

    return (
        <div className="tree-node">
            <div
                className={`tree-node-label ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={handleClick}
            >
                <span className="node-icon">{icon}</span>
                <span className="node-name">{node.name}</span>
            </div>
            {isDirectory && expanded && node.children && (
                <div className="tree-children">
                    {node.children.map((child, index) => (
                        <FileTreeNode key={child.path + index} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

function FileTree() {
    const fileTree = useAppStore((state) => state.fileTree)
    const displayTree = fileTree.length > 0 ? fileTree : mockFileTree

    return (
        <div className="file-tree-container">
            <div className="tree-content">
                {displayTree.map((node, index) => (
                    <FileTreeNode key={node.path + index} node={node} level={0} />
                ))}
            </div>
            <div className="tree-footer">
                <button className="tree-action-btn" title="New File">
                    <span>+📄</span>
                </button>
                <button className="tree-action-btn" title="New Folder">
                    <span>+📁</span>
                </button>
                <button className="tree-action-btn" title="Refresh">
                    <span>🔄</span>
                </button>
            </div>
        </div>
    )
}

export default FileTree
