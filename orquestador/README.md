# Orquestador

Este directorio contiene todo lo que levanta el stack completo de QFit:

```text
docker-compose.dev.yml  Desarrollo con Postgres, backend y frontend
docker-compose.yml      Produccion local/servidor
.env.example            Variables para produccion
scripts/                Atajos PowerShell sobre Docker Compose
.github/workflows/      CI/CD cuando este directorio sea su propio repo
```

`backend` y `frontend` quedan como proyectos separados. Desde aca los Compose los
referencian con `../backend` y `../frontend`.

## Desarrollo

Desde `orquestador`:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Para trabajar con cambios en vivo:

```bash
docker compose -f docker-compose.dev.yml up --build --watch
```

Tambien podes usar el script:

```powershell
.\scripts\dev.ps1
```

Servicios:

```text
Backend  http://localhost:3000
Frontend http://localhost:3001
Postgres localhost:5433
```

## Base de datos local

Aplicar migraciones dentro del contenedor backend:

```bash
docker compose -f docker-compose.dev.yml exec backend npm run db:migrate
```

Atajo PowerShell:

```powershell
.\scripts\db-migrate.ps1
```

Resetear la base local completa:

```powershell
.\scripts\db-reset.ps1
```

Dropear solo el schema local:

```powershell
.\scripts\db-drop.ps1
```

`db:reset` y `db:drop` son para desarrollo. No los uses contra una base real con
datos importantes.

## Produccion

Preparar variables:

```powershell
copy .env.example .env
```

Editar `.env` con secretos reales y levantar:

```bash
docker compose up -d --build
```

O con el script:

```powershell
.\scripts\prod.ps1
```

Para apagar:

```bash
docker compose down
```

O:

```powershell
.\scripts\prod-down.ps1
```

El backend corre migraciones automaticamente antes de iniciar la API. No hace
falta instalar dependencias en el host para levantar produccion: Docker las
instala dentro de las imagenes.

## Dominios

En produccion, Caddy expone HTTPS automatico:

```text
https://hierroexpress.com.uy          frontend
https://backend.hierroexpress.com.uy  backend
```

Los DNS deben apuntar al VPS:

```text
A hierroexpress.com.uy          51.222.28.59
A backend.hierroexpress.com.uy  51.222.28.59
```

Abrir puertos 80 y 443 en el firewall del servidor/proveedor.
