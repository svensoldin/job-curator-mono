// @ts-check

import eslint from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...pluginQuery.configs['flat/recommended'],
  globalIgnores(['.next', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    plugins: {
      prettier: require('eslint-plugin-prettier'),
    },
    extends: ['plugin:prettier/recommended', 'prettier'],
    rules: {
      'prettier/prettier': 'error',
    },
  }
);
