# QFit

Workspace local con tres piezas que pueden vivir en repos separados:

```text
backend      API NestJS, base de datos, auth, negocios y playlists
frontend     Web app Next.js para owner, cliente, QR publico y player
orquestador  Docker Compose, scripts y CI/CD del stack completo
```

Los archivos que levantan o compilan todo el stack estan en `orquestador`.

## Prender el proyecto completo

```bash
cd orquestador
docker compose -f docker-compose.dev.yml up --build --watch
```

URLs locales:

```text
Backend  http://localhost:3000
Frontend http://localhost:3001
```

Para produccion local:

```bash
cd orquestador
copy .env.example .env
docker compose up -d --build
```

Mas detalles en `orquestador/README.md`.
# musica
# musica
