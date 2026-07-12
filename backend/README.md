# QFit Backend

Backend NestJS para playlists colaborativas por negocio.

El owner global crea negocios/clientes. Cada negocio tiene un usuario propio y puede administrar una o varias playlists. Cada playlist puede publicarse por QR para que los usuarios agreguen canciones con links de YouTube.

## Stack

- NestJS + TypeScript
- PostgreSQL
- TypeORM con migraciones
- JWT para administrador
- Docker para desarrollo y despliegue
- GitHub Actions para CI/CD

## Ambientes

Los valores locales estan en `.env.development`. Para produccion, usar `.env.production.example` como plantilla y configurar secretos reales en el proveedor de deploy.

Variables principales:

```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cola_gym
DB_PASSWORD=cola_gym
DB_DATABASE=cola_gym
DB_SSL=false
DB_SYNCHRONIZE=false
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=owner@cola-gym.local
ADMIN_PASSWORD=owner123456
```

En produccion mantener `DB_SYNCHRONIZE=false` y correr migraciones.

## Desarrollo Local

```bash
npm install
docker compose up -d postgres
npm run db:migrate
npm run start:dev
```

API local: `http://localhost:3000`.

El primer owner se crea automaticamente al iniciar la app si no existe ningun usuario owner, usando `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

## Produccion

1. Crear una base PostgreSQL.
2. Configurar variables de entorno de `.env.production.example`.
3. Ejecutar migraciones:

```bash
npm run db:migrate
```

4. Levantar la app:

```bash
npm run start:prod
```

Tambien se incluye `Dockerfile` para desplegar la imagen:

```bash
docker build -t cola-gym .
docker run --env-file .env.production -p 3000:3000 cola-gym
```

## CI/CD

El workflow `.github/workflows/ci-cd.yml`:

- Levanta PostgreSQL como servicio.
- Instala dependencias con `npm ci`.
- Corre migraciones.
- Ejecuta lint, tests, e2e y build.
- En pushes a `main` o `master`, construye y publica imagen Docker en GitHub Container Registry.

Para desplegar automaticamente desde GHCR, conectar el proveedor elegido a la imagen:

```text
ghcr.io/<owner>/<repo>:latest
```

## Autenticacion

El mismo endpoint sirve para owner y cliente.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "owner@cola-gym.local",
  "password": "owner123456"
}
```

Respuesta:

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresIn": "8h"
}
```

Usar el token en endpoints privados:

```http
Authorization: Bearer <accessToken>
```

## Flujo Owner

El owner crea un negocio y el usuario cliente que lo administrara.

```http
POST /owner/businesses
Authorization: Bearer <ownerToken>
Content-Type: application/json

{
  "name": "Gym Centro",
  "slug": "gym-centro",
  "userEmail": "admin@gymcentro.com",
  "userPassword": "password-segura",
  "defaultQueueName": "Principal"
}
```

Respuesta relevante:

```json
{
  "business": {
    "id": "...",
    "slug": "gym-centro"
  },
  "user": {
    "email": "admin@gymcentro.com",
    "role": "client"
  },
  "defaultQueue": {
    "id": "...",
    "slug": "gym-centro-principal"
  }
}
```

Mas endpoints owner:

```http
GET /owner/businesses
POST /owner/businesses/:businessId/playlists
```

## Flujo Cliente

El cliente inicia sesion con el usuario creado por el owner y puede gestionar sus playlists.

```http
GET /client/playlists
POST /client/playlists
```

Body para crear una playlist:

```json
{
  "name": "Musculacion",
  "slug": "gym-centro-musculacion"
}
```

## Endpoints Publicos

```http
GET /playlists/:queueIdOrSlug
POST /playlists/:queueIdOrSlug/canciones
```

Body para agregar cancion:

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

Si el video ya existe en la playlist activa, suma un voto y mejora su prioridad.

## Endpoints Admin

Owner y cliente pueden controlar una playlist. El cliente solo puede controlar playlists de su negocio.

```http
GET /admin/playlists/:queueId
POST /admin/playlists/:queueId/siguiente
PATCH /admin/playlists/:queueId/reproduccion
PATCH /admin/playlists/:queueId/canciones/:id/prioridad
DELETE /admin/playlists/:queueId/canciones/:id
POST /admin/playlists/:queueId/reiniciar
```

Ejemplos:

```json
{
  "status": "paused"
}
```

```json
{
  "manualPriority": 5
}
```

## Reglas de Prioridad

1. Cancion actualmente en reproduccion.
2. `votes + manualPriority`.
3. Fecha de pedido mas antigua.

## Canciones

Al agregar canciones, el backend solo valida que el link pertenezca a YouTube y
extrae el `videoId`. No analiza la letra, duracion ni metadatos externos, para
que el alta sea rapida y no dependa de APIs de terceros.

## Tests

```bash
npm test
npm run test:e2e
npm run build
```

Para e2e hace falta PostgreSQL levantado y migrado.
