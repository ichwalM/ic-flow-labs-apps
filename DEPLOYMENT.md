# Deployment status

Phase 4 dapat dibangun sebagai Next.js app:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm start
```

Start/development default bind loopback 127.0.0.1:3000. Port dapat diubah melalui argumen Next.js pada package web. Tidak ada deployment eksternal yang dilakukan.

Docker Compose web/API/PostgreSQL, Prisma migrations, reverse proxy HTTPS, CI deployment, secrets management, backup/restore, observability dan staging adalah deliverable fase persistence/hardening. Jangan menganggap prototype memiliki auth, cloud autosave, atau production isolation. Hosting origin baru berarti local draft berbeda; gunakan JSON untuk memindahkan project.
