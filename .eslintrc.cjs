module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off'
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.web.json', './tsconfig.node.json']
      }
    }
  }
}
