# Comunicaciones Baseball

Sitio oficial bilingue del equipo Comunicaciones, construido con Next.js y una capa de administracion lista para integrarse con Supabase.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase (schema en `sql/schema.sql`)
- Panel admin con login por email y contrasena

## Desarrollo local

1. Copia `.env.example` a `.env.local`.
2. Configura `SESSION_SECRET`.
3. Agrega las credenciales de Supabase.
4. Crea un usuario en Supabase Auth y luego registra su `user_id` en la tabla `admins` con `is_active = true`.
4. Instala dependencias y ejecuta:

```bash
npm install
npm run dev
```

## Modo seed

Si Supabase no devuelve contenido, el sitio publico usa datos demo definidos en [data/site-content.ts](/Users/oswaldohernandez/Documents/New project 2/data/site-content.ts). El login admin ya no usa variables locales: solo funciona con Supabase Auth y la tabla `admins`.

## Supabase

Aplica el SQL de [schema.sql](/Users/oswaldohernandez/Documents/New project 2/sql/schema.sql) en tu proyecto de Supabase y luego completa:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Si quieres cargar de una vez el contenido demo actual en la base:

```bash
npm run seed:supabase
```

Una vez configuradas las variables, la web publica deja de leer solamente [data/site-content.ts](/Users/oswaldohernandez/Documents/New project 2/data/site-content.ts) y pasa a consultar Supabase desde [lib/content.ts](/Users/oswaldohernandez/Documents/New project 2/lib/content.ts). Si la base esta vacia o falla la conexion, mantiene fallback al seed local.

## Rutas principales

- `/es` y `/en`
- `/[locale]/roster`
- `/[locale]/games`
- `/[locale]/feed`
- `/[locale]/gallery`
- `/[locale]/about`
- `/[locale]/admin`
