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
            presets: [
                'react',
                'typescript',
                // Transform ES modules to CommonJS so we can handle them
                ['env', {
                    modules: 'commonjs',
                    targets: { esmodules: true }
                }]
            ],
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
export function wrapCode(code: string): string {
    return `
    (function() {
      const React = self.__REACT__;
      const { View, Text, StyleSheet, useState, useEffect } = self.__REACT_NATIVE__;
      
      // Provide CommonJS exports (needed for Babel's module transformation)
      const exports = {};
      const module = { exports: exports };
      
      // Provide require function for CommonJS imports
      const require = (moduleName) => {
        if (moduleName === 'react') {
          return React;
        }
        if (moduleName === 'react-native') {
          return { View, Text, StyleSheet, useState, useEffect };
        }
        throw new Error('Module not found: ' + moduleName);
      };
      
      ${code}
      
      // Return the default export or App
      return module.exports.default || module.exports.App || module.exports || App;
    })()
  `
}
