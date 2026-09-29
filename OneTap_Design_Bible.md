# OneTap Design Bible
**Versão 1.0 — Documento de Fundação da Plataforma**

---

## 1. Visão da Plataforma

**OneTap** é uma plataforma mobile de jogos multiplayer sociais, projetada para grupos de amigos que querem diversão instantânea — a qualquer hora, em qualquer lugar, sem curva de aprendizado, sem barreiras de entrada e sem recompensas pagas que desequilibrem a experiência.

**Proposta central:**
> "Uma partida começa em um toque. A vontade de jogar mais uma não termina."

A plataforma não é um jogo — é uma casa onde vivem vários jogos. Cada jogo compartilha a mesma infraestrutura de social, progressão e identidade, mas possui mecânica, identidade visual e sensação únicas.

**Princípio fundador:** Momentos inesperados entre amigos reais valem mais do que qualquer conquista individual.

---

## 2. Público-Alvo

### Perfil Primário — "O Grupo"
- **Idade:** 16–34 anos
- **Contexto:** Grupos de amigos no WhatsApp, Discord ou convivência presencial
- **Comportamento:** Jogam em intervalos curtos (transporte, pausa no trabalho, reuniões informais)
- **Motivação:** Competir com quem conhecem, criar memórias e histórias para contar
- **Dispositivo:** Smartphone como plataforma principal de entretenimento

### Perfil Secundário — "O Casual Competitivo"
- **Idade:** 25–45 anos
- **Contexto:** Joga solo mas quer disputar rankings globais
- **Comportamento:** Sessões curtas e frequentes ao longo do dia
- **Motivação:** Superação pessoal e status social dentro da plataforma

### Perfil Terciário — "O Organizador"
- **Perfil:** Cria campeonatos dentro do próprio grupo, lidera temporadas, convida novos membros
- **Motivação:** Ser a referência social do grupo

### O que une todos:
- Não têm tempo para jogos que exigem horas de dedicação
- Querem vitórias e derrotas que virem assunto
- Rejeitam vantagens compradas — a habilidade deve ser o diferencial

---

## 3. Filosofia do Produto

### Os 8 Mandamentos do OneTap

1. **Partidas Rápidas São Sagradas**
   Nenhum jogo deve ultrapassar 5 minutos. Se ultrapassar, o design está errado.

2. **30 Segundos Para Entender, Uma Vida Para Dominar**
   Qualquer novo usuário deve conseguir jogar sem tutorial. A profundidade se revela com o tempo.

3. **Momentos Inesperados São o Produto**
   O design deve intencionalmente criar situações imprevisíveis que gerem reações genuínas: gargalhadas, traições, reviravoltas e gritos.

4. **Zero Pay-to-Win, Sempre**
   Dinheiro compra estética e conveniência. Habilidade compra vitórias. Essa linha nunca pode ser cruzada.

5. **A Diversão Social Vem Primeiro**
   Um jogo que é mais divertido com amigos do que sozinho é superior a um jogo que é apenas tecnicamente impressionante.

6. **O Fracasso Deve Ser Divertido**
   Perder no OneTap deve gerar vontade de revanche, não frustração. O design de derrota é tão importante quanto o design de vitória.

7. **Identidade Original ou Descarte Total**
   Antes de aceitar qualquer mecânica, perguntar: "Esse jogo tem identidade própria ou parece uma cópia?" Se a resposta for dúvida, descartar e recomeçar.

8. **A Plataforma É o Personagem**
   OneTap tem uma personalidade: irreverente, inclusiva, competitiva mas acolhedora. Cada decisão de design deve reforçar essa identidade.

---

## 4. Arquitetura Recomendada

### Modelo: Plataforma Modular com Núcleo Compartilhado

```
┌──────────────────────────────────────────────────────────┐
│                    ONETAP CORE                           │
│  Auth · Amigos · Salas · Convites · Ranking · Perfil     │
│  Conquistas · Temporadas · Campeonatos · Assinatura Plus │
└──────────────┬───────────────────────────────────────────┘
               │  SDK de Jogo (Interface Padrão)
       ┌───────┼───────┐
       ▼       ▼       ▼
  [Jogo A] [Jogo B] [Jogo C]   ← Módulos independentes
```

### Camadas da Arquitetura

| Camada | Responsabilidade |
|--------|-----------------|
| **Core Layer** | Autenticação, perfil, amigos, notificações, pagamentos, i18n |
| **Social Layer** | Salas, convites, chat de partida, emotes, feed de atividades |
| **Game SDK Layer** | Interface padronizada que cada jogo implementa (estados, eventos, resultado) |
| **Game Modules** | Lógica específica de cada jogo, completamente isolada do núcleo |
| **Presentation Layer** | UI compartilhada (lobby, ranking, perfil) + UI específica por jogo |

### Princípios de Arquitetura

- **Isolamento total dos jogos:** Um jogo não conhece outro. Falha em um não afeta os demais.
- **Contratos claros via SDK:** Todo jogo recebe e devolve dados pelo mesmo protocolo.
- **Backend stateless por jogo:** O estado de partida vive no servidor de jogo. O Core só sabe o resultado.
- **Sincronização por eventos:** Comunicação via WebSocket para partidas em tempo real.
- **Feature flags por jogo:** Novos jogos entram em beta para grupos selecionados antes do lançamento global.

---

## 5. Estrutura Técnica

### Frontend Mobile
- **Framework:** React Native (Expo) — único codebase para iOS e Android
- **Navegação:** Expo Router com tabs principais: Jogar, Social, Perfil, Loja
- **Estado global:** Zustand (leve, sem boilerplate)
- **Animações:** Reanimated 3 + Skia (para efeitos visuais dos jogos)
- **Tempo real:** Socket.io client

### Backend
- **API principal (Core):** Node.js + Express, REST com OpenAPI
- **Servidores de jogo:** Node.js com Socket.io — um servidor por tipo de jogo, escalável horizontalmente
- **Banco de dados:** PostgreSQL (dados persistentes) + Redis (estado de sala e partida em tempo real)
- **Autenticação:** JWT + refresh tokens, login com Google, Apple e número de telefone
- **Armazenamento:** S3-compatible (avatares, assets de jogos)
- **Notificações push:** Firebase Cloud Messaging

### Internacionalização (i18n)
- Detecção automática do idioma do dispositivo (pt-BR e en-US no lançamento)
- Todas as strings externalizadas em arquivos de tradução (i18next)
- Datas, números e moedas formatados por locale
- Jogos podem ter textos próprios, mas herdam o sistema de i18n do Core

### Estrutura de Salas e Matchmaking

```
Criar Sala ──► Sala Privada (código/QR) ──► Jogo com Amigos
            └► Sala Pública (matchmaking) ──► Jogo com Desconhecidos
                          ▲
                   Filtros: região, nível
```

- Salas suportam 2–16 jogadores (variável por jogo)
- Código de sala de 6 caracteres alfanuméricos
- Link de convite compartilhável (abre o app ou a loja se não instalado)
- Espectadores permitidos em jogos que suportam (configurável por jogo)

---

## 6. Fluxo dos Usuários

### Jornada do Novo Usuário

```
Instalação
    │
    ▼
Onboarding (máx. 3 telas, sem obrigação de conta)
    │
    ▼
Jogar como Convidado (1 partida demonstrativa offline ou bot)
    │
    ▼
Criar Conta (Google / Apple / Telefone)
    │
    ▼
Escolher Avatar + Nome
    │
    ▼
Convite para adicionar amigos (contatos / link)
    │
    ▼
Tela Principal
```

### Jornada da Partida (com amigos)

```
Tela Principal
    │
    ▼
Escolher Jogo
    │
    ▼
Criar Sala ──► Compartilhar link/código
    │
    ▼
Amigos entram na sala
    │
    ▼
Lobby (chat, configurações da partida)
    │
    ▼
Contagem regressiva (3, 2, 1...)
    │
    ▼
Partida (2-5 minutos)
    │
    ▼
Tela de Resultado (animada, compartilhável)
    │
    ├──► Revanche (mesmo grupo, mesma sala)
    ├──► Próximo Jogo (troca de jogo)
    └──► Sair (XP e conquistas creditados)
```

### Tela de Resultado — Momentos Compartilháveis
A tela de resultado deve ser desenhada para ser screenshot/vídeo-compartilhável:
- Placar dramático com animação de entrada
- Destaque do "MVP da Partida" com estatística inusitada (ex: "Traiu os aliados 3 vezes")
- Botão de compartilhar com card visual gerado automaticamente
- Emotes e reações entre jogadores em tempo real

---

## 7. Estratégia de Crescimento

### Fase 1 — Fundação (Meses 1–3)
- Lançamento com **3 jogos** originais de mecânicas distintas
- Foco em grupos fechados: convite por link, sala privada
- Métricas-alvo: **retenção D7 > 40%**, **sessões por usuário > 3/semana**
- Sem campanhas pagas ainda — crescimento orgânico via compartilhamento

### Fase 2 — Viralização (Meses 4–6)
- Sistema de desafios semanais com placar público
- "Clips da Semana" — momentos engraçados gerados automaticamente
- Integração com WhatsApp: bot que anuncia resultados no grupo
- Parcerias com criadores de conteúdo (streamers de mobile, influenciadores de jogos casuais)

### Fase 3 — Comunidade (Meses 7–12)
- Campeonatos criados por usuários com prêmios digitais
- Temporadas temáticas (novos cosméticos, desafios exclusivos)
- Expansão de jogos: mínimo 2 novos jogos por trimestre
- Programa de criadores: usuários propõem mecânicas, melhores são desenvolvidas

### Loops de Retenção

| Loop | Frequência | Mecânica |
|------|-----------|---------|
| **Micro** | Diário | Recompensa de login diário, desafio rápido |
| **Médio** | Semanal | Torneio de fim de semana, missões de grupo |
| **Macro** | Mensal | Temporada com narrativa, ranking resetado |
| **Social** | Contínuo | Conquistas visíveis no perfil, feed de atividades de amigos |

---

## 8. Estratégia de Monetização Sem Pay-to-Win

### Princípio Absoluto
**Nenhum item comprado com dinheiro real pode alterar o resultado de uma partida.**

### Fontes de Receita

#### 8.1 OneTap Plus (Assinatura)
- **Preço:** ~R$14,90/mês ou R$99,90/ano
- **O que inclui:**
  - Acesso antecipado a novos jogos (beta exclusivo)
  - Criação de campeonatos personalizados (limite maior de participantes)
  - Temas exclusivos de sala e lobby
  - XP bônus (acelera progressão cosmética, não dá vantagem)
  - Suporte prioritário
  - Sem anúncios
- **O que NÃO inclui:** Nenhuma vantagem em partida, personagens exclusivos com bônus, habilidades especiais

#### 8.2 Cosméticos Avulsos (Loja)
- Avatares e frames de perfil
- Emotes e reações de partida
- Efeitos visuais de vitória (explosões, fogos de artifício)
- Temas visuais de jogo (muda estética, não mecânica)
- Cards de resultado personalizados

#### 8.3 Campeonatos com Entrada (Futuro)
- Torneios com taxa de inscrição e premiação em créditos OneTap
- Créditos podem ser trocados por cosméticos
- Nunca por dinheiro real (evita regulação de apostas)

#### 8.4 Anúncios (Usuários Free, Opcional)
- Apenas entre partidas, nunca durante
- Modelo "Recompensado": assiste anúncio para ganhar XP bônus
- Anúncios removidos automaticamente para assinantes Plus

### O Teste de Pay-to-Win
Antes de lançar qualquer item pago, aplicar o teste:
> "Um jogador free que joga 3 horas por semana pode derrotar um jogador Plus que comprou todos os itens?"
> Se a resposta for NÃO, o item não pode ser vendido.

---

## 9. Diretrizes para Criação de Jogos Originais

### O Teste de Identidade
Antes de desenvolver qualquer jogo, responder:
> **"Esse jogo tem identidade própria ou parece apenas uma cópia de outro?"**
> Se houver dúvida, a resposta é NÃO. Descartar e criar outra ideia.

### Os 5 Pilares de um Jogo OneTap

**1. Gancho Imediato**
O jogador deve entender o objetivo em menos de 10 segundos observando uma partida em andamento. Se precisar de explicação verbal, o design falhou.

**2. Tensão Escalante**
A partida deve ter uma curva de tensão: início tranquilo, meio competitivo, final frenético. Os últimos 30 segundos precisam ser sempre os mais intensos.

**3. Virada Possível**
Quem está perdendo sempre deve ter uma chance matemática de virar. Jogos onde o líder apenas "administra" a vitória são chatos para os perdedores e sem graça para os vencedores.

**4. Culpa Divertida**
O jogo deve gerar situações onde um jogador "faz algo" para outro — trair, bloquear, roubar, surpreender. Esses momentos viram histórias. Histórias trazem de volta.

**5. Habilidade com Sorte Temperada**
Sorte suficiente para o novato ter momentos gloriosos. Habilidade suficiente para o veterano dominar no longo prazo. Equilíbrio: ~70% habilidade, ~30% variância.

### Categorias de Mecânica Permitidas
- Dedução e blefe
- Reação e timing
- Estratégia em tempo real
- Cooperação com traição opcional
- Conhecimento e trivia com twist
- Física e habilidade motora
- Construção e destruição rápida

### O Que Jamais Copiar
- Personagens, nomes, arte, mapas ou histórias de jogos existentes
- Regras específicas protegidas por IP
- Sistemas de progressão idênticos a concorrentes
- Nomes de habilidades, itens ou facções de outros jogos

### O Que É Permitido Usar Como Inspiração
- **Princípios psicológicos:** Tensão, recompensa variável, progressão visível
- **Estruturas genéricas:** "Últimos sobreviventes", "equipes", "turnos", "tempo limite"
- **Mecânicas de domínio público:** Blefe, leilão, votação, racing
- **Emoções-alvo:** O que faz o jogador gargalhar, gritar ou querer revanche

---

## 10. Critérios para Avaliar se um Novo Jogo Merece Entrar no OneTap

Um novo jogo candidato deve ser avaliado com pontuação de 0–10 em cada critério. **Pontuação mínima para aprovação: 65/100.**

### Scorecard de Avaliação

| Critério | Peso | Perguntas-Chave |
|----------|------|----------------|
| **Identidade Original** | 20 | O jogo tem conceito único? Passaria no Teste de Identidade sem dúvida? |
| **Aprendizado < 30s** | 15 | Um jogador que nunca jogou entende o objetivo assistindo 20 segundos? |
| **Duração 2–5 min** | 15 | A partida padrão termina nesse intervalo de forma satisfatória? |
| **Fator Social** | 15 | Gera momentos que viram histórias? Funciona melhor com amigos do que solo? |
| **Potencial de Viralização** | 10 | A tela de resultado tem algo compartilhável/inusitado? |
| **Curva Habilidade/Sorte** | 10 | O veterano domina no longo prazo mas o novato tem chances reais? |
| **Virada Possível** | 10 | Quem está perdendo tem sempre uma chance matemática de virar? |
| **Zero Pay-to-Win** | 5 | Absolutamente nenhum item comprado dá vantagem em partida? |

### Processo de Aprovação

```
Ideia Bruta
    │
    ▼
Teste de Identidade (reprovação = descarte imediato)
    │
    ▼
Scorecard (< 65 = descarte com feedback)
    │
    ▼
Protótipo Paper/Digital (1 semana)
    │
    ▼
Teste com 5–10 jogadores reais (sem tutorial verbal)
    │
    ▼
Iteração ou Descarte
    │
    ▼
Beta Fechado (usuários Plus selecionados)
    │
    ▼
Lançamento Global
```

### Sinais de Alerta (Rejeição Automática)
- O designer usa o nome de outro jogo para explicar o conceito ("é tipo um Among Us, mas...")
- A partida exige leitura de texto para ser entendida
- O único diferencial é "mais rápido" ou "mais simples" que um jogo existente
- A mecânica central é 100% aleatória (sem espaço para habilidade)
- O jogo é divertido só para quem está ganhando

---

## Apêndice — Exemplos de Conceitos Originais Aprovados pelo Teste de Identidade

*(Não são mecânicas detalhadas — são sementes de conceito para validação da filosofia)*

**Conceito A — "Frequência"**
Jogadores enviam sinais sem falar. A comunicação é feita apenas por símbolos e timing. Quem do grupo vai conseguir se coordenar sem palavras? Identidade: comunicação não-verbal como mecânica central. *Original? Sim.*

**Conceito B — "Herança"**
Cada decisão de um jogador afeta a próxima rodada do jogador ao lado. Seus erros são o problema do próximo. Identidade: consequências sociais em cadeia. *Original? Sim.*

**Conceito C — "Tribunal"**
Após uma rodada, os jogadores votam para banir uma regra do jogo para a próxima partida. O jogo evolui em tempo real conforme as decisões do grupo. Identidade: democracia como mecânica de jogo. *Original? Sim.*

---

*OneTap Design Bible v1.0 — Documento Vivo. Atualizar a cada grande decisão de produto.*
