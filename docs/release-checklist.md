# Release Checklist

## Package Names

- Confirm `@nestjs-audit-log/core` for the core package.
- Confirm `@nestjs-audit-log/testing` for testing helpers.
- Confirm `@nestjs-audit-log/typeorm`, `@nestjs-audit-log/mongoose`, and `@nestjs-audit-log/prisma`
  for the adapter packages.
- Confirm the whole package family is available or owned by the publishing account.

## Runtime Verification

- Run `pnpm install`.
- Run `pnpm lint` on Node 18.
- Run `pnpm typecheck` on Node 18.
- Run `pnpm test` on Node 18.
- Run `pnpm test:int` on Node 18.
- Run `pnpm build` on Node 18.
- Repeat the same verification on Node 20.
- Repeat the same verification on Node 22.

## NPM Auth

- Run `npm whoami`.
- Confirm the account has publish rights for the package scope.
- Confirm two-factor authentication requirements before publishing.

## Versioning And Changelog

- Choose the next SemVer version.
- Update `packages/core/package.json` when the core package changes.
- Update `packages/testing/package.json` when the testing helper package changes.
- Update `packages/typeorm/package.json`, `packages/mongoose/package.json`, and
  `packages/prisma/package.json` when the adapter packages change.
- Add a dated section to `CHANGELOG.md` with `Added`, `Changed`, `Fixed`, and `Removed` subsections
  as needed.
- Confirm `CHANGELOG.md` and package versions describe the same release.
- Confirm every published package has a package-level `README.md`.
- Confirm root docs and package READMEs use the same install commands.

## Publish

```bash
pnpm publish -r --access public
```

## GitHub Release

- Push the release commit and tags.
- Create a GitHub release from the generated tag.
- Include install instructions, quick start, supported adapters, and migration notes.
