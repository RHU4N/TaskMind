import js from '@eslint/js';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'stitch_extracted/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}', 'api/**/*.js', 'server.js'],
    plugins: { react, 'react-hooks': hooks },
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', fetch: 'readonly', localStorage: 'readonly', document: 'readonly', window: 'readonly', URL: 'readonly', Blob: 'readonly', process: 'readonly' } },
    settings: { react: { version: 'detect' } },
    rules: { ...hooks.configs.recommended.rules, 'react/react-in-jsx-scope': 'off', 'react/jsx-uses-vars': 'error', 'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }] },
  },
];
