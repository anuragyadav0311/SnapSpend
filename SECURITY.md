# Security Policy

## Supported Versions

Security fixes are targeted at the latest version of the `main` branch unless a maintainer announces support for release branches.

## Reporting a Vulnerability

Please do not open a public issue for security vulnerabilities.

Report privately to the maintainers with:

- A clear description of the issue.
- Steps to reproduce or a proof of concept.
- Affected files, endpoints, or configuration.
- Potential impact.
- Any suggested mitigation.

If this project is hosted in a public repository, use the repository's private vulnerability reporting feature when available. Otherwise, contact the project owner or maintainers directly.

## Handling Expectations

Maintainers should acknowledge valid reports as soon as practical, investigate the issue, prepare a fix, and coordinate disclosure once users have a reasonable path to update.

## Security Guidelines for Contributors

- Never commit `.env` files, API keys, OAuth secrets, private keys, database dumps, access tokens, or refresh tokens.
- Keep `DEBUG=False` in production.
- Set a strong `SECRET_KEY` for deployed environments.
- Restrict `ALLOWED_HOSTS`, CORS origins, and CSRF trusted origins to known hosts.
- Use HTTPS for production frontend and backend deployments.
- Keep dependencies updated and review security advisories.
- Validate uploaded receipt images and avoid trusting OCR output without server-side validation.
- Treat exported finance reports as sensitive personal data.

## Known Sensitive Areas

- JWT refresh token rotation and logout blacklisting.
- OAuth callback configuration.
- Receipt upload and OCR processing.
- Report export endpoints.
- Production database and media storage configuration.
