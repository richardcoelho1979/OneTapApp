# Arquitetura WebSocket para Escala — OneTap

> Documento de referência para a decisão de implementação de tempo real.
> Escrito em Julho/2026. Referência antes de qualquer campanha de crescimento.

---

## Por que o polling atual não escala

O `refetchInterval: 2000` da tela de jogo é funcional para o lançamento,
mas tem um teto fixo e baixo:

| Usuários ativos | Req/seg geradas | Conexões de banco necessárias |
|---|---|---|
| 1 000 | 500 req/s | ~50 |
| 10 000 | 5 000 req/s | ~500 |
| 100 000 | 50 000 req/s | ~5 000 |
| 1 000 000 | 500 000 req/s | inviável |

Além da carga, há latência estrutural: o jogador pode esperar até 2s para ver
a jogada do adversário. Em jogos de raciocínio rápido isso é perceptível.

---

## As três abordagens possíveis

### Opção A — Server-Sent Events (SSE)

**O que é:** HTTP unidirecional persistente. O servidor empurra eventos; o
cliente nunca puxa. Não há handshake bidirecional.

**Vantagens:**
- Zero nova infraestrutura — funciona sobre HTTP/1.1 e HTTP/2
- Reconexão automática embutida no protocolo
- Simples de implementar em Fastify (`reply.raw.write(...)`)
- Funciona por trás de qualquer proxy/CDN

**Desvantagens:**
- Unidirecional — ações do jogador ainda chegam via POST HTTP separado
- Não comprime bem mensagens individuais pequenas
- Conexão persistente por usuário ainda ocupa um slot no servidor

**Quando faz sentido:** jogos de turno lento, notificações, rankings ao vivo.
Não é adequado para jogos com latência < 100ms.

**Capacidade estimada por instância:** ~5 000 conexões SSE concorrentes
com Fastify + Node.js padrão.

---

### Opção B — WebSocket nativo com pub/sub externo ⭐ Recomendada

**O que é:** Protocolo full-duplex sobre TCP. Uma única conexão por usuário
substitui tanto o polling quanto os POSTs de ação.

**Arquitetura:**

```
 Mobile (Expo)
     │  WS persistent
     ▼
┌─────────────────────────────────────────────┐
│         API Server Cluster (N instâncias)    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ instance │  │ instance │  │ instance │  │
│  │  WS hub  │  │  WS hub  │  │  WS hub  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │        │
│       └──────────────┼──────────────┘        │
│                      │                       │
└──────────────────────┼───────────────────────┘
                       │ pub/sub
                  ┌────▼─────┐
                  │  Redis    │
                  │ (pub/sub) │
                  └────┬─────┘
                       │
                  ┌────▼─────┐
                  │ PostgreSQL│
                  └──────────┘
```

**Fluxo de uma jogada:**
1. Jogador A (na instância 1) envia ação via WS
2. Instância 1 valida, processa engine, salva no PostgreSQL
3. Instância 1 publica `room:{roomId}:state_updated` no Redis
4. **Todas** as instâncias recebem o evento do Redis
5. Cada instância empurra via WS para os jogadores conectados nela

**Por que Redis é obrigatório com múltiplas instâncias:**
Sem pub/sub externo, a instância 1 não sabe que jogador B está conectado
na instância 2. O estado chega ao banco mas nunca ao device do jogador B.

**Vantagens:**
- Full-duplex: ações e atualizações na mesma conexão
- Latência < 50ms de ponta a ponta (vs até 2000ms com polling)
- O servidor só fala quando há algo novo (zero carga ociosa)
- Escala horizontalmente com Redis como barramento

**Desvantagens:**
- Redis vira dependência de infraestrutura crítica
- Precisa de sticky sessions no load balancer OU Redis como broker para
  enfileirar mensagens de reconexão
- Expo/React Native usa a API nativa de WebSocket — funciona, mas precisa
  de gestão explícita de reconexão (exponential backoff)

**Capacidade estimada por instância:** ~10 000–50 000 conexões WS concorrentes
com Node.js + uWebSockets (ou ws nativo ~10k).

---

### Opção C — Serviço dedicado de tempo real (NATS / Ably / Pusher)

**O que é:** Delegar o problema de pub/sub para um serviço gerenciado
(Ably, Pusher Channels) ou self-hosted (NATS JetStream).

**Vantagens:**
- Zero código de infra para gerenciar
- Ably/Pusher têm SDK nativo para React Native
- NATS escala para dezenas de milhões de mensagens/segundo

**Desvantagens:**
- Custo por mensagem em serviços gerenciados (pode ser alto em escala)
- Dependência de terceiro no caminho crítico do jogo
- Ainda precisa de lógica de reconexão no cliente

**Quando faz sentido:** times pequenos que precisam de escala imediata sem
engenharia de infra. Ably é a opção mais madura para mobile gaming.

---

## Decisão recomendada

**Para o lançamento (fase atual):** manter polling. É suficiente para
centenas de usuários e elimina risco de infra antes de validar o produto.

**Quando migrar:** quando o número de sessões simultâneas ultrapassar
consistentemente 500 (monitorar via métricas de banco).

**Implementar:** Opção B — WebSocket nativo + Redis pub/sub.

**Motivos:**
1. Controle total do protocolo (sem vendor lock-in)
2. Redis já é a escolha natural para cache de sessão e rate limiting
   distribuído quando o cluster escalar
3. A camada de pub/sub do Redis é simples (`PUBLISH`/`SUBSCRIBE`) e
   battle-tested em produção para gaming
4. O Fastify tem `@fastify/websocket` oficial (wrapper sobre `ws`)

---

## Plano de migração (quando chegar o momento)

### Fase 1 — Infraestrutura (1–2 dias)
```bash
# Adicionar Redis ao stack
pnpm add ioredis @fastify/websocket
```
- Provisionar Redis (Replit tem integração nativa via Upstash)
- Configurar `REDIS_URL` como secret

### Fase 2 — Endpoint WS no servidor (2–3 dias)
```ts
// artifacts/api-server/src/modules/realtime/realtime.routes.ts
app.get('/ws', { websocket: true }, (connection, req) => {
  const userId = verifyWsToken(req);          // JWT no query param
  connectionRegistry.add(userId, connection); // Map<userId, WebSocket>

  connection.on('message', async (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === 'action') {
      await sessionsService.submitAction(msg.sessionId, userId, msg.action);
      // Estado atualizado → publica no Redis
      await redis.publish(`room:${msg.roomId}`, JSON.stringify(newState));
    }
  });

  connection.on('close', () => connectionRegistry.remove(userId));
});

// Subscriber Redis → empurra para clientes conectados nesta instância
redis.subscribe('room:*', (channel, message) => {
  const roomId = channel.split(':')[1];
  for (const userId of getRoomUsers(roomId)) {
    connectionRegistry.get(userId)?.send(message);
  }
});
```

### Fase 3 — Cliente mobile (1–2 dias)
```ts
// artifacts/onetap/contexts/RealtimeContext.tsx
const ws = new WebSocket(`${WS_BASE_URL}/ws?token=${accessToken}`);

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'session_updated') {
    queryClient.setQueryData(getGetSessionQueryKey(msg.sessionId), msg.session);
  }
};

// Exponential backoff para reconexão
ws.onclose = () => setTimeout(reconnect, Math.min(delay * 2, 30_000));
```

### Fase 4 — Remover polling (0.5 dia)
```ts
// Remover refetchInterval: 2000 do game/[sessionId].tsx
// A tela passa a ser reativa ao contexto WS
```

### Estimativa total: 5–8 dias de engenharia

---

## Checklist antes de implementar WebSocket

- [ ] Redis provisionado e `REDIS_URL` configurado
- [ ] Métricas de sessões simultâneas ativas (saber quando migrar)
- [ ] Load balancer configurado (se múltiplas instâncias)
- [ ] Estratégia de reconexão no cliente definida
- [ ] Timeout de sessão WS inativa definido (sugestão: 30s ping/pong)
- [ ] Fallback para polling em caso de falha WS (opcional mas recomendado)
- [ ] Testes de carga com k6 ou Artillery antes de ir para produção

---

## Impacto em arquitetura existente

| Componente | Muda? | O que muda |
|---|---|---|
| `sessionsService.submitAction` | Mínimo | Adiciona publicação no Redis após salvar |
| `game/[sessionId].tsx` | Sim | Remove `refetchInterval`, usa contexto WS |
| `sessions.routes.ts` | Não | POST `/action` pode coexistir ou ser removido |
| Game SDK / engines | **Não** | Engines são puras, sem I/O — imunes |
| Schema do banco | Não | Nenhuma mudança |
| Autenticação | Mínimo | JWT passado via query param no handshake WS |

O ponto positivo da arquitetura atual é que as engines de jogo são completamente
puras — `processAction` não sabe nada sobre o transporte. A migração para
WebSocket é uma troca de camada de transporte, não de lógica de negócio.
