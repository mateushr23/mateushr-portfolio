# mateushr-portfolio

Portfólio pessoal bilíngue de Mateus em Next.js 16, com home em PT-BR em `/` e em inglês em `/en`. Os repositórios públicos do GitHub são sincronizados tanto sob demanda pelo admin quanto por uma rotina diária automatizada pelo Claude: cada README é parseado de forma determinística via Octokit, extraindo a descrição PT, a descrição EN e a lista `## Stack`. O carrossel da home hidrata ao vivo do Supabase, e o admin em `/admin` (Supabase Auth com allowlist de e-mails) expõe toggles `is_featured` e `is_hidden` por repo.

## Recursos

- Home bilíngue com rotas `/` (PT) e `/en`, dicionários tipados e `alternates` hreflang no metadata
- Sync sob demanda via GitHub REST + Octokit, com parser determinístico de README (parágrafo + `## Stack`)
- Invalidação por hash do README: conteúdo inalterado não é re-extraído
- Carrossel da cena 3 hidratado do Supabase, filtrando `is_hidden=false` e ordenado por `pushed_at DESC`
- Admin protegido por Supabase Auth (magic link + allowlist de e-mail) com toggles `is_featured` e `is_hidden` por repo
- Canvas starfield e shooting stars em CSS, ambos respeitando `prefers-reduced-motion`
- Experiência de scroll em cenas (hero, apresentação, convite de projetos, carrossel, contato) com scroll-lock e eventos customizados

## Stack

- **Framework:** Next.js 16
- **Styling:** Tailwind v4
- **Language:** TypeScript
- **Backend:** Supabase
- **GitHub:** Octokit
- **Hosting:** Vercel

## Como começar

```bash
npm install
cp .env.example .env.local
# preencha as variáveis do Supabase e do GitHub
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente

| Variável                               | Obrigatória | Descrição                                                     |
| -------------------------------------- | ----------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Sim         | URL do projeto Supabase                                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim         | Chave pública (anon) do Supabase                              |
| `SUPABASE_SERVICE_ROLE_KEY`            | Sim         | Service role usada no sync e no admin                         |
| `GITHUB_TOKEN`                         | Sim         | Token do GitHub para chamadas Octokit                         |
| `GITHUB_USERNAME`                      | Sim         | Usuário cujos repos públicos serão listados                   |
| `CRON_SECRET`                          | Sim         | Segredo que autoriza o endpoint de sync                       |
| `SUPABASE_ADMIN_ALLOWLIST`             | Sim         | Lista de e-mails autorizados no admin (separados por vírgula) |

## Estrutura

```text
src/
  app/                rotas (App Router, PT em /, EN em /en, admin em /admin)
  components/space/   primitivas da home em cenas e carrossel
  i18n/               dicionários tipados PT/EN
  lib/
    sync/             cliente GitHub e parser do README
    supabase/         clientes server, admin e anon
    home/             data fetchers da home
supabase/migrations/  SQL versionado
```

## English

Bilingual personal portfolio for Mateus HR on Next.js 16, with a PT-BR home at `/` and an English home at `/en`. Public GitHub repos are synced both on demand from the admin and via a daily automated routine by Claude: each README is parsed deterministically via Octokit, extracting the PT description, the EN description, and the `## Stack` list. The home carousel hydrates live from Supabase, and `/admin` (Supabase Auth with an email allowlist) exposes per-repo `is_featured` and `is_hidden` toggles.

### Features

- Bilingual home at `/` (PT) and `/en`, with a typed dictionary and hreflang `alternates` in metadata
- On-demand sync via GitHub REST + Octokit, with a deterministic README parser (paragraph + `## Stack`)
- Source-hash invalidation: an unchanged README is not re-extracted
- Scene-3 projects carousel hydrates from Supabase, filtered by `is_hidden=false` and ordered by `pushed_at DESC`
- Admin protected by Supabase Auth (magic link + email allowlist) with per-repo `is_featured` and `is_hidden` toggles
- Canvas starfield and CSS shooting stars, both respecting `prefers-reduced-motion`
- Scene-based scroll experience (hero, presentation, projects invite, carousel, contact) with scroll-lock and custom events

### Stack

- **Framework:** Next.js 16
- **Styling:** Tailwind v4
- **Language:** TypeScript
- **Backend:** Supabase
- **GitHub:** Octokit
- **Hosting:** Vercel

### Getting Started

```bash
npm install
cp .env.example .env.local
# fill in the Supabase and GitHub variables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

#### Environment Variables

| Variable                               | Required | Description                              |
| -------------------------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | Supabase public (anon) key               |
| `SUPABASE_SERVICE_ROLE_KEY`            | Yes      | Service role used by sync and admin      |
| `GITHUB_TOKEN`                         | Yes      | GitHub token for Octokit calls           |
| `GITHUB_USERNAME`                      | Yes      | User whose public repos are listed       |
| `CRON_SECRET`                          | Yes      | Secret that authorizes the sync endpoint |
| `SUPABASE_ADMIN_ALLOWLIST`             | Yes      | Comma-separated list of admin emails     |

### Project Structure

```text
src/
  app/                routes (App Router, PT at /, EN at /en, admin at /admin)
  components/space/   home scene primitives and carousel
  i18n/               typed PT/EN dictionaries
  lib/
    sync/             GitHub client and README parser
    supabase/         server, admin and anon clients
    home/             home-page data fetchers
supabase/migrations/  versioned SQL
```
