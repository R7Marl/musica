# Marl Music Queue Frontend

Frontend Next.js para operar negocios con subdominios.

Ejemplo productivo:

```text
urbanfit.marl.com
```

El subdominio `urbanfit` se usa como slug del negocio y el frontend consulta:

```http
GET /public/businesses/urbanfit
```

## Desarrollo

Crear `.env.local` usando `.env.local.example`:

```bash
NEXT_PUBLIC_API_URL=auto
NEXT_PUBLIC_ROOT_DOMAIN=marl.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Ejecutar:

```bash
npm run dev
```

Rutas principales:

- `/`: resuelve subdominio o muestra acceso general.
- `/owner`: panel del owner para crear negocios.
- `/dashboard`: panel del cliente para crear playlists.
- `/q/:queueSlug`: vista publica de una playlist para QR.
- `/player/:queueId`: reproductor de la PC principal.

En local, como no hay subdominio real, la home permite escribir el slug del negocio para probar.

## Google Login

Los usuarios finales deben iniciar sesion con Google antes de agregar canciones.

Configurar en Google Cloud Console un OAuth Client web con estos origins:

```text
http://localhost:3001
http://192.168.1.36:3001
```

Usar el mismo client id en frontend y backend.
