import { create } from 'zustand'

export type VMStatus = 'idle' | 'booting' | 'ready' | 'building' | 'error'
export type BuildStatus = 'idle' | 'building' | 'success' | 'failed'

interface FileNode {
    name: string
    type: 'file' | 'directory'
    path: string
    content?: string
    children?: FileNode[]
}

interface AppState {
    // VM State
    vmStatus: VMStatus
    vmError: string | null
    setVMStatus: (status: VMStatus, error?: string) => void

    // Build State
    buildStatus: BuildStatus
    buildError: string | null
    setBuildStatus: (status: BuildStatus, error?: string) => void

    // File System
    currentFile: string | null
    fileTree: FileNode[]
    setCurrentFile: (path: string | null) => void
    setFileTree: (tree: FileNode[]) => void
    updateFileContent: (path: string, content: string) => void

    // Editor State
    editorContent: string
    setEditorContent: (content: string) => void

    // Terminal Output
    terminalOutput: string[]
    addTerminalOutput: (output: string) => void
    clearTerminal: () => void

    // Preview State
    canvasReady: boolean
    setCanvasReady: (ready: boolean) => void

    // Run trigger
    runTrigger: number
    triggerRun: () => void
}

export const useAppStore = create<AppState>((set) => ({
    // VM State
    vmStatus: 'idle',
    vmError: null,
    setVMStatus: (status, error) =>
        set({ vmStatus: status, vmError: error || null }),

    // Build State
    buildStatus: 'idle',
    buildError: null,
    setBuildStatus: (status, error) =>
        set({ buildStatus: status, buildError: error || null }),

    // File System
    currentFile: null,
    fileTree: [],
    setCurrentFile: (path) => set({ currentFile: path }),
    setFileTree: (tree) => set({ fileTree: tree }),
    updateFileContent: (path, content) =>
        set((state) => ({
            fileTree: updateTreeContent(state.fileTree, path, content)
        })),

    // Editor State
    editorContent: '',
    setEditorContent: (content) => set({ editorContent: content }),

    // Terminal Output
    terminalOutput: [],
    addTerminalOutput: (output) =>
        set((state) => ({
            terminalOutput: [...state.terminalOutput, output]
        })),
    clearTerminal: () => set({ terminalOutput: [] }),

    // Preview State
    canvasReady: false,
    setCanvasReady: (ready) => set({ canvasReady: ready }),

    // Run trigger
    runTrigger: 0,
    triggerRun: () => set((state) => ({ runTrigger: state.runTrigger + 1 })),
}))

// Helper function to update file content in tree
function updateTreeContent(
    tree: FileNode[],
    path: string,
    content: string
): FileNode[] {
    return tree.map((node) => {
        if (node.path === path && node.type === 'file') {
            return { ...node, content }
        }
        if (node.children) {
            return {
                ...node,
                children: updateTreeContent(node.children, path, content)
            }
        }
        return node
    })
}
