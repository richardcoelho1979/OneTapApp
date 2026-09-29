# OneTap — Revisão Técnica Completa

*Documento de arquitetura e revisão independente · 22 de julho de 2026*

---

## 1. Estrutura Completa de Pastas

```
workspace/                          ← monorepo pnpm
│
├── artifacts/                      ← aplicações executáveis
│   ├── api-server/                 ← backend Fastify (porta 8080)
│   │   └── src/
│   │       ├── index.ts            ← bootstrap do servidor
│   │       ├── app.ts              ← montagem do app (CORS, rotas, erros, seed)
│   │       ├── games/              ← SISTEMA DE PLUGINS DE JOGOS
│   │       │   ├── registry.ts     ← registro + seed de jogos/conquistas no boot
│   │       │   ├── runner.ts       ← executor de ações (única ponte plataforma↔engine)
│   │       │   ├── context.ts      ← injeção de dependências para os plugins
│   │       │   └── memory/         ← primeiro jogo plugável
│   │       │       ├── engine.ts   ← máquina de estados pura (sem I/O)
│   │       │       ├── achievements.ts
│   │       │       ├── i18n.ts     ← traduções pt-BR/en/es
│   │       │       └── index.ts    ← GameDefinition exportada
│   │       ├── modules/            ← domínios da plataforma (1 pasta = 1 domínio)
│   │       │   ├── auth/           ← registro, login, refresh, OAuth Google/Apple
│   │       │   ├── users/          ← perfil, XP, busca, conquistas do usuário
│   │       │   ├── friends/        ← pedidos de amizade e lista de amigos
│   │       │   ├── rooms/          ← salas públicas/privadas com código de convite
│   │       │   ├── sessions/       ← sessões de jogo (solo e multiplayer)
│   │       │   ├── games/          ← catálogo de jogos
│   │       │   ├── rankings/       ← ranking global e entre amigos
│   │       │   ├── championships/  ← campeonatos (schema pronto, lógica incompleta)
│   │       │   ├── seasons/        ← temporadas
│   │       │   ├── achievements/   ← catálogo de conquistas
│   │       │   ├── subscriptions/  ← OneTap Plus (assinatura)
│   │       │   ├── notifications/  ← notificações in-app
│   │       │   └── health/         ← healthcheck
│   │       │   (cada módulo: *.routes.ts / *.service.ts / *.repository.ts)
│   │       ├── shared/             ← middleware requireAuth, AppError, tipos Fastify
│   │       └── lib/                ← JWT, hash de senha, geração de IDs
│   │
│   ├── onetap/                     ← app mobile Expo (React Native)
│   │   ├── app/                    ← rotas file-based (expo-router)
│   │   │   ├── _layout.tsx         ← providers raiz + ErrorBoundary
│   │   │   ├── index.tsx           ← splash / gate de autenticação
│   │   │   ├── (auth)/             ← login.tsx, register.tsx
│   │   │   ├── (main)/(tabs)/      ← play, friends, ranking, notifications, profile
│   │   │   ├── room/[id].tsx       ← lobby da sala (espera + início de partida)
│   │   │   ├── game/[sessionId].tsx← tela genérica de jogo (tabuleiro Memória)
│   │   │   ├── users/[id].tsx      ← perfil público
│   │   │   ├── create-room.tsx
│   │   │   └── settings.tsx
│   │   ├── contexts/               ← AuthContext, I18nContext
│   │   ├── hooks/                  ← useColors (tema)
│   │   ├── components/ui/          ← Button, Avatar, SkeletonLoader etc.
│   │   └── i18n/locales/           ← pt-BR.json (mestre), en.json, es.json
│   │
│   └── mockup-sandbox/             ← preview de componentes (ferramenta de design)
│
├── lib/                            ← pacotes compartilhados
│   ├── db/                         ← schema Drizzle + conexão PostgreSQL
│   │   └── src/schema/             ← 10 arquivos, 15 tabelas
│   ├── game-sdk/                   ← CONTRATO do sistema de plugins (GameDefinition)
│   ├── api-spec/                   ← openapi.yaml (fonte da verdade da API)
│   ├── api-zod/                    ← schemas Zod gerados da spec (validação server)
│   └── api-client-react/           ← hooks React Query gerados da spec (mobile)
│
└── .agents/memory/                 ← memória de decisões de arquitetura
```

**Avaliação:** estrutura acima da média para o estágio do projeto. A separação `artifacts` (executáveis) / `lib` (compartilhados) é limpa, e o padrão de 3 camadas por módulo (routes → service → repository) é consistente em todos os 13 domínios.

---

## 2. Arquitetura do Sistema (Diagrama Textual)

```
┌─────────────────────────────────────────────────────────────────┐
│                      APP MOBILE (Expo/RN)                       │
│  Telas (expo-router) → hooks gerados (React Query) → HTTP/JSON  │
│  AuthContext (tokens) · I18nContext (3 idiomas) · polling 2s    │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTPS  /api/v1/*   (Bearer JWT)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER (Fastify, Node)                   │
│                                                                 │
│  requireAuth (JWT) → route → Zod validation → service → repo    │
│                                                                 │
│  ┌─────────── MÓDULOS DE PLATAFORMA ───────────┐                │
│  │ auth · users · friends · rooms · sessions   │                │
│  │ rankings · seasons · achievements · subs    │                │
│  │ notifications · championships · games       │                │
│  └──────────────────┬───────────────────────────┘               │
│                     │ (sessions é o único que toca jogos)       │
│                     ▼                                           │
│  ┌────────── SISTEMA DE PLUGINS ───────────┐                    │
│  │  registry ── seed no boot               │                    │
│  │  runner ──── processa ações             │                    │
│  │  context ─── DI: notify/award/friends…  │                    │
│  │      │                                  │                    │
│  │      ▼                                  │                    │
│  │  GameDefinition (lib/game-sdk)          │                    │
│  │   └─ memory (engine puro, sem I/O)      │                    │
│  └─────────────────────────────────────────┘                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Drizzle ORM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               PostgreSQL (única instância, 15 tabelas)          │
│   users ─ friendships ─ rooms ─ game_sessions ─ achievements…   │
│   estado de jogo: JSONB opaco em game_sessions.state            │
└─────────────────────────────────────────────────────────────────┘

Contrato de API: openapi.yaml ──codegen──▶ api-zod (server) + api-client-react (mobile)
```

**Fluxo de uma jogada (Memória):**
1. Jogador toca numa carta → `POST /sessions/{id}/action`
2. `requireAuth` valida JWT → service confirma que é participante
3. `runner` chama o engine puro → novo estado + eventos
4. Estado persiste em JSONB; hook de conquistas roda em best-effort
5. Se o engine declara fim de jogo → finalização atômica server-side (XP, rank, sala)
6. Os demais jogadores recebem o novo estado no próximo poll (até 2s depois)

---

## 3. Tecnologias Utilizadas e Justificativas

| Tecnologia | Papel | Por que foi escolhida | Avaliação crítica |
|---|---|---|---|
| **pnpm workspaces** | monorepo | Compartilhar tipos entre server/mobile/libs sem publicar pacotes | ✅ Correta |
| **TypeScript** (estrito, project references) | linguagem única | Tipagem ponta-a-ponta: do schema do banco ao hook do mobile | ✅ Correta |
| **Fastify 4** | servidor HTTP | Mais rápido que Express, schema-first, plugins maduros | ✅ Correta, mas subutilizado (sem rate-limit, sem websocket, sem helmet) |
| **Drizzle ORM** | acesso a dados | Type-safe, SQL transparente, leve | ✅ Correta; porém usada com `push` em vez de migrações versionadas |
| **PostgreSQL** | banco | Relacional + JSONB para estado de jogo flexível | ✅ Correta |
| **Zod** | validação | Runtime validation gerada da spec OpenAPI | ✅ Correta |
| **OpenAPI + Orval** | contrato de API | Uma fonte de verdade gera validação server e client React Query | ✅ Boa decisão; risco: spec mantida à mão pode divergir da implementação |
| **JWT (15min) + refresh token (7d)** | autenticação | Stateless, revogável via tabela de refresh | ⚠️ Padrão sólido, mas tokens guardados em AsyncStorage no mobile |
| **Expo + expo-router** | mobile | Iteração rápida, file-based routing, OTA possível | ✅ Correta; OTA/EAS ainda não configurado |
| **React Query (TanStack)** | estado de servidor no mobile | Cache, polling, mutações, invalidação | ✅ Correta |
| **i18n próprio (JSON + tipos)** | 3 idiomas | Leve, chaves tipadas em compile-time | ⚠️ Funciona, mas limitado a 2 níveis de chave (já causou retrabalho) |
| **Polling HTTP 2s** | "tempo real" | Simplicidade de MVP; sem infraestrutura extra | ❌ Decisão mais frágil do projeto — ver seções 7 e 10 |
| **game-sdk próprio** | plugins de jogos | Jogos como módulos autocontidos, plataforma agnóstica | ✅ A melhor decisão de arquitetura do projeto |

---

## 4. Banco de Dados Completo

### 4.1 Tabelas (15)

**Identidade e acesso**

| Tabela | Colunas principais | Papel |
|---|---|---|
| `users` | id, username*, email*, password_hash, avatar_url, country, xp, level, wins, is_plus | Conta e progressão |
| `refresh_tokens` | id, user_id→users, token, is_revoked, expires_at | Sessões de longa duração revogáveis |

**Social**

| Tabela | Colunas principais | Papel |
|---|---|---|
| `friend_requests` | id, from_user_id→users, to_user_id→users, status (enum) | Pedidos pendentes/aceitos/recusados |
| `friendships` | id, user_id→users, friend_id→users | Amizade efetivada (par de linhas) |
| `notifications` | id, user_id→users, type (enum 7 valores), title, body, is_read, data JSONB | Notificações in-app |

**Jogo**

| Tabela | Colunas principais | Papel |
|---|---|---|
| `games` | id (= slug do plugin), name, description, min/max_players, average_duration, is_active, is_plus_exclusive, tags | Catálogo — populado pelo registry no boot |
| `rooms` | id, game_id→games, name, code*, host_id→users, max_players, current_players, is_private, status (enum) | Sala/lobby; solo = sala privada de 1 jogador |
| `room_players` | id, room_id→rooms, user_id→users, is_host | Ocupação da sala |
| `game_sessions` | id, room_id→rooms, game_id→games, status (enum), **state JSONB**, round, current_turn_user_id, timestamps | Partida em andamento; estado do jogo é opaco |
| `game_session_players` | id, session_id→sessions, user_id→users, score, final_rank, is_connected, last_seen_at | Resultado por jogador |

**Metajogo**

| Tabela | Colunas principais | Papel |
|---|---|---|
| `achievements` | id, key* (`"<slug>:<key>"` p/ jogos), title, description, icon, category (enum), xp_reward, is_secret | Catálogo — conquistas de jogos seedadas pelo registry |
| `user_achievements` | id, user_id→users, achievement_id→achievements, unlocked_at, **UNIQUE(user_id, achievement_id)** | Desbloqueio (dedup no banco) |
| `seasons` | id, number*, name, start/end_date, is_active | Temporadas |
| `championships` | id, game_id→games, name, datas, max/current_participants, prize, is_exclusive | ⚠️ Schema existe, sem service/rotas — feature morta ou incompleta |
| `subscriptions` | id, user_id*→users, plan, is_active, started_at, expires_at | OneTap Plus |

`*` = constraint UNIQUE.

### 4.2 Relacionamentos

```
users 1─N refresh_tokens
users 1─N friend_requests (from e to)
users N─N users            (via friendships — modelo de par de linhas)
users 1─N notifications
users 1─1 subscriptions
users 1─N user_achievements N─1 achievements
users 1─N room_players N─1 rooms
users 1─N game_session_players N─1 game_sessions
games 1─N rooms 1─N game_sessions
games 1─N championships
```

Todas as FKs de usuário usam `ON DELETE CASCADE` (bom para GDPR básico, arriscado sem soft-delete — apagar um usuário apaga silenciosamente o histórico das partidas dos adversários dele).

### 4.3 Índices — Estado Atual

**Existentes:** apenas PKs e as UNIQUEs (`users.email`, `users.username`, `rooms.code`, `seasons.number`, `subscriptions.user_id`, `achievements.key`, `user_achievements(user_id, achievement_id)`).

**❌ Ausentes (todos usados nas queries mais quentes do sistema):**

| Índice faltante | Query prejudicada | Frequência |
|---|---|---|
| `game_sessions(room_id)` | descoberta de sessão da sala | a cada poll do lobby |
| `game_sessions(status)` parcial | listar ativas / cleanup | contínua |
| `game_session_players(session_id)` | jogadores da sessão | **toda** requisição de sessão |
| `game_session_players(user_id)` | histórico do jogador / autorização | toda ação |
| `notifications(user_id, is_read)` | lista + badge de não lidas | a cada abertura de tela |
| `friendships(user_id)` e `(friend_id)` | lista de amigos | tela principal social |
| `friend_requests(to_user_id, status)` | pedidos pendentes | recorrente |
| `refresh_tokens(user_id)` | logout/revogação | login/logout |
| `rooms(status, is_private)` parcial | lista de salas públicas | tela Play |
| `users.username` GIN/trgm | busca `%texto%` | busca de amigos |

Hoje o volume é pequeno e nada disso dói. Com 50 mil usuários, **cada uma dessas queries vira um full scan** — este é o problema mais barato de resolver com maior retorno do projeto inteiro.

### 4.4 Chaves

- PKs em `text` com UUID gerado na aplicação. Funciona, mas o tipo nativo `uuid` do Postgres ocupa 16 bytes vs ~37, com índices menores e validação embutida. Custo de migrar cresce com o tempo.
- `games.id` = slug do plugin (ex.: `memory`) — decisão boa: estável, legível, sem lookup extra.

### 4.5 Estratégia de Crescimento (hoje: inexistente — proposta)

1. **Fase 1 (até ~100k usuários):** índices acima + migrações versionadas + cleanup periódico (`refresh_tokens` expirados, `notifications` > 90 dias, salas abandonadas) + `pg_stat_statements` para monitorar.
2. **Fase 2 (até ~1M):** read replica para leituras pesadas (rankings, perfis públicos); particionamento de `game_sessions` e `notifications` por data; materialized view para ranking.
3. **Fase 3 (milhões):** arquivamento de sessões finalizadas em cold storage; ranking em Redis (sorted sets) com snapshot no Postgres; avaliar sharding por região apenas se necessário.

---

## 5. Arquitetura do Backend

### 5.1 Rotas (35+, todas sob `/api/v1`)

| Domínio | Endpoints |
|---|---|
| Auth | POST register, login, refresh, logout, google, apple |
| Users | GET me, PATCH me, GET search, GET :id, GET :id/achievements |
| Friends | GET /, GET requests, GET requests/sent, POST request, POST requests/:id/accept·reject, DELETE :friendId |
| Rooms | GET /, POST /, GET :id, DELETE :id, POST :id/join, :id/leave, join-by-code |
| Sessions | POST rooms/:id/session/start, POST sessions/solo, GET rooms/:id/session/current, GET :id, POST :id/action, :id/pause, :id/resume, :id/state, :id/finish, PATCH :id/players/:uid/connection |
| Meta | GET games, achievements, rankings, rankings/friends, seasons, seasons/current, championships, subscriptions/me, notifications, POST notifications/read-all |
| Infra | GET /healthz (também sem prefixo, para probes) |

Padrão consistente: substantivos no plural, ações como sub-recursos, códigos HTTP semânticos (400 validação, 401/403 auth, 404, 409 conflito de estado).

### 5.2 Camadas

```
Route      → parse Zod (gerado da spec) → chama service → status HTTP
Service    → TODA regra de negócio, autorização por recurso, orquestração
Repository → apenas Drizzle; zero regra de negócio
```

A disciplina de camadas é respeitada em todos os módulos — nenhuma query vaza para route, nenhuma regra vaza para repository. Chamadas entre domínios acontecem service→service (ex.: sessions → users.addXP), o que preservaria a fronteira numa eventual extração para serviços separados.

### 5.3 Middlewares

- `requireAuth`: valida Bearer JWT, injeta `userId` na request. Aplicado via `preHandler` por grupo de rotas.
- Error handler global: `AppError` (badRequest/unauthorized/forbidden/notFound/conflict) → HTTP correspondente; erro inesperado → 500 genérico com log (sem vazar stack).
- **Faltam:** rate limiting, helmet/headers de segurança, limite de payload, timeout de request, request-id para rastreabilidade.

### 5.4 Autenticação

- Access token JWT de 15 min + refresh token de 7 dias persistido com flag de revogação. Logout revoga o refresh. OAuth Google/Apple suportado.
- Senhas com hash (scrypt/bcrypt via lib própria).

### 5.5 Autorização

Modelo por recurso, dentro dos services — **este é um ponto forte real do projeto:**

- Toda operação de sessão passa por `getSessionForParticipant` (só participantes acessam).
- Resultados de jogos com plugin são **exclusivamente calculados no servidor**; o endpoint legado de finish responde 403 para esses jogos (anti-farm de XP, verificado com teste real).
- Finalização é transição atômica no banco — apenas um vencedor distribui recompensas (anti-duplo-XP em concorrência).
- Conquistas com dedup por constraint UNIQUE — o banco é a autoridade, não a aplicação.
- Jogador só altera o próprio status de conexão; só o host inicia partida ou fecha sala.
- Plugins não tocam o banco: recebem um `PlatformContext` com capacidades restritas (notificar apenas participantes, premiar apenas participantes).

**Lacuna:** não há papéis (admin/moderador). Qualquer operação administrativa futura (banir usuário, remover sala) não tem fundação.

---

## 6. Arquitetura do Frontend (Mobile)

### 6.1 Organização das Telas

```
index.tsx                 gate: decide entre (auth) e (main) conforme token
(auth)/login, register    pilha de autenticação
(main)/(tabs)/            5 abas: Play · Friends · Ranking · Notifications · Profile
room/[id]                 lobby: jogadores, código de convite, botão iniciar (host)
game/[sessionId]          tela genérica de jogo → renderiza o tabuleiro conforme gameId
users/[id]                perfil público
create-room, settings     modais/fluxos secundários
```

### 6.2 Navegação

expo-router (file-based). Grupos de rota separam autenticado/não-autenticado. Fluxos de jogo:
- Solo: Play → cria sessão → `game/[sessionId]` direto.
- Multiplayer: sala → host inicia → todos navegam para o jogo (não-hosts descobrem a sessão via poll do endpoint `session/current`).
- Proteção de rotas é implícita (redirect no gate) — não há guard central por rota; deep link para tela interna sem token depende do comportamento do gate.

### 6.3 Componentes Compartilhados

`components/ui/`: Button (com isLoading), Avatar, SkeletonLoader (reanimated), inputs. Tema claro/escuro via `useColors`. Design tokens informais — sem design system documentado.

### 6.4 Gerenciamento de Estado

| Tipo de estado | Solução |
|---|---|
| Servidor (dados) | React Query via hooks gerados (Orval) — cache, polling, invalidação |
| Autenticação | AuthContext (tokens em AsyncStorage, getter injetado no client HTTP; logout automático se `getMe` falha) |
| Idioma | I18nContext, chaves tipadas |
| Local de tela | useState |

Decisão correta: praticamente zero estado global manual; servidor é a fonte da verdade. **Fraquezas:** tokens em AsyncStorage (não criptografado), sem persistência offline do cache, sem optimistic updates (flip de carta espera o servidor).

---

## 7. Sistema Multiplayer

### 7.1 Como funcionam as salas

Sala = lobby persistente com código de convite de 6 caracteres, host, capacidade e privacidade. Ciclo: `waiting → in_game → finished`. Salas públicas aparecem na tela Play; privadas só por código. Solo reutiliza o modelo — sala privada de 1 jogador (zero mudança de schema, invisível nas listas públicas).

### 7.2 Como funcionam os jogos

Ao iniciar, a plataforma pergunta ao plugin o estado inicial e o grava na sessão. Cada jogada é um POST de ação; o engine (função pura) valida a vez, aplica a regra, devolve novo estado e eventos. O fim de jogo é declarado pelo engine e a plataforma finaliza de forma atômica: rank, score, XP (tabela padrão ou override do jogo; solo = XP fixo sem vitória), conquistas, sala fechada.

### 7.3 Como os jogadores são sincronizados

Hoje: **polling HTTP** — sessão a cada 2s na tela de jogo, sala a cada poll no lobby. Convenção `playerOrder`/`currentTurnIndex` no estado dá turn-tracking automático a qualquer jogo que a siga.

Limitações: latência de até 2s entre jogada e visualização pelo adversário; `is_connected` impreciso (sem heartbeat real); **sem timeout de turno** — jogador que abandona congela a partida para sempre; sem fluxo de reconexão explícito.

### 7.4 Como será a comunicação em tempo real (proposta)

O polling foi um atalho consciente de MVP e está no limite. Plano recomendado:

1. **Curto prazo:** WebSocket no próprio Fastify (`@fastify/websocket`) — canal por sessão; servidor faz push do estado após cada ação; polling vira fallback. Mantém autoridade 100% no servidor.
2. **Médio prazo:** presença por heartbeat WS (alimenta `is_connected` de verdade), timeout de turno por timer no servidor, rejoin idempotente (o estado sempre está no banco — a reconexão é só reassinar o canal).
3. **Escala:** Redis pub/sub para fan-out entre múltiplas instâncias do servidor.

O desenho atual facilita essa migração: como toda mutação já passa pelo runner, trocar o transporte (poll→push) não toca nos engines nem nas regras.

---

## 8. Arquitetura Modular para Jogos

O melhor subsistema do projeto. Contrato (`lib/game-sdk`):

```
GameDefinition
├── slug, version, meta (nomes/descrições em 3 idiomas, min/max players,
│   duração média, exclusividade Plus, tags)
├── engine (OBRIGATORIAMENTE PURO — sem I/O)
│   ├── initialState(playerIds)
│   ├── processAction(state, action, actorId) → novo estado + eventos
│   ├── isFinished(state) / computeResults(state)
│   └── computeXP(result, isSolo)?          ← override opcional da tabela de XP
├── achievements[] (chave, título/descrição i18n, categoria, XP, secreta?)
├── translations (chaves i18n do jogo em 3 idiomas)
└── hooks? (onSessionStart, onSessionFinish, checkAchievements — best-effort)
```

**Instalar um jogo novo = 1 import + 1 linha no registry.** No boot, o registry valida e seeda catálogo + conquistas. O runner é o único ponto de contato plataforma↔engine; o context injeta capacidades limitadas (notificar/premiar só participantes, ler amigos/temporada/assinatura). Erros de hook nunca derrubam uma jogada; erros de validação do engine viram 400 limpo.

**Fraquezas do contrato atual:**
1. **Sem máscara de estado por jogador** — o cliente recebe o estado inteiro (na Memória, os pares das cartas viradas para baixo). Trapaça por inspeção de rede é possível. O contrato precisa de um `maskState(state, viewerId)` opcional.
2. Estado é `Record<string, unknown>` — flexível, mas sem versionamento de schema; um update do engine pode quebrar sessões em andamento serializadas no formato antigo.
3. Convenção `__actorId` injetada no payload para hooks é um acoplamento implícito frágil — deveria ser parâmetro explícito.
4. Imutabilidade do estado não é garantida pelo runner — cada engine precisa lembrar de clonar (a Memória clona; o próximo jogo pode esquecer).
5. Sem sandbox real: um plugin malicioso/bugado pode importar o que quiser. Aceitável enquanto os jogos são first-party; inaceitável se um dia houver jogos de terceiros.
6. UI dos jogos não é plugável: a tela `game/[sessionId]` conhece a Memória. O próximo jogo exigirá um registro de renderers por slug no app.

---

## 9. Estratégia para Suportar Milhões de Usuários

O sistema atual suporta honestamente **centenas** de usuários simultâneos. Caminho em 4 fases:

**Fase 0 — fundação (fazer já, ~1 semana):** índices de FK; rate limiting; migrações versionadas; limpeza periódica de tabelas que só crescem; CORS restrito; lock otimista nas ações de jogo.

**Fase 1 — folga de 10x (~1 mês):** WebSocket substituindo polling (elimina ~90% das requisições em jogo); cache em memória para catálogo/temporada/ranking com TTL curto; paginação em todas as listas; eliminação dos N+1 com JOINs; múltiplas instâncias do servidor atrás de load balancer (o servidor já é stateless — só o transporte WS exigirá pub/sub).

**Fase 2 — 100x:** Redis (pub/sub para WS multi-instância, sorted sets para ranking, cache distribuído); read replica; fila (BullMQ) para efeitos colaterais (notificações, conquistas, push); particionamento de `game_sessions`/`notifications` por data; observabilidade completa (métricas, tracing, alertas).

**Fase 3 — milhões:** presença e matchmaking em serviço próprio; arquivamento de partidas antigas; CDN para todos os assets; multi-região se a latência exigir (jogos por turno toleram bem uma região só).

Vantagem estrutural: como toda a lógica de jogo é server-side e por turnos, o custo por jogador é baixo comparado a jogos de ação — a arquitetura *pode* chegar lá sem reescrita, **desde que o transporte saia de polling cedo**.

---

## 10. Pontos Fracos da Arquitetura Atual (lista consolidada)

**Críticos**
1. Nenhum rate limiting em nenhum endpoint (brute-force livre em login).
2. Race condition em `submitAction`: read→process→write sem lock — duas jogadas simultâneas podem sobrescrever estado uma da outra (a finalização é atômica; o meio do jogo não).
3. Polling 2s como transporte multiplayer — latência, custo linear, bateria.
4. Índices de FK ausentes em todas as tabelas quentes.
5. `drizzle-kit push` como estratégia de schema em produção (sem histórico, sem rollback).

**Altos**
6. CORS `origin: *`.
7. Tokens JWT em AsyncStorage (não criptografado) no mobile.
8. Estado de jogo integral enviado ao cliente (trapaça possível na Memória).
9. Zero testes automatizados em todo o projeto.
10. Sem timeout de turno — partidas multiplayer congelam para sempre com abandono.
11. Sem push notifications — engajamento depende de abrir o app.
12. N+1 nas listagens (salas → jogadores; sessões → jogadores).
13. `refresh_tokens` e `notifications` crescem sem limpeza.
14. Busca de usuário com `LIKE '%x%'` sem índice trigram.

**Médios**
15. Sem paginação em nenhuma listagem.
16. `championships`: schema sem funcionalidade (código morto).
17. `games.name` retornado sempre em pt-BR (catálogo não localizado na API).
18. Sem observabilidade (sem métricas, sem tracing, sem crash reporting no mobile).
19. Sem papéis administrativos (nenhuma fundação para moderação).
20. Sem soft-delete; CASCADE apaga histórico de partidas de terceiros.
21. Convenções implícitas do SDK (`__actorId`, `playerOrder`) não verificadas pelo compilador.
22. Sem limite de tamanho de payload nem timeout de request.
23. i18n limitado a 2 níveis de chave (já forçou contorno).
24. UI de jogo não plugável no app (tela conhece a Memória).
25. Salas/sessões abandonadas ficam `in_game` para sempre (sem GC).

---

## 11. Melhorias Recomendadas Antes de Continuar

Em ordem de execução (impacto ÷ esforço):

1. **Índices de FK + trigram** — uma migração, resolve a maior bomba de performance. (horas)
2. **Rate limiting** (`@fastify/rate-limit`): agressivo em auth, moderado em ações. (horas)
3. **SecureStore no mobile** para tokens. (minutos)
4. **Lock otimista em `submitAction`** (coluna `version` na sessão, update condicional). (1 dia)
5. **Migrações versionadas** (generate/migrate) antes do primeiro deploy sério. (1 dia)
6. **CORS por allowlist** via env. (minutos)
7. **Timeout de turno** — sweep periódico de sessões com turno vencido. (1–2 dias)
8. **`maskState` no game-sdk** — fecha a trapaça e reduz payload. (1 dia)
9. **Testes do núcleo**: engine da Memória (puro = trivial de testar), finalização atômica, autorização de sessão. (2–3 dias)
10. **Cleanup jobs**: tokens expirados, notificações velhas, salas mortas. (1 dia)

Só depois: WebSocket, push notifications, paginação, cache.

---

## 12. O Que Eu Faria Diferente Num Concorrente do Zero

1. **WebSocket desde o dia 1.** Transporte é fundação, não otimização. O custo de começar com WS é ~2 dias; o custo de migrar depois é semanas de risco.
2. **Event sourcing leve para partidas:** gravar a sequência de ações, não só o snapshot do estado. Ganha de graça: replay, anti-cheat forense, reconexão trivial, espectador, debugging.
3. **Migrações versionadas desde o primeiro `CREATE TABLE`.**
4. **Máscara de estado por jogador no contrato do SDK desde a v1** — obrigatória, não opcional.
5. **Renderer de jogo plugável no mobile** desde o primeiro jogo (registro slug→componente).
6. **Testes do engine junto com o engine** — funções puras são o melhor ROI de teste que existe.
7. **Push notifications no MVP** — para plataforma social de jogos casuais, retenção é o produto; notificação de "seu amigo te desafiou" é o loop de crescimento.
8. **Ranking em Redis desde cedo** — sorted set é a estrutura exata do problema.
9. Manteria: monorepo pnpm, contrato OpenAPI→codegen, sistema de plugins com engines puros, autorização por recurso nos services, solo como sala privada.

---

## 13. Decisões de Hoje Que Podem Cobrar Caro em Cinco Anos

| Decisão atual | Consequência em 5 anos | Gravidade |
|---|---|---|
| Estado JSONB sem versão de schema | Sessões antigas quebram silenciosamente a cada evolução de engine; impossível de consertar retroativamente sem histórico de ações | 🔴 |
| Polling como transporte | Cada jogo novo herda a limitação; a migração para WS fica mais cara a cada tela criada | 🔴 |
| `push` sem migrações | Um dia alguém perde dados em produção sem rollback; auditoria de schema impossível | 🔴 |
| Sem event log de partidas | Anti-cheat, disputas de resultado e replays serão impossíveis retroativamente | 🟠 |
| PKs `text` em vez de `uuid` | Bilhões de linhas com índices ~2x maiores; migrar PK com FKs em cascata é cirurgia de coração aberto | 🟠 |
| `games.name` em pt-BR no banco | Cada novo idioma exige gambiarra; catálogo nunca será verdadeiramente multi-idioma sem migração | 🟠 |
| CASCADE sem soft-delete | Conformidade (LGPD/GDPR "direito ao esquecimento" vs. integridade do histórico dos outros jogadores) vira problema jurídico-técnico | 🟠 |
| Conquistas premiadas inline na jogada | Com 50 conquistas por jogo, a latência da jogada cresce; extrair para fila depois exige refatorar todos os hooks | 🟡 |
| i18n de 2 níveis | Com 20 jogos, o namespace global vira um pântano de prefixos | 🟡 |

---

## 14. O Que Falta Para Nível Mundial

**Confiabilidade e operação**
- SLO/SLA definidos, métricas (latência p95/p99, error rate), tracing distribuído, alertas.
- Crash reporting no mobile (Sentry) e no servidor.
- Deploy com zero downtime, canary/rollback, ambientes de staging.
- Backups testados com restore drill (backup que nunca foi restaurado não é backup).

**Segurança e conformidade**
- Pentest externo; headers de segurança; rotação de segredos.
- LGPD/GDPR: exportação de dados, exclusão de conta real, política de retenção.
- Anti-cheat sistemático (event log + análise de padrões) e anti-abuso (moderação de username/avatar, report de jogador, bloqueio).

**Produto e engajamento**
- Push notifications (o gap de produto mais grave hoje).
- Matchmaking por habilidade (ELO/Glicko), não só salas manuais.
- Reconexão perfeita, modo espectador, replays.
- Chat na sala (com moderação), convites por deep link.
- Onboarding, tutorial por jogo, analytics de funil (retenção D1/D7/D30).
- Loja de assinatura funcional com billing real (App Store/Play Billing) — hoje `subscriptions` é uma tabela sem fluxo de pagamento.

**Plataforma de jogos (o diferencial)**
- 5–10 jogos vivos (a arquitetura suporta; falta conteúdo).
- SDK documentado com guia "crie seu jogo em 1 hora", simulador local de partidas e suíte de testes de contrato para engines.
- Campeonatos funcionando de ponta a ponta (hoje é só schema).
- Torneios agendados, eventos sazonais integrados às temporadas.

**Time e processo**
- CI com testes obrigatórios, lint e typecheck bloqueantes.
- Feature flags para lançamentos graduais.
- Documentação de arquitetura viva (este documento é o primeiro passo).

---

## Veredito Final

| Dimensão | Nota |
|---|---|
| Fundação de código (estrutura, camadas, contrato de API, plugin system) | **7,5/10** |
| Prontidão para produção (segurança, performance, operação) | **3,5/10** |
| Prontidão para escala (transporte, cache, banco) | **3/10** |

O OneTap tem uma **fundação de design acima da média** — o sistema de plugins com engines puros e autoridade total do servidor é o tipo de decisão que projetos muito maiores erram. Mas está a uma distância considerável de produção real: as lacunas não são de design, são de *hardening* (índices, rate limit, locks, migrações, testes) e de uma decisão estrutural adiada (transporte em tempo real). A boa notícia: quase tudo da lista crítica se resolve em dias, não meses, e nenhum item exige reescrita.
