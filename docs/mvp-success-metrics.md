# MVP Success Metrics — Faísca
**Versão:** 1.0  
**Data:** Julho 2026  
**Referências:** GDD v1.1 · Constituição do OneTap · Emotional Design Guide

---

> *Estes números não são perfeitos. São hipóteses. O propósito deste documento é forçar a equipe a definir, antes da primeira linha de código, o que significa sucesso — para que quando os dados chegarem, a interpretação não seja influenciada pelo resultado.*

---

## Como usar este documento

Cada hipótese tem:
- **O que medimos** — o comportamento observável
- **Alvo MVP** — o número mínimo que valida a hipótese
- **O que significa se atingirmos** — o que aprendemos quando está acima do alvo
- **O que significa se não atingirmos** — o que revisamos quando está abaixo

No final, há a tabela de "Kill Metrics" — os números que, se não atingidos, indicam que algo fundamental está errado no produto.

---

## Bloco 1 — O loop central funciona?

Estas hipóteses validam se o jogo é divertido o suficiente para que as pessoas queiram continuar.

---

### H1 — Taxa de completion de partida

> **"Pelo menos 80% das partidas iniciadas são concluídas com todas as 10 perguntas."**

| | |
|---|---|
| **Como medir** | `sessions com status = finished` ÷ `sessions com status = playing que passaram da P1` |
| **Alvo MVP** | ≥ 80% |
| **Se atingido** | O jogo não cansa nem frustra durante a sessão. A duração está calibrada. |
| **Se não atingido** | Identificar em qual pergunta o abandono ocorre. Abandono nas P1–P3 sugere problema de onboarding. Nas P8–P10 sugere que o Relâmpago está quebrando o engajamento em vez de elevar. |

---

### H2 — Taxa de revanche imediata

> **"Pelo menos 40% dos grupos jogam uma segunda partida imediatamente após o resultado final."**

| | |
|---|---|
| **Como medir** | `sessions REMATCH` criadas dentro de 3 min de um `session.finished` ÷ `total de sessions finished` |
| **Alvo MVP** | ≥ 40% |
| **Se atingido** | O loop de "mais uma" está funcionando. O botão de Revanche está sendo visto e querido. |
| **Se não atingido** | Investigar: o vencedor está saindo da tela rápido (tédio pós-vitória)? O perdedor está frustrado (punição percebida como injusta)? A tela de resultado está retendo atenção por tempo suficiente? |

**Nota de calibração:** Em grupos de 3+ jogadores, espera-se que essa taxa suba para ≥ 50%. Em duelos (2 jogadores), pode cair para ≥ 30%. Monitorar separado por tamanho de grupo.

---

### H3 — Tempo até a primeira resposta

> **"90% dos jogadores enviam sua primeira resposta em menos de 60 segundos após o início da partida (countdown incluído)."**

| | |
|---|---|
| **Como medir** | Timestamp do primeiro `ANSWER` recebido − `session.started.timestamp` |
| **Alvo MVP** | ≥ 90% dentro de 60s |
| **Se atingido** | O jogo é aprendido em menos de 1 minuto. A Constituição está sendo cumprida. |
| **Se não atingido** | A pergunta, o timer ou as opções estão criando confusão. Revisar o wireframe da tela de pergunta e o countdown. |

---

### H4 — Taxa de resposta dentro do timer

> **"Em pelo menos 80% das perguntas, o jogador envia uma resposta antes do timer expirar."**

| | |
|---|---|
| **Como medir** | `respostas enviadas (não-expiradas)` ÷ `total de perguntas apresentadas` |
| **Alvo MVP** | ≥ 80% |
| **Se atingido** | O timer de 15s não é curto demais. Jogadores estão engajados o suficiente para decidir dentro do tempo. |
| **Se não atingido** | Dois diagnósticos possíveis: (a) perguntas muito difíceis — revisar banco de questões; (b) timer muito curto — considerar aumento para 18s. Distinguir pelos dados qual é o caso. |

---

## Bloco 2 — A emoção certa está sendo criada?

Estas hipóteses validam o Emotional Design Guide. São mais difíceis de medir com precisão — por isso algumas dependem de sessões de observação qualitativa.

---

### H5 — Uso de emojis de reação

> **"Em pelo menos 60% das rodadas jogadas por grupos de 3+ pessoas, pelo menos um emoji de reação é enviado."**

| | |
|---|---|
| **Como medir** | `reveals com pelo menos 1 evento session.react` ÷ `total de reveals em sessions com N ≥ 3` |
| **Alvo MVP** | ≥ 60% |
| **Se atingido** | O reveal está criando emoção suficiente para gerar reação. O momento social está funcionando. |
| **Se não atingido** | Dois diagnósticos: (a) a janela de 5s ainda é curta demais — checar o timing dos eventos react; (b) o reveal não está sendo percebido como um momento — revisar especificação de animação e som. |

---

### H6 — Momento de virada no Relâmpago

> **"Em pelo menos 15% das partidas com 3+ jogadores, o vencedor final não estava em 1º lugar ao final da P7."**

| | |
|---|---|
| **Como medir** | `sessions onde rank_after_P7[winner] > 1` ÷ `total sessions finished com N ≥ 3` |
| **Alvo MVP** | ≥ 15% |
| **Se atingido** | O Modo Relâmpago está criando viradas reais, não apenas em teoria. O jogo permanece aberto até o fim. |
| **Se não atingido** | O gap de pontuação até a P8 está grande demais para o Relâmpago compensar. Opções: aumentar o bônus de velocidade nas Q8–Q10, ou reduzir o timer para 8s. |

---

### H7 — Streak ×2,5 alcançado

> **"Em pelo menos 30% das partidas, pelo menos um jogador atinge o multiplicador máximo de ×2,5 (4+ acertos consecutivos)."**

| | |
|---|---|
| **Como medir** | `sessions onde max_streak_any_player ≥ 4` ÷ `total sessions finished` |
| **Alvo MVP** | ≥ 30% |
| **Se atingido** | O streak é atingível por jogadores comuns, não apenas por experts. Isso cria a possibilidade do "personagem na mesa" que o Emotional Design Guide prevê. |
| **Se não atingido** | As perguntas estão muito difíceis para manter streak, ou o streak está sendo quebrado mais cedo que o esperado. Analisar a taxa de acerto médio por jogador. |

---

### H8 — Explainability (qualitativa)

> **"Em sessões de observação, pelo menos 8 de cada 10 novos jogadores conseguem explicar o jogo para um observador em menos de 1 minuto, sem ter recebido nenhuma instrução prévia."**

| | |
|---|---|
| **Como medir** | Sessões presenciais de playtest com 10–15 participantes novos antes do lançamento. Observação + pergunta aberta: "explique o jogo para mim como se eu nunca tivesse jogado." |
| **Alvo MVP** | ≥ 8 de 10 participantes |
| **Se atingido** | A Constituição está sendo cumprida: "aprender qualquer jogo em menos de 1 minuto." O onboarding implícito funciona. |
| **Se não atingido** | Identificar o elemento que causa confusão (o streak? o −200? o Relâmpago?) e simplificar a comunicação visual antes do lançamento. |

**Nota:** Esta hipótese deve ser validada no playtest pré-lançamento, não após. É o único momento em que podemos observar first-time players sem viés de sobrevivência.

---

## Bloco 3 — A dimensão social está funcionando?

---

### H9 — Tamanho médio de grupo

> **"A média de jogadores por partida, calculada sobre as sessions finalizadas na primeira semana, é ≥ 3,0."**

| | |
|---|---|
| **Como medir** | `soma de participants em sessions finished` ÷ `total sessions finished` |
| **Alvo MVP** | ≥ 3,0 jogadores/partida |
| **Se atingido** | As pessoas estão jogando em grupos, não apenas em duelos mínimos. O produto está sendo descoberto no contexto social correto. |
| **Se não atingido** | A maioria dos grupos é de 2 — possíveis causas: fricção de convite (difícil chamar mais pessoas), ausência de "motivo" para mais pessoas entrarem, ou o produto está sendo descoberto individualmente e não em contexto de grupo. |

---

### H10 — Taxa de sessions com amigos da plataforma

> **"Em pelo menos 50% das partidas, há pelo menos 2 jogadores que já se seguem mutuamente na plataforma."**

| | |
|---|---|
| **Como medir** | Cruzar `participants de uma session` com a tabela de amizades da plataforma |
| **Alvo MVP** | ≥ 50% |
| **Se atingido** | O produto está sendo usado como ferramenta social entre amigos reais, não entre desconhecidos. Isso valida o "Amigos antes dos jogos." |
| **Se não atingido** | O produto está sendo descoberto por indivíduos que depois recrutam alguém aleatório. Investigar o fluxo de convite — onde está a fricção. |

---

## Bloco 4 — Retenção inicial

---

### H11 — D1 Retention (retorno no dia seguinte)

> **"Pelo menos 35% dos jogadores que completam sua primeira partida voltam a jogar dentro de 24 horas."**

| | |
|---|---|
| **Como medir** | Usuários com ≥ 1 session em D0 e ≥ 1 session em D1 ÷ total de usuários com ≥ 1 session em D0 |
| **Alvo MVP** | ≥ 35% |
| **Se atingido** | A primeira experiência foi boa o suficiente para criar desejo de retorno. O loop de "mais uma" está além da sessão. |
| **Se não atingido** | A primeira sessão foi divertida mas não criou o gatilho de retorno. Investigar: o resultado final está criando tensão de revanche? O jogo está acompanhando o grupo fora da sessão (notificação de revanche por amigo)? |

**Nota de calibração:** A ausência de um daily challenge (identificada como risco no GDD v1.1) vai pressionar esse número para baixo. D1 de 35% sem gatilho diário é otimista — 25% seria mais conservador. Usar 35% como alvo aspiracional e 25% como mínimo aceitável.

---

### H12 — D7 Retention

> **"Pelo menos 18% dos jogadores que completam sua primeira partida jogam pelo menos uma partida na semana seguinte (D2–D7)."**

| | |
|---|---|
| **Como medir** | Usuários com session em D0 e pelo menos uma session entre D2–D7 ÷ usuários com session em D0 |
| **Alvo MVP** | ≥ 18% |
| **Se atingido** | O produto criou um hábito além da novelty. A semana 1 foi suficiente para estabelecer padrão de uso. |
| **Se não atingido** | O produto é divertido em sessões únicas mas não cria razão de retorno. Prioridade imediata: daily challenge ou outra mecânica de retorno diário. |

---

### H13 — Sessões por usuário ativo por semana

> **"Usuários que voltam pelo menos 2 vezes na semana 1 jogam em média ≥ 2,5 sessões nessa semana."**

| | |
|---|---|
| **Como medir** | Média de sessions/semana filtrado por usuários com sessões em ≥ 2 dias distintos na semana 1 |
| **Alvo MVP** | ≥ 2,5 sessões/semana |
| **Se atingido** | Quem retorna, retorna de verdade — não por obrigação social. O loop de "mais uma" está funcionando dentro da sessão. |
| **Se não atingido** | As sessões estão sendo únicas — as pessoas jogam uma vez por visita. Investigar se o botão de Revanche está visível e acessível. |

---

## Bloco 5 — Longevidade do conteúdo

---

### H14 — Perguntas novas nas primeiras 5 partidas

> **"Menos de 5% dos jogadores reportam ter visto uma pergunta repetida nas suas primeiras 5 partidas."**

| | |
|---|---|
| **Como medir** | Feedback in-app pós-partida (pergunta opcional de 1 toque: "Você viu alguma pergunta que já conhecia?") nas primeiras 2 semanas |
| **Alvo MVP** | < 5% reportam repetição nas primeiras 5 partidas |
| **Se atingido** | O banco inicial de 50 perguntas por categoria está diverso o suficiente para a fase MVP. |
| **Se não atingido** | O banco de perguntas está menor do que o necessário ou as perguntas estão sendo distribuídas de forma não aleatória o suficiente. Prioridade imediata: expansão de conteúdo antes de crescimento de usuários. |

---

### H15 — Distribuição de categorias

> **"Na primeira semana, pelo menos 40% das sessões usam a categoria 'Geral', e nenhuma categoria específica representa mais de 25% das demais."**

| | |
|---|---|
| **Como medir** | `sessions por categoria` ÷ `total sessions` na semana 1 |
| **Alvo MVP** | Geral ≥ 40% do total; nenhuma categoria específica > 25% do total |
| **Se atingido** | A distribuição de categorias está saudável — sem dominância que sinalize problema de conteúdo em uma área específica. |
| **Se não atingido** | Se uma categoria específica domina, pode sinalizar que as outras têm perguntas difíceis demais ou de nicho. Auditar o banco da categoria dominante. |

---

## Bloco 6 — Sinal de viralidade

---

### H16 — Novos usuários trazidos por usuários existentes

> **"Pelo menos 20% dos novos usuários registrados na primeira semana chegaram através de um convite direto (código de sala ou link compartilhado) de um usuário já cadastrado."**

| | |
|---|---|
| **Como medir** | `novos usuários cujo primeiro session foi por código de sala compartilhado` ÷ `total novos usuários na semana 1` |
| **Alvo MVP** | ≥ 20% |
| **Se atingido** | O produto está se espalhando socialmente, mesmo sem um viral loop explícito. O boca a boca está funcionando. |
| **Se não atingido** | O crescimento é inteiramente orgânico não-social (App Store discovery) ou pago. O produto ainda não está se espalhando como rede. Prioridade: implementar o Destaque da Partida (artefato compartilhável) antes de investir em aquisição paga. |

---

## Tabela de Kill Metrics

> Estes são os números que, se não atingidos nos primeiros 14 dias, indicam que algo fundamental está errado no produto. Não são números para "monitorar" — são números para **parar e revisar** antes de continuar o desenvolvimento de novos jogos.

| Kill Metric | Threshold | O que revisar se falhar |
|---|---|---|
| Taxa de completion de partida | < 70% | Algo dentro da sessão está quebrando a experiência. Identificar em qual pergunta. |
| D1 Retention | < 20% | A primeira sessão não criou desejo de retorno. A experiência emocional falhou. |
| Taxa de revanche imediata | < 15% | O loop central não está funcionando. O resultado final não está criando tensão de revanche. |
| Tamanho médio de grupo | < 2,3 | O produto está sendo jogado no mínimo (2 pessoas). Não está sendo experienciado como jogo de grupo. |
| Taxa de resposta dentro do timer | < 70% | O timer está muito curto, as perguntas estão muito difíceis, ou a interface está criando confusão. |

**Política de kill metric:** Se dois ou mais kill metrics estão abaixo do threshold simultaneamente nos primeiros 14 dias, o sprint de novos features é cancelado e a equipe entra em modo de diagnóstico. Nenhum novo jogo da plataforma é iniciado antes que todos os kill metrics estejam acima do threshold.

---

## Interpretação agregada — o que significa sucesso do MVP

| Cenário | Condição | Interpretação | Próximo passo |
|---|---|---|---|
| 🔴 Produto não validado | ≥ 2 Kill Metrics abaixo do threshold | O produto tem problema fundamental de experiência ou de fit | Diagnóstico, revisão de design, novo playtest antes de continuar |
| 🟡 Produto funcional, não empolgante | Kill metrics acima do threshold, < 8 hipóteses confirmadas | O jogo funciona mas não está criando os momentos certos | Priorizar ajustes emocionais (reveal, resultado, espera pós-resposta) antes de crescimento |
| 🟢 MVP validado | Kill metrics acima do threshold + ≥ 8 de 12 hipóteses mensuráveis confirmadas | O produto está funcionando. É divertido, social, e retém. | Resolver os riscos estruturais (conteúdo, viralidade, monetização) antes de escalar |
| 🚀 Product-market fit signal | Todos os kill metrics + ≥ 11 de 12 hipóteses + H16 (viralidade) confirmada | O produto está se espalhando sozinho | Escalar aquisição. Iniciar desenvolvimento do segundo jogo. |

---

## Cronograma de avaliação

| Quando | O que avaliar |
|---|---|
| **Pré-lançamento** | H8 (explainability) via playtest com 10–15 pessoas novas |
| **Dia 3 pós-lançamento** | Kill metrics — primeiro sinal de saúde |
| **Dia 7** | Bloco 1 (loop central) + Bloco 2 (emoção) + D1 retention |
| **Dia 14** | Avaliação completa de todos os blocos + interpretação agregada |
| **Dia 30** | Revisão de targets (este documento é atualizado com os números reais como baseline) |

---

## O que este documento não mede

Por escolha deliberada, este documento não mede:

**Receita.** O MVP do Faísca não tem modelo de monetização definido. Adicionar métricas de receita antes de ter o produto validado distorce prioridades — a equipe otimiza para converter em vez de para engajar. Métricas de receita entram na versão 2.0 deste documento, após o MVP validado.

**NPS formal.** Net Promoter Score em produtos novos com poucos usuários tem variância altíssima e é fácil de manipular com contexto de coleta. A H16 (novos usuários trazidos por existentes) é uma medida comportamental de NPS — o que as pessoas fazem é mais honesto do que o que dizem quando perguntadas.

**Rating na App Store.** Ratings nos primeiros dias são influenciados por early adopters altamente motivados e não representam a base de usuários que virá depois. Monitorar, mas não incluir como hipótese de MVP.

---

*Este documento é uma hipótese, não uma promessa. Os números foram definidos antes dos dados existirem — por isso têm valor. Quando os dados chegarem e os números forem diferentes, a discussão será sobre o que os dados nos ensinaram, não sobre se os alvos estavam certos ou errados.*

---

**MVP Success Metrics — Faísca v1.0**  
Julho 2026
