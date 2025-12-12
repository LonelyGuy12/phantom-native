/**
 * Babel Transformer
 * 
 * Transforms JSX/TypeScript code to JavaScript using Babel standalone
 */

// @ts-ignore - Babel standalone doesn't have perfect types
import * as Babel from '@babel/standalone'

let babelInitialized = false

export function initBabel() {
    if (babelInitialized) return

    // Register presets
    // Babel.registerPreset is not needed for built-in presets
    babelInitialized = true
    console.log('✓ Babel initialized')
}

export interface TransformResult {
    code: string
    error?: string
}

export function transformCode(sourceCode: string): TransformResult {
    try {
        initBabel()

        const result = Babel.transform(sourceCode, {
            presets: ['react', 'typescript'],
            filename: 'App.tsx',
            plugins: [],
        })

        if (!result.code) {
            return {
                code: '',
                error: 'Transform produced no code'
            }
        }

        return {
            code: result.code
        }
    } catch (error: any) {
        return {
            code: '',
            error: error.message || String(error)
        }
    }
}

/**
 * Wrap transformed code to provide React Native environment
 */
export function wrapCode(transformedCode: string): string {
    return `
    (function() {
      // Mock require for react-native
      const require = (moduleName) => {
        if (moduleName === 'react') {
          return window.__REACT__;
        }
        if (moduleName === 'react-native') {
          return window.__REACT_NATIVE__;
        }
        throw new Error('Module not found: ' + moduleName);
      };
      
      const exports = {};
      const module = { exports };
      
      ${transformedCode}
      
      return module.exports.default || module.exports;
    })()
  `
}
