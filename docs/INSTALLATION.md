# Instalación y configuración de Café Paraíso

Esta guía permite ejecutar el proyecto con Supabase local o conectarlo a un proyecto propio de Supabase.com. Está diseñada para una instalación nueva y no requiere editar el código de configuración del frontend.

La fuente reproducible de la base de datos es `supabase/migrations/` junto con `supabase/seed.sql`.

## 1. Requisitos

### Comunes

- Git.
- Node.js 20 o posterior.
- npm 10 o posterior.
- Un navegador moderno.

### Supabase local

- Docker Desktop o Docker Engine iniciado.
- Recursos suficientes para los contenedores de Supabase.

No es necesario instalar Supabase CLI globalmente. `npm ci` instala la versión registrada en `package-lock.json` y los scripts usan esa copia local.

### Supabase.com

- Una cuenta de Supabase.
- Un proyecto propio, preferiblemente nuevo para la primera instalación.
- Permisos para vincular la CLI, aplicar migraciones y configurar Auth.
- Un hosting de archivos estáticos capaz de ejecutar el paso de configuración antes de publicar el artefacto.

## 2. Clonar el repositorio

La URL pública definitiva se añadirá antes de la publicación. Hasta entonces, sustituye los placeholders:

```bash
git clone <repository-url>
cd <repository-folder>
```

## 3. Instalar dependencias

```bash
npm ci
```

`npm ci` instala exactamente las versiones registradas en `package-lock.json`, incluida Supabase CLI 2.118.0. `node_modules/` permanece fuera de Git.

## 4. Levantar Supabase local

Inicia Docker y, desde la raíz del repositorio, ejecuta:

```bash
npm run supabase:start
```

El script:

1. ejecuta la Supabase CLI local con telemetría desactivada para esa sesión;
2. inicia o reutiliza los servicios Docker del proyecto;
3. aplica las migraciones y el seed cuando corresponde;
4. consulta mediante salida JSON la URL y la clave pública locales;
5. genera `services/config/runtime-config.js`.

La configuración local predeterminada usa:

- API de Supabase: `http://127.0.0.1:54321`;
- PostgreSQL: puerto `54322`;
- Supabase Studio: `http://127.0.0.1:54323`;
- servidor local de correo: `http://127.0.0.1:54324`;
- frontend: `http://localhost:3000`.

No copies manualmente claves locales: el script obtiene únicamente la configuración pública necesaria.

### Estado inicial esperado

Una reconstrucción limpia contiene:

| Recurso | Cantidad |
|---|---:|
| Tablas de aplicación en `public` | 11 |
| Filas en `business_settings` | 1 |
| Categorías de producto | 4 |
| Productos | 0 |
| Usuarios Auth y perfiles | 0 |
| Pedidos, carritos, direcciones y mensajes | 0 |
| Candidaturas y notificaciones | 0 |
| Buckets | 3 |
| Objetos Storage | 0 |

Las categorías iniciales son Cafés, Infusiones, Chocolates y Complementos. No se cargan productos ficticios ni datos personales.

## 5. Iniciar el frontend

En otra terminal:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

El proyecto debe servirse por HTTP porque los componentes se cargan mediante `fetch`. Abrir los HTML directamente con `file://` no está soportado.

Para detener el entorno:

1. pulsa `Ctrl+C` en la terminal del servidor web;
2. ejecuta `npm run supabase:stop`.

Detener Supabase no elimina la base local.

## 6. Reconstruir la base local

```bash
npm run db:reset
```

Este comando ejecuta `supabase db reset --local`: elimina los datos de la base **local**, vuelve a aplicar `supabase/migrations/` y ejecuta `supabase/seed.sql`.

Es destructivo para el entorno local. No actúa automáticamente sobre un proyecto Supabase.com.

La fuente oficial es:

```text
supabase/
├── config.toml
├── migrations/
│   └── 20260926084950_remote_schema.sql
└── seed.sql
```

Para cambios futuros, crea una migración nueva en lugar de modificar una migración que ya se haya aplicado.

## 7. Configuración runtime

El navegador no lee `.env` directamente. La configuración sigue este flujo:

```text
.env o Supabase local
        │
        ▼
scripts/configure.js
        │
        ▼
services/config/runtime-config.js
        │
        ▼
services/config/supabase.js
```

Variables admitidas:

| Variable | Uso |
|---|---|
| `SUPABASE_URL` | URL pública de la API de Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key destinada al cliente. |
| `APP_URL` | Origen del frontend, sin una ruta de página. |

Para una configuración no local, copia el ejemplo:

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Completa `.env`:

```dotenv
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<YOUR_PUBLISHABLE_KEY>
APP_URL=https://<YOUR_DOMAIN>
```

Después genera el runtime:

```bash
npm run configure
```

El generador valida variables obligatorias, URLs, placeholders y formatos privilegiados identificables. No imprime las claves completas.

La publishable key está diseñada para llegar al navegador; su alcance depende de RLS y las policies. No uses una clave `service_role`, `sb_secret_`, una contraseña PostgreSQL, una clave privada ni un access token.

Archivos relacionados:

- `.env.example`: plantilla versionada y sin credenciales.
- `.env`: configuración local ignorada por Git.
- `services/config/runtime-config.example.js`: estructura de referencia sin valores reales.
- `services/config/runtime-config.js`: archivo generado e ignorado que la aplicación necesita en ejecución.

## 8. Scripts npm

| Comando | Acción | Destructivo |
|---|---|---|
| `npm run configure` | Genera runtime config desde `.env` o el entorno. | No. |
| `npm run configure:local` | Genera runtime config desde un Supabase local ya iniciado. | No. |
| `npm run dev` | Sirve el frontend en el puerto 3000. | No. |
| `npm run supabase:start` | Inicia/reutiliza Supabase local y genera runtime config. | No para datos existentes en condiciones normales. |
| `npm run supabase:stop` | Detiene los contenedores locales. | No elimina la base. |
| `npm run db:reset` | Reconstruye migraciones y seed en local. | **Sí, para datos locales.** |
| `npm run validate` | Valida JavaScript, JSON y configuración portable. | No. |

## 9. Instalar en Supabase.com

Los comandos de esta sección actúan sobre un proyecto remoto. Revisa siempre el destino antes de continuar y no los ejecutes contra una base con datos que deban conservarse sin un plan de backup.

### 9.1 Crear el proyecto

Desde Supabase Dashboard:

1. crea un proyecto;
2. selecciona región y contraseña de base de datos;
3. espera al aprovisionamiento;
4. copia el project ref, la Project URL y la publishable key desde la configuración de API.

Guarda la contraseña de base de datos fuera del repositorio.

### 9.2 Autenticar y vincular la CLI

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
```

La CLI puede solicitar la contraseña de la base. No la guardes en el código ni en el `.env` que alimenta al frontend.

El vínculo genera estado local bajo `supabase/.temp/`, directorio ignorado por Git.

### 9.3 Revisar el plan

```bash
npx supabase db push --linked --include-seed --dry-run
```

Comprueba el project ref y revisa las migraciones que la CLI propone aplicar.

### 9.4 Aplicar migraciones y seed

```bash
npx supabase db push --linked --include-seed
```

`--include-seed` incluye los archivos declarados en `[db.seed]` de `supabase/config.toml`. El seed usa operaciones idempotentes para su configuración, categorías y buckets.

### 9.5 Conectar el frontend

```bash
cp .env.example .env
npm run configure
npm run dev
```

Completa previamente `.env` con la URL, publishable key y URL pública de tu instalación. Comprueba localmente registro, login, catálogo y formularios antes de desplegar.

## 10. Configurar Auth

En Supabase Dashboard abre **Authentication → URL Configuration**.

Para producción configura:

- **Site URL:** `https://<YOUR_DOMAIN>`
- **Redirect URLs:**
  - `https://<YOUR_DOMAIN>`
  - `https://<YOUR_DOMAIN>/confirmacion.html`
  - `https://<YOUR_DOMAIN>/reset-password.html`

El dominio debe coincidir con el origen de `APP_URL`. Si modificas `.env`, vuelve a ejecutar `npm run configure`.

En **Authentication → Providers** decide si el correo debe confirmarse. El entorno local permite registro sin confirmación para facilitar el desarrollo; una instalación pública debe definir conscientemente esa política y configurar su proveedor de correo.

## 11. Crear el primer administrador

Una instalación nueva empieza sin usuarios ni administradores.

### 11.1 Registrar y verificar

1. registra una cuenta desde la aplicación;
2. confirma el correo si el proyecto lo exige;
3. comprueba que el trigger `on_auth_user_created` creó una fila en `public.profiles`;
4. copia el UUID exacto desde Authentication → Users.

No selecciones el perfil por nombre o coincidencia parcial.

### 11.2 Promover exactamente un perfil

Desde SQL Editor, con acceso de propietario:

```sql
UPDATE public.profiles
SET role = 'admin',
    updated_at = now()
WHERE id = '<USER_UUID>'::uuid
RETURNING id, role;
```

Resultado esperado: exactamente una fila con rol `admin`.

- Si devuelve cero filas, detente y revisa el UUID y el trigger.
- Si el resultado no es el esperado, no continúes con el panel.
- No guardes emails, UUID, contraseñas ni resultados reales en archivos versionados.

Después, `/admin/index.html` permite gestionar los roles de otras cuentas. El panel impide que un administrador cambie su propio rol desde el navegador.

## 12. Storage

El seed crea tres buckets vacíos:

| Bucket | Acceso | Restricciones iniciales |
|---|---|---|
| `avatars` | Público | 5 MB; JPEG, PNG, WebP o GIF. |
| `products` | Público | Imágenes de catálogo; sin límite adicional definido por el seed. |
| `job-applications` | Privado | 5 MB; PDF, DOC o DOCX. |

Las policies se crean en la migración:

- cada usuario gestiona su avatar dentro de su ruta;
- Admin gestiona las imágenes de productos;
- el usuario autenticado sube su propio CV;
- Admin y RRHH consultan o eliminan CV según las policies y funciones de rol.

PostgreSQL y Storage no forman una única transacción. Un fallo entre ambas operaciones puede requerir conciliación manual.

## 13. Despliegue del frontend

La aplicación es estática, pero necesita generar `runtime-config.js` antes de publicar el artefacto.

En una plataforma con paso de build:

```bash
npm ci && npm run configure
```

Configura `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y `APP_URL` como variables del entorno de despliegue. Publica la raíz del proyecto, incluyendo el runtime generado en el artefacto final.

Después del despliegue:

1. verifica que `services/config/runtime-config.js` responde por HTTPS;
2. comprueba que solo contiene URL de Supabase, publishable key y URL de la aplicación;
3. actualiza Site URL y Redirect URLs en Supabase Auth;
4. prueba registro, recuperación y cierre de sesión;
5. prueba permisos con cuentas `user`, `admin` y `rrhh` de prueba;
6. completa datos comerciales y textos legales desde Administración.

No uses `scripts/dev-server.js` como servidor de producción.

## 14. Seguridad y archivos locales

La instalación debe mantener fuera de Git:

- `.env` y sus variantes;
- `services/config/runtime-config.js`;
- `node_modules/`;
- `supabase/.temp/` y `supabase/.branches/`;
- backups personales, logs, caches y cobertura;
- contraseñas, tokens y credenciales privilegiadas.

El repositorio sí debe conservar `.env.example`, `package-lock.json`, scripts, configuración Supabase, migraciones y seed.

RLS está habilitado en las 11 tablas públicas. La publishable key no sustituye a RLS. Revisa también redirects, correo, policies, CAPTCHA, rate limiting y CSP según el entorno final.

## 15. Validación

Validación estática habitual:

```bash
npm run validate
git diff --check
```

Para validar una reconstrucción local completa, únicamente cuando puedan descartarse los datos locales:

```bash
npm run db:reset
```

Después inicia el frontend y prueba las áreas pública, cuenta, administración y RRHH con usuarios de prueba locales. No uses datos personales reales.

## 16. Solución de problemas

### Docker no está iniciado

Síntoma: `npm run supabase:start` no puede crear o contactar los contenedores.

1. inicia Docker;
2. espera a que el motor responda;
3. repite el comando desde la raíz del repositorio.

### El puerto 3000 está ocupado

`npm run dev` informa que el puerto está en uso. Detén el proceso anterior antes de iniciar otra instancia. El servidor actual usa el puerto 3000 de forma intencionada.

### Supabase local no inicia

- comprueba Docker;
- confirma que ejecutaste `npm ci`;
- revisa conflictos en los puertos declarados en `supabase/config.toml`;
- consulta la salida de `npm run supabase:start` sin copiar claves o connection strings en incidencias públicas.

### Falta `runtime-config.js`

Para un entorno local nuevo:

```bash
npm run supabase:start
```

Si Supabase ya está iniciado:

```bash
npm run configure:local
```

Para Supabase.com, completa `.env` y ejecuta `npm run configure`.

### `.env` está incompleto

Comprueba que las tres variables tengan valores reales, sin placeholders. `APP_URL` y `SUPABASE_URL` deben ser URLs HTTP o HTTPS válidas y no pueden contener credenciales.

### Auth redirige a una URL incorrecta

Comprueba que:

- `APP_URL` coincide con el origen del navegador;
- regeneraste runtime config después de cambiar `.env`;
- Site URL y Redirect URLs permiten el dominio y las páginas de confirmación/reset.

### El registro no crea un perfil

Verifica que la migración se aplicó, que existe `on_auth_user_created` sobre `auth.users` y que `public.profiles` contiene el UUID del usuario. No insertes perfiles manualmente salvo que estés reparando una instalación y comprendas sus relaciones.

### El catálogo está vacío

Es el estado esperado después del seed: se crean cuatro categorías y cero productos. Crea el primer administrador y añade productos desde el panel.

### No llegan correos en local

El entorno local captura los correos en el servidor de pruebas de Supabase, disponible por defecto en `http://127.0.0.1:54324`. Los correos reales requieren un proveedor configurado en Supabase.com.

### `db push` apunta al proyecto equivocado

No continúes. Revisa el proyecto vinculado, el project ref y el resultado de `--dry-run`. No pruebes la instalación sobre una base remota que contenga información que deba conservarse.
