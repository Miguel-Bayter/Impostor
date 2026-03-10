module.exports = {
  'apps/backend/**/*.ts': ['pnpm -w exec eslint --fix', 'pnpm -w exec prettier --write'],
  'apps/frontend/**/*.{ts,tsx}': ['pnpm -w exec eslint --fix', 'pnpm -w exec prettier --write'],
  '*.{json,md,css,scss,html,yml,yaml}': ['pnpm -w exec prettier --write'],
};
