# Mail

Webmail self-hosted que conecta a cualquier servidor IMAP/SMTP. Inspirado en el diseño de iCloud Mail.

![Astro](https://img.shields.io/badge/Astro-6-ff5d01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-runtime-f9f1e1?logo=bun&logoColor=black)

---

## Funcionalidades

- **Correo real** — Lee, envia, responde y reenvie correos via IMAP/SMTP
- **Login por IMAP** — Sin configuracion de credenciales en el servidor, cada usuario se autentica directamente
- **Connection pooling** — Conexiones IMAP persistentes para respuesta instantanea
- **Dark mode** — Tema oscuro con filtro automatico para correos HTML con fondos claros
- **Context menu completo** — Click derecho con responder, reenviar, mover, archivar, eliminar, indicadores
- **Modal de redaccion** — Compose con soporte para reply, reply-all y forward pre-rellenados
- **Carpetas IMAP** — Bandeja de entrada, enviados, borradores, spam, papelera, archivado
- **Cache inteligente** — Mensajes leidos se cachean en memoria, navegacion instantanea
- **Avatars con color** — Cada remitente tiene un avatar unico generado por su nombre
- **Interfaz en espanol** — UI completamente traducida, fechas relativas en espanol
- **Responsive** — Layout de 3 paneles con sidebar colapsable

## Stack

| Capa | Tecnologia |
|------|-----------|
| Runtime | Bun |
| Framework | Astro 6 (server mode) + React islands |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 |
| IMAP | imapflow + mailparser |
| SMTP | nodemailer |
| Validacion | Zod v4 |
| Sesiones | Astro sessions (filesystem) |
| Adapter | @astrojs/node (standalone) |

## Setup

```bash
# Clonar e instalar
git clone <repo-url> mail
cd mail
bun install

# Configurar servidor de correo
cp .env.example .env
# Editar .env con los datos de tu servidor IMAP/SMTP
```

## Desarrollo

```bash
bun run dev
# Abre http://localhost:4321
# Inicia sesion con tu email y password
```

## Build & Deploy

```bash
bun run build
node dist/server/entry.mjs
```

Optimizado para deploy con [Dokploy](https://dokploy.com) + Railpack.

## Variables de entorno

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `IMAP_HOST` | Host del servidor IMAP | — |
| `IMAP_PORT` | Puerto IMAP | `993` |
| `SMTP_HOST` | Host del servidor SMTP | — |
| `SMTP_PORT` | Puerto SMTP | `587` |

> Las credenciales del usuario (email + password) se ingresan en la pantalla de login y se almacenan en la sesion del servidor. Nunca se guardan en disco ni en variables de entorno.

## Estructura

```
src/
├── components/       # React islands (mail, nav, compose, login, etc.)
│   └── ui/           # shadcn/ui components
├── hooks/            # useMail (React context)
├── layouts/          # Layout.astro (ViewTransitions + dark mode)
├── lib/
│   ├── mail/         # imap.ts, smtp.ts, pool.ts
│   ├── validations/  # Zod schemas
│   └── auth.ts       # Session helpers
├── pages/
│   ├── api/
│   │   ├── auth/     # login, logout, me
│   │   └── mail/     # list, folders, [uid], send
│   ├── index.astro   # App principal
│   └── login.astro   # Pantalla de login
├── styles/           # Tailwind v4 globals
└── types/            # TypeScript types
```

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Autenticar via IMAP |
| `POST` | `/api/auth/logout` | Cerrar sesion |
| `GET` | `/api/auth/me` | Usuario actual |
| `GET` | `/api/mail/folders` | Listar carpetas |
| `GET` | `/api/mail/list` | Listar correos |
| `GET` | `/api/mail/:uid` | Leer correo |
| `PATCH` | `/api/mail/:uid` | Marcar leido/destacado/mover |
| `DELETE` | `/api/mail/:uid` | Eliminar correo |
| `POST` | `/api/mail/send` | Enviar correo |

## Licencia

MIT
