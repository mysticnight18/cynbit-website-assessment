# Cynbit website reimagining

A responsive Cynbit website concept with a small Node.js inquiry API. It uses only Node built-ins and has no package install step.

## Run locally

```sh
npm start
```

Open [http://localhost:3000](http://localhost:3000). The server listens on `127.0.0.1` by default. Set `PORT` to choose a different port.

## What is included

- Responsive home page with service descriptions, engagement steps, BitElevate information and an inquiry form.
- Custom privacy notice and terms pages at `/privacy` and `/terms`.
- Custom SVG favicon and original SVG systems illustration.
- `POST /api/inquiries` with server-side validation, size limits, a honeypot, basic per-IP rate limiting and JSON file persistence.
- `GET /api/health` health endpoint.

Submitted inquiries are stored in `data/inquiries.json`, which is excluded from version control. For a public deployment, replace the local JSON store with an access-controlled database, configure HTTPS and durable backups, and set an explicit retention process. The form does not send email automatically.
