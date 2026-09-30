# Café Paraíso

Aplicación web full-stack de gestión empresarial desarrollada alrededor del caso de uso demostrativo de Café Paraíso. Reúne sitio público, catálogo, comercio, área de cliente, administración y RRHH sobre un frontend sin framework conectado a Supabase.

Café Paraíso es una identidad de portfolio, no una afirmación sobre una empresa real. El proyecto separa la configuración de ejecución, los datos iniciales y buena parte del contenido empresarial para facilitar una adaptación posterior a otra marca o negocio similar. No pretende ser todavía una solución genérica para cualquier industria.

## Vista general

El repositorio contiene una aplicación web estática en el navegador y una base reproducible en Supabase. Una instalación nueva puede levantarse completamente en local con Docker o conectarse a un proyecto propio de Supabase.com.

Las migraciones, el seed, los scripts de configuración y la documentación forman parte del repositorio. Los datos personales, secretos y valores específicos de cada instalación quedan fuera de Git.

## Funcionalidades

### Sitio público y comercio

- Inicio construido con componentes HTML reutilizables.
- Catálogo dinámico, categorías y filtros.
- Carrito local para visitantes y persistente para usuarios autenticados.
- Fusión del carrito local después de iniciar sesión.
- Checkout autenticado con dirección y método de pago.
- Creación, consulta, cancelación e impresión de resúmenes de pedidos.
- Formulario de contacto almacenado en Supabase.
- Páginas legales y datos del footer alimentados por la configuración empresarial.

Los métodos de pago se registran en el pedido para su gestión, pero no existe una pasarela externa de cobro.

### Autenticación y área de cliente

- Registro, inicio y cierre de sesión mediante Supabase Auth.
- Confirmación de cuenta y redirects basados en la URL configurada de la aplicación.
- Recuperación de contraseña protegida por el contexto `PASSWORD_RECOVERY`.
- Perfil, teléfono y avatar.
- Cambio de contraseña.
- Direcciones guardadas y dirección predeterminada.
- Preferencia de método de pago.
- Historial de pedidos y candidaturas.
- Notificaciones personales con actualización mediante Supabase Realtime.

### Administración

- Acceso protegido por rol `admin`.
- Consulta de usuarios y asignación de roles `user`, `admin` y `rrhh`.
- Gestión de categorías, productos e imágenes de catálogo.
- Gestión de pedidos y estados de pago.
- Gestión de mensajes de contacto.
- Configuración de datos empresariales, redes sociales, textos legales y preferencias del banner de cookies.

### RRHH y candidaturas

- Envío de candidaturas por usuarios autenticados.
- Subida privada de CV en PDF, DOC o DOCX.
- Acceso de Admin/RRHH a candidaturas y CV mediante permisos o URL firmada.
- Actualización del estado, archivo y eliminación de candidaturas.
- Envío de notificaciones al candidato.

## Arquitectura

```text
Browser
  │
  ├── HTML / CSS / JavaScript
  ├── componentes cargados mediante fetch
  └── services/config/runtime-config.js
              │
              ▼
        Supabase JS
              │
    ┌─────────┼──────────┬──────────┐
    ▼         ▼          ▼          ▼
PostgreSQL   Auth      Storage   Realtime
```

La configuración de cada instalación sigue este flujo:

```text
.env o estado de Supabase local
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

`runtime-config.js` se genera localmente, contiene únicamente valores públicos necesarios para el navegador y está ignorado por Git.

La base de datos se reconstruye desde:

- `supabase/migrations/`: esquema, constraints, índices, funciones, triggers, RLS, policies, Storage y Realtime.
- `supabase/seed.sql`: configuración inicial, categorías y buckets.

## Stack tecnológico

### Frontend

- HTML5.
- CSS3.
- JavaScript del navegador, sin framework ni bundler.
- Componentes HTML cargados dinámicamente.

### Interfaz

- Bootstrap 5.3.7 mediante CDN.
- Bootstrap Icons 1.13.1 mediante CDN.
- Google Fonts: Inter y Poppins.

### Backend como servicio

- Supabase JS 2.117.2 mediante CDN.
- PostgreSQL.
- Supabase Auth, Storage y Realtime.
- Row Level Security y funciones SQL versionadas.

### Desarrollo local

- Node.js 20 o posterior.
- npm 10 o posterior.
- Supabase CLI 2.118.0 registrada en `package-lock.json` como dependencia de desarrollo.
- Docker Desktop o Docker Engine para Supabase local.

Bootstrap, Bootstrap Icons y Supabase JS se cargan desde CDN; no son dependencias npm de la aplicación.

## Estructura del proyecto

```text
project-root/
├── admin/                     # Panel administrativo
├── assets/
│   ├── css/                   # Estilos globales y por página
│   ├── img/                   # Branding, fondos y contenido visual
│   └── js/                    # Inicialización y lógica de páginas
├── components/                # Fragmentos HTML y estilos reutilizables
├── docs/
│   └── INSTALLATION.md        # Instalación detallada
├── rrhh/                      # Panel de recursos humanos
├── scripts/                   # Configuración, servidor y validación
├── services/                  # Auth, catálogo, carrito, pedidos y servicios
│   └── config/                # Configuración runtime del navegador
├── supabase/
│   ├── config.toml            # Entorno local
│   ├── migrations/            # Fuente oficial del esquema
│   └── seed.sql               # Datos iniciales no personales
├── .env.example
├── package.json
├── package-lock.json
└── index.html
```

## Base de datos e información inicial

Una reconstrucción limpia produce este estado:

| Recurso | Cantidad inicial |
|---|---:|
| Tablas de aplicación en `public` | 11 |
| Filas en `business_settings` | 1 |
| Categorías en `product_categories` | 4 |
| Productos | 0 |
| Usuarios Auth | 0 |
| Perfiles personales | 0 |
| Pedidos, carritos, direcciones, mensajes, candidaturas y notificaciones | 0 |
| Buckets de Storage | 3 |
| Objetos de Storage | 0 |

Buckets iniciales:

- `avatars`: público; imágenes JPEG, PNG, WebP o GIF de hasta 5 MB.
- `products`: público; imágenes del catálogo.
- `job-applications`: privado; CV en PDF, DOC o DOCX de hasta 5 MB.

Las cuatro categorías demo son Cafés, Infusiones, Chocolates y Complementos. El seed no crea productos ni cuentas.

El repositorio no incluye usuarios, perfiles, pedidos, mensajes, candidaturas o CV reales; tampoco objetos Storage de usuarios, sesiones, contraseñas, tokens privados ni credenciales privilegiadas.

## Inicio rápido

```bash
git clone <repository-url>
cd <repository-folder>
npm ci
npm run supabase:start
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

`<repository-url>` y `<repository-folder>` son placeholders: deben sustituirse cuando se publique la URL definitiva del repositorio.

## Configuración

El proyecto ofrece dos formas de generar la configuración del navegador:

- Supabase local: `npm run supabase:start` obtiene la URL y clave pública locales.
- Supabase.com: `.env` proporciona los valores y `npm run configure` genera el archivo runtime.

Variables admitidas:

| Variable | Propósito |
|---|---|
| `SUPABASE_URL` | URL pública de la API del proyecto Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Clave pública destinada al navegador. |
| `APP_URL` | Origen público del frontend, sin una ruta de página. |

`.env.example` es versionable. `.env`, sus variantes y `services/config/runtime-config.js` están ignorados.

Una publishable key es apropiada para el frontend cuando RLS y las policies están correctamente configuradas. Las claves `service_role`, `sb_secret_`, contraseñas de PostgreSQL y tokens privados nunca deben incorporarse al navegador.

## Scripts disponibles

| Comando | Propósito | Efecto destructivo |
|---|---|---|
| `npm run configure` | Genera runtime config desde `.env` o variables de entorno. | No. Sobrescribe únicamente el runtime generado. |
| `npm run configure:local` | Genera runtime config desde un Supabase local ya iniciado. | No. |
| `npm run dev` | Sirve la raíz en `http://localhost:3000`. | No. |
| `npm run supabase:start` | Inicia o reutiliza Supabase local y genera runtime config. | No para datos existentes en condiciones normales. |
| `npm run supabase:stop` | Detiene los contenedores locales del proyecto. | No elimina la base local. |
| `npm run db:reset` | Reconstruye la base local desde migraciones y seed. | **Sí: elimina los datos de la base local.** |
| `npm run validate` | Comprueba JavaScript, JSON y configuración portable. | No. |

## Desarrollo con Supabase local

`npm run supabase:start` usa la CLI instalada por `npm ci`, depende de Docker y:

1. inicia o reutiliza los servicios locales;
2. aplica migraciones y seed cuando corresponde;
3. consulta la URL y la publishable/anon key locales mediante salida JSON de la CLI;
4. genera `services/config/runtime-config.js`.

Para reconstruir el entorno:

```bash
npm run db:reset
```

Este comando es destructivo **solo para la base local** porque el script incluye `--local`.

Consulta la [guía de instalación](docs/INSTALLATION.md) para el flujo completo y solución de problemas.

## Uso con Supabase.com

El flujo documentado consiste en:

1. crear un proyecto propio y vacío;
2. autenticar la CLI con `npx supabase login`;
3. vincularlo con `npx supabase link --project-ref <PROJECT_REF>`;
4. revisar un `db push` con `--dry-run`;
5. aplicar migraciones y seed con `--include-seed`;
6. crear `.env` desde `.env.example` y ejecutar `npm run configure`;
7. configurar Site URL y Redirect URLs de Auth para el dominio real.

No se ejecuta ninguna operación remota durante la instalación local. Los comandos remotos y sus advertencias se explican en [docs/INSTALLATION.md](docs/INSTALLATION.md).

## Primer administrador

El seed no crea administradores. Para realizar el bootstrap:

1. registra el primer usuario desde la aplicación;
2. confirma la cuenta si el proyecto exige confirmación por correo;
3. verifica que existe su perfil y copia el UUID exacto desde Authentication → Users;
4. promueve exclusivamente ese perfil desde SQL Editor;
5. comprueba que `RETURNING` devuelve exactamente una fila.

```sql
UPDATE public.profiles
SET role = 'admin',
    updated_at = now()
WHERE id = '<USER_UUID>'::uuid
RETURNING id, role;
```

No deben usarse emails, UUID o contraseñas reales en archivos versionados.

## Personalización

La adaptación actual se realiza sobre recursos concretos; no existe un sistema automático de themes.

| Elemento | Ubicación actual |
|---|---|
| Colores públicos | `assets/css/variables.css` |
| Fuentes públicas | Variables de `assets/css/variables.css` y carga central en `assets/css/style.css` |
| Logo | `assets/img/logo/` |
| Otras imágenes | `assets/img/` |
| Contenido de páginas | HTML raíz y fragmentos de `components/` |
| Catálogo | Tablas `product_categories` y `products`, gestionables desde Admin |
| Datos empresariales, redes y textos legales | `business_settings` y panel de configuración |
| Datos iniciales | `supabase/seed.sql` |

Las 15 imágenes y el logotipo actuales se conservan temporalmente para no romper la interfaz. Contienen elementos del branding anterior o carecen de procedencia documentada y deben sustituirse antes de la publicación definitiva.

Admin, RRHH y Mi Cuenta mantienen estilos contextuales propios. Cambiar las variables públicas no transforma automáticamente todas esas áreas.

## Seguridad

- RLS está habilitado en las 11 tablas públicas.
- Las policies restringen operaciones por usuario y rol.
- Storage aplica reglas específicas para avatares, productos y CV.
- El bucket de candidaturas es privado.
- `.env` y runtime config no se versionan.
- El generador rechaza valores vacíos, placeholders y formatos privilegiados identificables.
- Las dependencias CDN versionadas usan SRI y `crossorigin` cuando la respuesta es inmutable y verificable.
- Los redirects de Auth derivan de `APP_URL` y deben autorizarse también en Supabase.

Estas medidas reducen riesgos, pero no garantizan seguridad absoluta. CSP, rate limiting adicional, CAPTCHA, correo y policies deben evaluarse según el despliegue.

## Capturas

Las capturas reales se añadirán antes de la publicación definitiva. No se ha creado una carpeta vacía ni se incluyen enlaces a imágenes inexistentes.

## Documentación

- [Instalación y configuración detallada](docs/INSTALLATION.md)
- [Variables de entorno de ejemplo](.env.example)
- [Migración actual](supabase/migrations/20260926084950_remote_schema.sql)
- [Datos iniciales](supabase/seed.sql)

## Limitaciones conocidas

- El primer administrador necesita una promoción manual y controlada.
- No existe pasarela de pago externa.
- Las operaciones combinadas entre PostgreSQL y Storage no son una única transacción atómica.
- Realtime está configurado para `public.notifications`, no para todas las tablas.
- La firma actual de `submit_job_application` conserva parámetros personales por compatibilidad, aunque el servidor valida los datos fiables de Auth y del perfil.
- Cada despliegue debe configurar sus propios dominios, redirects, proveedor de correo y contenido legal.

## Roadmap

Posibles evoluciones, no incluidas en la funcionalidad actual:

- mayor desacoplamiento del branding;
- adaptación progresiva a otros contextos empresariales;
- interfaz operativa específica;
- modularización adicional de los scripts de mayor tamaño.

## Licencia y aviso sobre assets

Todavía no se ha definido una licencia para el repositorio. La licencia del código y los derechos de redistribución de la marca, logotipos, imágenes y otros recursos visuales deben revisarse antes de la publicación pública.

La presencia de esos recursos en el repositorio no implica por sí sola autorización para reutilizarlos o redistribuirlos.
