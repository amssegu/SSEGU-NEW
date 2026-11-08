# Continuous Integration

GitHub Actions runs the baseline checks for pushes to `main` and pull requests:

1. `npm ci`
2. `npm run lint`
3. `npm run check`
4. `npm test`
5. `npm run validate:content` (collection boundaries, references, media metadata and fixture checks)
6. `npm run build`
7. `npm run test:e2e`

The protected `main` branch should require the completed `quality` job before merge. The workflow contains no secrets and uses read-only repository permissions.
