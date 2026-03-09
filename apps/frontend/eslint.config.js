import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'vitest.config.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Prevent console statements (allow warn/error for production debugging)
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Prevent any types
      '@typescript-eslint/no-explicit-any': 'error',

      // React Refresh
      'react-refresh/only-export-components': 'off',

      // React Hooks
      ...reactHooks.configs.recommended.rules,

      // TypeScript strict checks (warnings to allow gradual improvement)
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Code quality
      'prefer-const': 'error',
      'no-var': 'error',
    },
  }
);
