import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { useAppStore } from '@/store/useAppStore'
import './CodeEditor.css'

function CodeEditor() {
  const currentFile = useAppStore((state) => state.currentFile)
  const editorContent = useAppStore((state) => state.editorContent)
  const setEditorContent = useAppStore((state) => state.setEditorContent)
  const updateFileContent = useAppStore((state) => state.updateFileContent)
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value)
      if (currentFile) {
        updateFileContent(currentFile, value)
      }
    }
  }

  useEffect(() => {
    // Load default file content when no file is selected
    if (!currentFile) {
      setEditorContent(`import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Hello, Phantom! 🌙</Text>
        <View 
          style={styles.button} 
          onPress={() => setCount(count + 1)}
        >
          <Text style={styles.buttonText}>
            Clicks: {count}
          </Text>
        </View>
        <Text style={styles.subtitle}>
          Click the button to test interactivity!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 300,
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a78bfa',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#a8a8b8',
    textAlign: 'center',
  },
});
`)
    }
  }, [currentFile, setEditorContent])

  return (
    <div className="code-editor-container">
      {currentFile && (
        <div className="editor-tab">
          <span className="tab-icon">📄</span>
          <span className="tab-name">{currentFile.split('/').pop()}</span>
        </div>
      )}
      <div className="editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          language="typescript"
          theme="vs-dark"
          value={editorContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Consolas', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 16, bottom: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
          }}
        />
      </div>
    </div>
  )
}

export default CodeEditor
