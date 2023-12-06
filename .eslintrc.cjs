module.exports = {
  env: {
    browser: true,
    es2024: true,
  },
  extends: [
    // 'eslint:all',
    // 'plugin:react/all',
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
    'plugin:react-hooks/recommended',
    'plugin:functional/external-vanilla-recommended',
    'plugin:functional/recommended',
    'plugin:functional/stylistic',
    'plugin:promise/recommended',
  ],
  ignorePatterns: ['node_modules', 'dist', 'amplify'],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['promise', 'functional', 'unicorn', '@typescript-eslint', 'react', 'prettier'],
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'functional/functional-parameters': 'off',
    'functional/no-expression-statements': 'off',
    'functional/no-return-void': 'off',
    'functional/immutable-data': ['error', { ignoreNonConstDeclarations: true }],
  },
}
