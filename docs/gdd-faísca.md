# Game Design Document — Faísca
**Versão:** 1.0  
**Data:** Julho 2026  
**Status:** Aguardando aprovação  
**Plataforma:** OneTap (iOS / Android via Expo)

---

## Sumário

1. [Objetivo do jogo](#1-objetivo-do-jogo)
2. [Público-alvo](#2-público-alvo)
3. [Duração média da partida](#3-duração-média-da-partida)
4. [Número de jogadores](#4-número-de-jogadores)
5. [Fluxo completo da partida](#5-fluxo-completo-da-partida)
6. [Regras detalhadas](#6-regras-detalhadas)
7. [Sistema de pontuação](#7-sistema-de-pontuação)
8. [Critérios de vitória](#8-critérios-de-vitória)
9. [Critérios de empate](#9-critérios-de-empate)
10. [Sistema de XP](#10-sistema-de-xp)
11. [Sistema de conquistas](#11-sistema-de-conquistas)
12. [Wireframes das telas](#12-wireframes-das-telas)
13. [Estados da partida](#13-estados-da-partida)
14. [Ações do jogador](#14-ações-do-jogador)
15. [Eventos do servidor](#15-eventos-do-servidor)
16. [Reconexão](#16-reconexão)
17. [Casos extremos](#17-casos-extremos)
18. [Por que é divertido](#18-por-que-é-divertido)
19. [Diferenciação](#19-diferenciação)
20. [Métricas de sucesso](#20-métricas-de-sucesso)

---

## 1. Objetivo do jogo

Faísca é um quiz de respostas simultâneas para 2 a 6 jogadores.  

A premissa é simples: todos os jogadores veem a mesma pergunta ao mesmo tempo e competem para responder certo *e* rápido. Velocidade e precisão se combinam numa fórmula de pontuação que garante que um segundo de hesitação custe pontos reais — mas uma resposta errada custe ainda mais.

O jogador com maior pontuação ao fim das 10 perguntas vence.

Não existe eliminação. Todos jogam todas as perguntas, o que mantém a sessão social, elimina o tempo morto e cria espaço para viradas dramáticas nas perguntas finais.

---

## 2. Público-alvo

**Primário:** Grupos de amigos, 18–35 anos, que jogam juntos pelo celular em momentos sociais (bares, encontros, transporte). Contexto de uso: ao lado um do outro ou em chamada de voz.

**Secundário:** Competidores solo que querem ranquear globalmente e coletar conquistas entre rodadas do dia a dia.

**Perfil emocional:** Querem sentir adrenalina, provocar os amigos, ter momentos de "eu sabia isso!" e sessões curtas o suficiente para caber numa pausa.

**Contexto de uso:** majoritariamente mobile em retrato, com uma mão. O design deve suportar uso com polegar sem exigir precisão fina.

---

## 3. Duração média da partida

| Fase | Tempo |
|---|---|
| Lobby + entrada dos jogadores | ~30–90 s |
| Countdown inicial | 3 s |
| 10 perguntas (15 s cada) | 150 s |
| Reveal após cada pergunta | 3 s × 10 | 30 s |
| Placar entre perguntas | 2 s × 9 | 18 s |
| Tela final de resultado | 10 s |
| **Total médio de jogo ativo** | **~3,5 min** |
| **Total com lobby** | **~5 min** |

A duração é intencionalmente curta. O ciclo de "mais uma partida" deve ser irresistível.

---

## 4. Número de jogadores

| | |
|---|---|
| **Mínimo** | 2 jogadores |
| **Máximo** | 6 jogadores |
| **Ideal** | 3–4 jogadores |

Com 2 jogadores, o jogo funciona como duelo direto — tensão máxima, comunicação simples.  
Com 5–6 jogadores, o caos e a imprevisibilidade aumentam — mais risadas, menos controle individual.

Não existe modo contra bots. Faísca é social por definição.

---

## 5. Fluxo completo da partida

```
HOST                          CONVIDADOS
  │                               │
  ├─ Cria sala ──────────────────►├─ Recebe código/QR
  │  (escolhe categoria)          │
  │                               ├─ Entram na sala
  │◄─────────────── Jogadores entram (lobby ao vivo)
  │
  ├─ Inicia partida (mínimo 2 jogadores presentes)
  │
  │  ┌──────────────────────────────────────────────┐
  │  │  LOOP — repetido 10 vezes                    │
  │  │                                              │
  │  │  Servidor envia pergunta + opções            │
  │  │  Timer de 15 s começa                        │
  │  │                                              │
  │  │  Cada jogador:                               │
  │  │    ├─ Toca uma opção (A/B/C/D)               │
  │  │    └─ Confirmação visual imediata (local)    │
  │  │                                              │
  │  │  Quando todos respondem OU timer expira:     │
  │  │    ├─ Servidor revela resposta correta       │
  │  │    ├─ Mostra quem respondeu o quê            │
  │  │    ├─ Exibe pontos ganhos nesta rodada       │
  │  │    └─ Pausa de reação social (2 s)           │
  │  │                                              │
  │  │  Placar parcial (2 s) → próxima pergunta     │
  │  └──────────────────────────────────────────────┘
  │
  ├─ Tela de resultado final
  │    ├─ Pódio (1º / 2º / 3º)
  │    ├─ Pontuação de cada jogador
  │    ├─ XP ganho + progresso de nível
  │    ├─ Conquistas desbloqueadas
  │    └─ Botões: Revanche | Sair
  │
  └─ Fim
```

### Detalhamento do Lobby

O host cria a sala e escolhe a categoria (ou "Aleatório"). Um código de 6 letras é gerado. Os outros jogadores entram pelo código ou por QR. O lobby exibe os avatares de todos ao vivo. O host vê um botão "Iniciar" que fica ativo quando há pelo menos 2 jogadores. Não existe temporizador de lobby — o host inicia quando quiser.

### Detalhamento da fase de pergunta

1. Contador 3-2-1 antes da primeira pergunta.
2. Pergunta aparece no topo. Quatro botões de opção embaixo (A/B/C/D) com cores distintas.
3. Timer visual (barra ou anel) regredindo. Nos últimos 5 segundos, o timer pisca.
4. Assim que o jogador toca uma opção, o botão é marcado visualmente (check). Não pode trocar.
5. Enquanto outros ainda decidem, o jogador vê "Aguardando X jogadores…" com silhuetas animadas.
6. Quando o tempo acaba ou todos responderam: reveal simultâneo.

### Detalhamento do Reveal

- A opção correta acende em verde.
- As respostas erradas escurecem.
- Avatares de quem acertou aparecem sobre a opção correta.
- Pontos ganhos flutuam sobre cada avatar (+450, +200, etc.).
- Jogadores sem resposta recebem um ícone de relógio (tempo esgotado).
- 2 segundos de reação: cada jogador pode tocar um emoji rápido (🔥 😂 💀 👏) que flutua na tela de todos. Opcional, sem consequência no jogo.

---

## 6. Regras detalhadas

### 6.1 Perguntas

- Cada partida tem exatamente **10 perguntas**.
- As perguntas são sorteadas sem repetição do banco da categoria escolhida.
- Cada pergunta tem exatamente **4 opções** (A, B, C, D), sendo exatamente 1 correta.
- Nenhuma pergunta usa "Todas as anteriores" ou "Nenhuma das anteriores" como opção válida.
- O texto da pergunta tem no máximo 120 caracteres. As opções têm no máximo 60 caracteres cada.

### 6.2 Timer

- Cada pergunta tem **15 segundos** de timer.
- O timer começa assim que a pergunta é exibida no cliente (sincronizado pelo servidor).
- Quando o timer expira, qualquer jogador que ainda não respondeu é marcado como "sem resposta" para aquela pergunta.
- "Sem resposta" não gera pontos nem desconto.

### 6.3 Resposta

- Cada jogador responde **individualmente e em paralelo** — não há turnos.
- A resposta é enviada ao servidor com o **timestamp do cliente**. O servidor valida que o timestamp é posterior ao início da pergunta e anterior ao seu fim.
- Cada jogador só pode responder uma vez por pergunta. Não é possível trocar a resposta após confirmação.
- A resposta é **oculta dos outros jogadores** até o reveal.

### 6.4 Perguntas finais (Modo Relâmpago)

- As **3 últimas perguntas** (8, 9 e 10) têm timer de **10 segundos** (não 15).
- Os pontos de base para resposta correta são os mesmos, mas o bônus de velocidade é maior em termos relativos (mais difícil ganhar o máximo).
- Isso é anunciado antes da pergunta 8 com um aviso: "⚡ Modo Relâmpago — últimas 3 perguntas!"
- Objetivo: criar viradas dramáticas sem invalidar a liderança de quem jogou bem.

### 6.5 Categorias disponíveis

| Código | Nome | Exemplos de temas |
|---|---|---|
| `geral` | Geral | Mistura de todas |
| `cultura_pop` | Cultura Pop | Filmes, séries, música, memes |
| `ciencia` | Ciência | Biologia, física, química, espaço |
| `historia` | História | Mundial e brasileira |
| `esportes` | Esportes | Futebol, Olimpíadas, F1 |
| `tecnologia` | Tecnologia | Apps, internet, programação |

O host escolhe uma categoria ao criar a sala. Com `geral`, o banco de perguntas mistura todas.

---

## 7. Sistema de pontuação

### 7.1 Fórmula base

```
pontos_rodada = pontos_base × multiplicador_streak × fator_velocidade
```

### 7.2 Pontos base por acerto

| Situação | Pontos |
|---|---|
| Resposta correta | **1000 pts** |
| Resposta errada | **−200 pts** |
| Sem resposta (tempo esgotado) | **0 pts** |

### 7.3 Bônus de velocidade

O bônus é calculado a partir do tempo de resposta em segundos (`t`), onde `t = 0` é o instante em que a pergunta apareceu.

**Perguntas normais (timer de 15 s):**

```
bônus_velocidade = max(0, floor(500 × (1 − t / 15)))
```

| Tempo de resposta | Bônus |
|---|---|
| ≤ 1 s | 500 pts |
| 3 s | 400 pts |
| 7 s | ~267 pts |
| 12 s | ~100 pts |
| 15 s | 0 pts |

**Perguntas Relâmpago (timer de 10 s):**

```
bônus_velocidade = max(0, floor(500 × (1 − t / 10)))
```

| Tempo de resposta | Bônus |
|---|---|
| ≤ 1 s | 500 pts |
| 3 s | 350 pts |
| 7 s | ~150 pts |
| 10 s | 0 pts |

### 7.4 Multiplicador de streak

Um streak é uma sequência de respostas corretas consecutivas. Sem resposta **não quebra** o streak. Resposta errada **quebra** o streak.

| Streak atual | Multiplicador |
|---|---|
| 0–1 acertos seguidos | 1× |
| 2 acertos seguidos | 1,5× |
| 3 acertos seguidos | 2× |
| 4+ acertos seguidos | 2,5× |

O multiplicador é aplicado **depois** do bônus de velocidade:

```
pontos_rodada = (1000 + bônus_velocidade) × multiplicador_streak
```

Em caso de resposta errada:
```
pontos_rodada = −200  (sem bônus, sem multiplicador)
```

### 7.5 Exemplo de partida

| Pergunta | Acerto? | Tempo | Streak | Cálculo | Pontos |
|---|---|---|---|---|---|
| 1 | ✅ | 4 s | 1× | (1000 + 433) × 1 | +1433 |
| 2 | ✅ | 2 s | 1,5× | (1000 + 467) × 1,5 | +2200 |
| 3 | ❌ | 9 s | — | -200 (streak zerado) | −200 |
| 4 | — | expirou | 0× | 0 | 0 |
| 5 | ✅ | 1 s | 1× | (1000 + 500) × 1 | +1500 |
| **Parcial** | | | | | **+4933** |

### 7.6 Pontuação máxima teórica

10 perguntas × (1000 + 500) × 2,5 = **37.500 pts**

(Responder tudo em < 1 s com streak de 4+ do começo ao fim — praticamente impossível, mas define o teto.)

---

## 8. Critérios de vitória

Ao final das 10 perguntas, o jogador com **maior pontuação total** vence.

Não existe requisito mínimo de pontuação para vencer. Um jogador pode vencer com pontuação negativa se todos os outros pontuarem ainda menos.

O resultado é determinado **exclusivamente pelo servidor** com base nas respostas e timestamps recebidos. Nenhum cliente influencia o resultado.

---

## 9. Critérios de empate

Em caso de pontuação idêntica entre dois ou mais jogadores:

1. **Desempate primário:** Número de respostas corretas. Quem acertou mais perguntas fica à frente.
2. **Desempate secundário:** Soma dos tempos de resposta nas perguntas acertadas. Quem levou menos tempo total fica à frente.
3. **Desempate terciário:** Quem entrou na sala primeiro (timestamp de join).

É matematicamente extremamente improvável chegar ao desempate terciário, mas o servidor o implementa para garantir uma ordem determinística sempre.

O empate **não existe como estado final** — sempre há um vencedor único. Porém, o pódio pode exibir dois jogadores no mesmo lugar se a diferença for de 0 pontos antes dos critérios de desempate serem aplicados, com a nota "Empate técnico (desempatado por velocidade)".

---

## 10. Sistema de XP

### 10.1 XP por partida

| Situação | XP |
|---|---|
| Participar de uma partida completa | 50 XP |
| Por cada resposta correta | 10 XP |
| Terminar em 1º lugar | 100 XP |
| Terminar em 2º lugar | 60 XP |
| Terminar em 3º lugar | 30 XP |
| Streak de 5+ acertos consecutivos | 25 XP bônus |
| Streak perfeito (10/10) | 100 XP bônus |

### 10.2 Teto e bônus social

- XP máximo por partida: **400 XP** (matematicamente).
- XP típico por partida: **100–180 XP**.
- **Bônus de amigo:** +10% de XP quando a partida inclui pelo menos 1 amigo na plataforma.

### 10.3 Relação XP × Nível

O sistema de níveis é global da plataforma (não específico de Faísca). O XP de Faísca soma ao XP total do jogador.

---

## 11. Sistema de conquistas

Todas as conquistas são permanentes. Uma vez obtidas, ficam no perfil para sempre.

### 11.1 Conquistas de desempenho

| ID | Nome | Descrição | Condição |
|---|---|---|---|
| `faísca_primeira_vitoria` | Primeiro Relâmpago | Vença sua primeira partida de Faísca | Terminar em 1º |
| `faísca_velocista` | Na Velocidade da Luz | Responda corretamente em menos de 1 s | Resposta correta com t ≤ 1 s |
| `faísca_perfeito` | Impecável | Acerte todas as 10 perguntas numa partida | 10/10 acertos |
| `faísca_relampago` | Relâmpago Puro | Acerte as 3 perguntas Relâmpago sem errar | Acertar Q8, Q9 e Q10 |
| `faísca_streak_maximo` | Eletrificado | Alcance multiplicador 2,5× (4+ streak) | Streak ≥ 4 |
| `faísca_virada` | Virada Heroica | Vença uma partida estando em último após 7 perguntas | Posição 1ª final, posição última após P7 |

### 11.2 Conquistas de volume

| ID | Nome | Descrição | Condição |
|---|---|---|---|
| `faísca_10_partidas` | Viciado em Faísca | Complete 10 partidas de Faísca | 10 partidas finalizadas |
| `faísca_100_partidas` | Veterano | Complete 100 partidas de Faísca | 100 partidas finalizadas |
| `faísca_100_acertos` | Banco de Respostas | Acerte 100 perguntas no total | Acumulado cross-partidas |

### 11.3 Conquistas sociais

| ID | Nome | Descrição | Condição |
|---|---|---|---|
| `faísca_anfitriao` | Anfitrião | Crie e finalize 5 partidas como host | 5 partidas como host |
| `faísca_social` | Faísca em Grupo | Jogue uma partida com 5 ou 6 jogadores | Partida com N ≥ 5 |
| `faísca_rival` | Rivalidade Saudável | Jogue 5 partidas contra o mesmo amigo | 5 partidas com amigo X |

### 11.4 Conquistas ocultas (reveladas só após desbloqueio)

| ID | Nome | Descrição | Condição |
|---|---|---|---|
| `faísca_azar` | Azar do Novato | Responda errado nas 10 perguntas numa partida | 0 acertos |
| `faísca_corajoso` | Corajoso ou Louco | Responda errado 3 vezes seguidas e ainda assim vença | 3 erros consecutivos + vitória |

---

## 12. Wireframes das telas

Os wireframes usam notação ASCII. Elementos entre `[ ]` são botões. Elementos entre `( )` são displays. `---` são divisórias. `···` são espaços de conteúdo variável.

---

### Tela 1 — Lobby (Host)

```
┌─────────────────────────────────┐
│  ◄  Faísca            🔧        │
├─────────────────────────────────┤
│                                 │
│         CÓDIGO DA SALA          │
│                                 │
│       ┌─────────────┐           │
│       │  R T 4 K 2 X│           │
│       └─────────────┘           │
│         [Copiar] [QR]           │
│                                 │
│  Categoria: Cultura Pop  [▼]    │
│                                 │
├─────────────────────────────────┤
│  JOGADORES (3/6)                │
│                                 │
│  🟢 você (host)         ···     │
│  🟢 ana_silva           ···     │
│  🟢 pedro42             ···     │
│  🔘 Aguardando...       ···     │
│  🔘 Aguardando...       ···     │
│                                 │
├─────────────────────────────────┤
│                                 │
│        [ INICIAR PARTIDA ]      │
│     (mínimo 2 jogadores)        │
│                                 │
└─────────────────────────────────┘
```

---

### Tela 2 — Lobby (Convidado)

```
┌─────────────────────────────────┐
│  ◄  Faísca                      │
├─────────────────────────────────┤
│                                 │
│    Sala de  joao_host           │
│    Categoria: Cultura Pop       │
│                                 │
├─────────────────────────────────┤
│  JOGADORES (3/6)                │
│                                 │
│  👑 joao_host           ···     │
│  🟢 ana_silva  ← você   ···     │
│  🟢 pedro42             ···     │
│  🔘 Aguardando...               │
│                                 │
├─────────────────────────────────┤
│                                 │
│    Aguardando o host iniciar…   │
│            ⟳                   │
│                                 │
└─────────────────────────────────┘
```

---

### Tela 3 — Countdown

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│         Cultura Pop             │
│         10 perguntas            │
│                                 │
│                                 │
│              2                  │
│       (animação pulsando)       │
│                                 │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

---

### Tela 4 — Pergunta (aguardando resposta)

```
┌─────────────────────────────────┐
│  P 3 / 1 0          ████░░  8s │
│  streak: 🔥🔥  ×2,5            │
├─────────────────────────────────┤
│                                 │
│  Qual foi o primeiro álbum de   │
│  estúdio de Beyoncé?            │
│                                 │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌────────────────────────────┐ │
│  │ A  Dangerously in Love     │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ B  Lemonade                │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ C  4                       │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ D  Renaissance             │ │
│  └────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

### Tela 5 — Aguardando outros (após responder)

```
┌─────────────────────────────────┐
│  P 3 / 1 0          ████░░  8s │
│  streak: 🔥🔥  ×2,5            │
├─────────────────────────────────┤
│                                 │
│  Qual foi o primeiro álbum de   │
│  estúdio de Beyoncé?            │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌────────────────────────────┐ │
│  │ A  Dangerously in Love  ✓  │ │  ← selecionada (azul)
│  └────────────────────────────┘ │
│  │ B  Lemonade                │  │
│  │ C  4                       │  │
│  │ D  Renaissance             │  │
│                                 │
├─────────────────────────────────┤
│                                 │
│   Sua resposta foi enviada ✓    │
│   Aguardando 2 jogadores…       │
│   👤 ···   👤 ···               │
│                                 │
└─────────────────────────────────┘
```

---

### Tela 6 — Reveal

```
┌─────────────────────────────────┐
│  P 3 / 1 0                     │
├─────────────────────────────────┤
│                                 │
│  Qual foi o primeiro álbum de   │
│  estúdio de Beyoncé?            │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌────────────────────────────┐ │
│  │ ✅ A  Dangerously in Love  │ │  ← verde, correto
│  │   👤ana 👤você             │ │  ← avatares de quem acertou
│  └────────────────────────────┘ │
│                                 │
│  │ ❌ B  Lemonade  👤pedro    │  │  ← escuro, errou
│  │ ⬜ C  4                    │  │  ← ninguém escolheu
│  │ ⬜ D  Renaissance          │  │
│                                 │
├─────────────────────────────────┤
│  você:  +2200  🔥🔥 streak ×2  │
│  ana:   +1800  🔥🔥            │
│  pedro: −200   💔 streak zerou │
├─────────────────────────────────┤
│  Reação rápida:                 │
│  [ 🔥 ]  [ 😂 ]  [ 💀 ]  [ 👏 ]│
└─────────────────────────────────┘
```

---

### Tela 7 — Placar parcial (entre perguntas)

```
┌─────────────────────────────────┐
│           PLACAR                │
│         P 3 de 10               │
├─────────────────────────────────┤
│                                 │
│  🥇  você          7.233 pts   │
│  🥈  ana_silva     6.100 pts   │
│  🥉  pedro42       4.450 pts   │
│                                 │
├─────────────────────────────────┤
│  ⚡ Modo Relâmpago em 5 pergs!  │
│  (aviso aparece na pergunta 4)  │
└─────────────────────────────────┘
```

---

### Tela 8 — Aviso: Modo Relâmpago

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│          ⚡ ⚡ ⚡                │
│                                 │
│      MODO RELÂMPAGO             │
│    Últimas 3 perguntas          │
│                                 │
│  Timer: 10 s (era 15 s)        │
│  Bônus de velocidade maior!    │
│                                 │
│    Tudo pode mudar agora.       │
│                                 │
│                                 │
└─────────────────────────────────┘
```

---

### Tela 9 — Resultado final

```
┌─────────────────────────────────┐
│          FIM DE JOGO            │
│         Cultura Pop             │
├─────────────────────────────────┤
│                                 │
│         🥇                      │
│       você                     │
│     18.450 pts                  │
│                                 │
│  🥈 ana_silva   15.200 pts     │
│  🥉 pedro42     11.800 pts     │
│                                 │
├─────────────────────────────────┤
│  Seu resultado                  │
│  Acertos: 9/10  |  Streak max: 6│
│                                 │
│  XP ganho:  +180 ✨             │
│  Progresso: ████████░░  Nv 12  │
│                                 │
│  🏆 Conquista desbloqueada!     │
│     Impecável (9/10 acertos)    │
├─────────────────────────────────┤
│                                 │
│  [ REVANCHE ]    [ SAIR ]       │
│                                 │
└─────────────────────────────────┘
```

---

## 13. Estados da partida

O campo `status` da sessão no banco segue os estados definidos pela plataforma, com semântica específica para Faísca:

| Estado | Código interno | Descrição |
|---|---|---|
| Lobby | `waiting` | Jogadores entrando, host ainda não iniciou |
| Em jogo | `playing` | Partida ativa, perguntas sendo enviadas |
| Abandonada | `abandoned` | Menos de 2 jogadores conectados por mais de 30 s |
| Finalizada | `finished` | 10ª pergunta revelada, resultado computado |

### Subestados dentro de `playing`

Estes subestados não existem no banco — são gerenciados exclusivamente no `state` JSONB da sessão:

| Subestado | Campo `state.phase` | Descrição |
|---|---|---|
| Pergunta ativa | `"question"` | Timer correndo, respostas sendo aceitas |
| Reveal | `"reveal"` | Resposta revelada, pausa de reação (2 s) |
| Placar | `"scoreboard"` | Placar parcial entre perguntas (2 s) |
| Aviso Relâmpago | `"lightning_warning"` | Tela de aviso antes da pergunta 8 (3 s) |
| Placar final | `"final"` | Resultado calculado, sessão ainda `playing` antes de transitar para `finished` |

---

## 14. Ações do jogador

Ações enviadas pelo cliente ao servidor via a rota `POST /api/v1/sessions/:id/action`.

### 14.1 `ANSWER`

Enviada quando o jogador toca uma opção.

```json
{
  "type": "ANSWER",
  "payload": {
    "questionIndex": 2,
    "optionIndex": 0,
    "clientTimestamp": 1722123456789
  }
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `questionIndex` | `number` | Índice da pergunta (0–9) |
| `optionIndex` | `number` | Opção escolhida (0 = A, 1 = B, 2 = C, 3 = D) |
| `clientTimestamp` | `number` | Milliseconds epoch no momento do toque |

**Validações do servidor:**
- `questionIndex` deve ser igual ao índice atual da sessão
- `optionIndex` deve ser 0, 1, 2 ou 3
- O jogador ainda não pode ter respondido esta pergunta
- O `clientTimestamp` deve ser ≥ `questionStartedAt` e ≤ `questionStartedAt + 15000`
- Se o timer já expirou no servidor, a ação é ignorada silenciosamente (não gera erro)

**Respostas possíveis:**
- `201` — Resposta registrada
- `409` — Já respondeu ou timer expirado

---

### 14.2 `REACT`

Enviada quando o jogador toca um emoji durante o reveal.

```json
{
  "type": "REACT",
  "payload": {
    "questionIndex": 2,
    "emoji": "🔥"
  }
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `questionIndex` | `number` | Deve ser o índice da pergunta em reveal |
| `emoji` | `string` | Um dos 4 emojis válidos: `"🔥"`, `"😂"`, `"💀"`, `"👏"` |

**Validações do servidor:**
- A fase atual deve ser `"reveal"`
- O emoji deve ser um dos 4 permitidos
- Cada jogador pode reagir no máximo **uma vez por reveal**
- Sem impacto em pontuação

---

### 14.3 `START` *(host only)*

Enviada pelo host para iniciar a partida (saindo do lobby).

```json
{
  "type": "START",
  "payload": {}
}
```

**Validações do servidor:**
- Enviador deve ser o host da sala
- Deve haver pelo menos 2 jogadores conectados
- Estado atual deve ser `waiting`

---

### 14.4 `REMATCH` *(host only)*

Enviada pelo host para iniciar nova partida com os mesmos jogadores após o `finished`.

```json
{
  "type": "REMATCH",
  "payload": {
    "category": "cultura_pop"
  }
}
```

O servidor cria uma nova sessão e notifica todos os jogadores da sala.

---

## 15. Eventos do servidor

Eventos enviados via Server-Sent Events (SSE) ou polling de estado — dependendo da estratégia de tempo real adotada na Fase 2B.

O `state` JSONB da sessão serve como fonte da verdade. Os eventos abaixo são enviados para todos os participantes quando o estado muda.

### 15.1 `session.player_joined`
```json
{
  "event": "session.player_joined",
  "data": {
    "userId": "abc123",
    "username": "pedro42",
    "playerCount": 3
  }
}
```

### 15.2 `session.player_left`
```json
{
  "event": "session.player_left",
  "data": {
    "userId": "abc123",
    "username": "pedro42",
    "playerCount": 2,
    "isHost": false
  }
}
```

### 15.3 `session.started`
```json
{
  "event": "session.started",
  "data": {
    "category": "cultura_pop",
    "totalQuestions": 10
  }
}
```

### 15.4 `session.question`
```json
{
  "event": "session.question",
  "data": {
    "index": 2,
    "total": 10,
    "text": "Qual foi o primeiro álbum de estúdio de Beyoncé?",
    "options": [
      "Dangerously in Love",
      "Lemonade",
      "4",
      "Renaissance"
    ],
    "timerSeconds": 15,
    "startsAt": 1722123456000
  }
}
```

**Nota:** A resposta correta **não** é incluída neste evento. É revelada apenas em `session.reveal`.

### 15.5 `session.player_answered`
```json
{
  "event": "session.player_answered",
  "data": {
    "questionIndex": 2,
    "answeredCount": 2,
    "totalPlayers": 3
  }
}
```

Enviado cada vez que um jogador responde. Não revela a resposta — apenas atualiza o contador "aguardando X jogadores".

### 15.6 `session.reveal`
```json
{
  "event": "session.reveal",
  "data": {
    "questionIndex": 2,
    "correctOptionIndex": 0,
    "answers": [
      {
        "userId": "u1",
        "optionIndex": 0,
        "responseTimeMs": 3200,
        "pointsEarned": 2200,
        "streak": 2,
        "multiplier": 1.5,
        "noAnswer": false
      },
      {
        "userId": "u2",
        "optionIndex": 1,
        "responseTimeMs": 7800,
        "pointsEarned": -200,
        "streak": 0,
        "multiplier": 1.0,
        "noAnswer": false
      },
      {
        "userId": "u3",
        "optionIndex": null,
        "responseTimeMs": null,
        "pointsEarned": 0,
        "streak": 3,
        "multiplier": 2.0,
        "noAnswer": true
      }
    ],
    "revealDurationMs": 2000
  }
}
```

### 15.7 `session.react`
```json
{
  "event": "session.react",
  "data": {
    "userId": "u2",
    "username": "pedro42",
    "emoji": "💀"
  }
}
```

### 15.8 `session.scoreboard`
```json
{
  "event": "session.scoreboard",
  "data": {
    "questionIndex": 2,
    "rankings": [
      { "userId": "u1", "username": "você",     "score": 7233, "rank": 1 },
      { "userId": "u2", "username": "ana_silva", "score": 6100, "rank": 2 },
      { "userId": "u3", "username": "pedro42",   "score": 4450, "rank": 3 }
    ],
    "nextIn": "question",
    "displayDurationMs": 2000
  }
}
```

### 15.9 `session.lightning_warning`
```json
{
  "event": "session.lightning_warning",
  "data": {
    "displayDurationMs": 3000
  }
}
```

### 15.10 `session.finished`
```json
{
  "event": "session.finished",
  "data": {
    "finalRankings": [
      {
        "userId": "u1",
        "username": "você",
        "score": 18450,
        "rank": 1,
        "correctAnswers": 9,
        "maxStreak": 6,
        "xpEarned": 180,
        "achievements": ["faísca_impecavel"]
      }
    ],
    "tiebreakApplied": false
  }
}
```

### 15.11 `session.abandoned`
```json
{
  "event": "session.abandoned",
  "data": {
    "reason": "insufficient_players",
    "disconnectedUserId": "u2"
  }
}
```

---

## 16. Reconexão

### 16.1 Fluxo de reconexão

Quando um jogador perde a conexão e retorna (dentro de 30 s):

1. O cliente detecta a perda de conexão e exibe "Reconectando…".
2. O cliente chama `GET /api/v1/sessions/:id` para obter o estado atual da sessão.
3. O servidor retorna o `state` completo, incluindo a pergunta atual, o índice, o timer e as respostas já registradas.
4. O cliente sincroniza o timer localmente com base em `startsAt` + tempo decorrido.
5. O jogador pode responder normalmente se o timer ainda estiver ativo.

### 16.2 O que o jogador perde

- Se a reconexão ocorre **durante** uma pergunta: pode ainda responder se o timer não expirou.
- Se a reconexão ocorre **durante** o reveal: vê o reveal normalmente, não pode reagir (a janela já passou).
- Se a reconexão ocorre **durante** o scoreboard: vê o placar normalmente.
- Respostas que não foram enviadas antes da desconexão: contam como "sem resposta" (0 pts, streak não quebrado).

### 16.3 Janela de reconexão

| Situação | Comportamento |
|---|---|
| Desconectado < 30 s | Reconectado automaticamente, estado sincronizado |
| Desconectado 30–120 s | Pode reconectar manualmente, mas pergunta(s) podem ter passado |
| Desconectado > 120 s | Jogador marcado como "offline" em definitivo para esta partida |

### 16.4 Impacto no jogo

- O jogo **não pausa** por desconexão de um jogador. A partida continua.
- Se um jogador desconecta e não volta, suas perguntas são contadas como "sem resposta".
- A desconexão de um jogador é comunicada a todos via `session.player_left`.

---

## 17. Casos extremos

### 17.1 Desconexão do host durante o lobby

**Situação:** O host sai antes de iniciar.  
**Tratamento:** A sala é transferida ao próximo jogador conectado (por ordem de entrada). O novo host recebe um aviso e pode iniciar ou aguardar.

### 17.2 Desconexão do host durante a partida

**Situação:** O host desconecta enquanto a partida roda.  
**Tratamento:** A partida continua normalmente. O host não tem papel especial durante o jogo — apenas no lobby. O controle de progressão é do servidor.

### 17.3 Sobram menos de 2 jogadores durante a partida

**Situação:** Jogadores suficientes desconectam ao ponto de restar apenas 1.  
**Tratamento:**
1. Servidor aguarda 30 s pelo retorno dos jogadores.
2. Exibe "Aguardando jogadores… 30s" para o jogador restante.
3. Se após 30 s ainda há apenas 1 jogador, a sessão transita para `abandoned`.
4. Nenhum XP é concedido por partida abandonada (mas XP de perguntas já acertadas pode ser computado — a ser definido na Fase 2A).
5. O jogador restante recebe: "Partida encerrada por falta de jogadores."

### 17.4 Timer expira sem nenhuma resposta

**Situação:** Todos os jogadores deixam o tempo passar sem responder.  
**Tratamento:** O servidor processa o reveal normalmente. Todos recebem 0 pts para aquela pergunta. O streak não é afetado. A partida segue.

### 17.5 Empate perfeito

**Situação:** Dois ou mais jogadores terminam com a mesma pontuação.  
**Tratamento:** Desempate sequencial conforme definido na seção 9. Sempre haverá um vencedor único.

### 17.6 Resposta chegando após o timer do servidor

**Situação:** Latência alta faz a resposta do cliente chegar ao servidor depois do deadline.  
**Tratamento:** O servidor valida o `clientTimestamp`. Se o timestamp do cliente indica que o jogador respondeu **dentro** do período válido, a resposta é aceita com uma tolerância de latência de **200 ms** (fora disso, ignorada). Isso evita punir jogadores por latência de rede fora do controle deles, mas limita a janela de exploração.

### 17.7 Tentativa de enviar resposta duas vezes

**Situação:** Bug de cliente envia a mesma resposta duas vezes.  
**Tratamento:** O servidor usa o `version` de lock otimista. A segunda ação é ignorada silenciosamente com `409 Conflict`.

### 17.8 Banco de perguntas esgotado para a categoria

**Situação:** A categoria tem menos de 10 perguntas disponíveis.  
**Tratamento:** O servidor lança um erro antes de iniciar a partida ("Não há perguntas suficientes nesta categoria. Tente outra ou use Geral."). A partida não começa.

### 17.9 Jogador entra após a partida ter começado

**Situação:** Um jogador digita o código correto mas a partida já rodando.  
**Tratamento:** O servidor retorna erro `409 — Partida em andamento`. O jogador não pode entrar. Pode apenas assistir à próxima.

### 17.10 Perda total do estado do servidor (crash)

**Situação:** O servidor reinicia no meio de uma partida.  
**Tratamento:** O estado persiste no banco (JSONB + `version`). Ao reconectar, o cliente chama `GET /api/v1/sessions/:id` e a partida resume do ponto em que parou. Se o servidor crashou durante um reveal que não foi commitado, a pergunta é repetida a partir do último estado salvo.

---

## 18. Por que é divertido

**1. Cada segundo tem peso.**  
A fórmula de pontuação não é binária (acertou ou errou). Um acerto lento vale bem menos que um acerto rápido. Isso cria tensão real no timer — o jogador sente a pressão de cada segundo que passa enquanto ainda está decidindo.

**2. Errar dói.**  
O −200 por resposta errada não é destruidor, mas é perceptível. O jogador que "chuta" sem pensar paga o preço. Isso cria decisões genuínas: "vale a pena arriscar com 8 s restantes?"

**3. O streak cria personagens na mesa.**  
Quando alguém atinge ×2,5 de multiplicador, todos percebem. Quebrar o streak do líder vira objetivo coletivo tácito. Quando o streak cai, há reação emocional.

**4. As 3 perguntas finais mudam tudo.**  
O Modo Relâmpago garante que ninguém pode relaxar depois da pergunta 7. Uma virada da última para primeira é tecnicamente possível e narrativamente épica. Isso mantém todos engajados até o fim.

**5. O reveal é um momento social.**  
Ver as respostas dos outros aparecerem ao mesmo tempo — quem acertou, quem errou, o tempo de cada um — cria reações genuínas. Os emojis de reação transformam esse momento num ritual de grupo.

**6. Partidas curtas criam loops.**  
Com 5 minutos no total, uma partida cabe em qualquer pausa. O botão de revanche imediata é irresistível: "eu venci, de novo?" ou "eu perdi, dessa vez vai."

---

## 19. Diferenciação

### Em relação a quizzes tradicionais (Kahoot, Trivia Crack)

| Característica | Concorrentes típicos | Faísca |
|---|---|---|
| Modo de resposta | Turnos ou individual | Simultâneo, todos ao mesmo tempo |
| Eliminação | Frequente | Não existe — todos jogam até o fim |
| Duração | 10–30 min | ~5 min |
| Punição por erro | Nenhuma ou eliminação | −200 pts (risco controlado) |
| Streaks | Ausente ou decorativo | Mecânica central com multiplicador |
| Tempo real dos outros | Placar pós-pergunta | Contador ao vivo de quantos já responderam |
| Reação social | Ausente | Emojis de reação no reveal |
| Virada garantida | Improvável | Modo Relâmpago (últimas 3 perguntas) |

### O que não vamos fazer

- Não há vidas ou continues.
- Não há power-ups ou itens compráveis.
- Não há modo assíncrono (perguntas respondidas em horários diferentes).
- Não há anúncios ou interrupções no fluxo de jogo.
- Não há perguntas com mais de uma resposta correta.

A aposta é em **profundidade de execução** sobre breadth de features. Um loop simples, polido, rápido e justo.

---

## 20. Métricas de sucesso

### 20.1 Retenção

| Métrica | Meta 30 dias pós-lançamento |
|---|---|
| D1 Retention (jogou no dia seguinte) | ≥ 40% |
| D7 Retention | ≥ 20% |
| Sessões por usuário ativo / semana | ≥ 3 |

### 20.2 Engajamento por sessão

| Métrica | Meta |
|---|---|
| Taxa de partida completa (não abandonadas) | ≥ 85% |
| Taxa de revanche imediata | ≥ 35% |
| Taxa de uso de emojis de reação | ≥ 60% das partidas |
| Jogadores por partida (média) | ≥ 3,2 |

### 20.3 Qualidade do design

| Métrica | Meta |
|---|---|
| Distribuição de vencedores | Nenhum jogador vence > 60% das partidas em grupos estáveis (sinal de balance) |
| Taxa de viradas nas 3 últimas perguntas | ≥ 15% das partidas (Modo Relâmpago está funcionando) |
| Taxa de resposta dentro do timer | ≥ 80% das perguntas (timer de 15 s não é curto demais) |
| Score médio por partida | Entre 8.000 e 22.000 pts (jogadores estão engajados mas não dominando) |

### 20.4 Saúde da plataforma

| Métrica | Meta |
|---|---|
| Faísca como % do total de sessões no OneTap | ≥ 70% (é o único jogo no lançamento) |
| Conversão: usuário registrou → jogou Faísca | ≥ 50% |
| NPS implícito: revivals após 7 dias de inatividade | Monitorar |

### 20.5 O que indicaria que o jogo falhou

- Taxa de abandono de partida > 30%.
- D1 Retention < 25%.
- Revanche < 15% (partidas únicas, sem loop).
- Feedback qualitativo consistente de "timer muito curto" ou "muito punitivo".

Se qualquer um dos sinais de falha aparecer antes de 30 dias, o GDD será revisado antes de construir o segundo jogo.

---

*Documento criado para aprovação antes da implementação. Nenhum código será escrito até este GDD estar aprovado.*
