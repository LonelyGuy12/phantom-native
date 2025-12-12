import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import path from 'path'

export default defineConfig({
    plugins: [
        wasm(),
        topLevelAwait(),
        react(),
    ],

    server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
    },

    preview: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
    },

    optimizeDeps: {
        exclude: ['yoga-wasm-web', 'canvaskit-wasm'],
        esbuildOptions: {
            target: 'esnext',
        },
    },

    build: {
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: {
                    'monaco': ['@monaco-editor/react'],
                    'graphics': ['canvaskit-wasm', 'yoga-wasm-web'],
                },
            },
        },
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@core': path.resolve(__dirname, './src/core'),
            '@components': path.resolve(__dirname, './src/components'),
            '@store': path.resolve(__dirname, './src/store'),
        },
    },

    assetsInclude: ['**/*.wasm'],

    worker: {
        format: 'es',
        plugins: () => [wasm(), topLevelAwait()],
    },
})
