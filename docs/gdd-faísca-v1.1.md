# Faísca GDD v1.1
**Baseado em:** GDD v1.0 (Julho 2026)  
**Revisado contra:** Constituição do OneTap v1.0 + Emotional Design Guide v1.0  
**Data da revisão:** Julho 2026  
**Status:** Aguardando aprovação para implementação

---

> Esta revisão não reescreve o jogo. Avalia cada mecânica contra os dois documentos fundadores da plataforma e determina o que está pronto, o que precisa ajuste e o que deve sair antes da primeira linha de código.

---

## Legenda

| Símbolo | Significado |
|---|---|
| ✅ | Aprovada — implementar como descrito |
| 🟡 | Aprovada com ajuste — implementar com modificação |
| 🔴 | Removida — não implementar nesta versão |

---

## Seção 1 — Objetivo do jogo

> Quiz simultâneo, 2–6 jogadores, velocidade + precisão, 10 perguntas, todos jogam até o fim.

**Respeita a Constituição?** Sim. Sessão dentro da janela de 3–8 min. Aprende-se em menos de 1 minuto. Mobile first. Nenhuma mecânica exige tutorial.

**Reforça a identidade emocional?** Sim. "Rivalidade carinhosa" nasce naturalmente do formato simultâneo — você e seu amigo vivendo o mesmo momento ao mesmo tempo, competindo em paralelo.

**Cria momentos memoráveis?** A premissa cria a estrutura para momentos. Não garante os momentos — isso é responsabilidade das mecânicas que se seguem.

**Diversão ou complexidade?** Pura diversão. A premissa é o ponto mais simples e mais forte do design.

### ✅ Objetivo e premissa — APROVADOS

---

## Seção 2 — Público-alvo

> Primário: grupos de amigos 18–35, contexto social. Secundário: competidores solo.

**Respeita a Constituição?** Sim. "Amigos antes dos jogos" está no DNA da definição de público. "Mobile first, uma mão, polegar" está explicitamente contemplado.

**Reforça a identidade emocional?** Sim. O "perfil emocional" descrito no GDD — adrenalina, provocação entre amigos, sessões curtas — alinha perfeitamente com o "Pertencimento imediato" e a "Rivalidade carinhosa" do Emotional Design Guide.

**Observação:** O público secundário (competidores solo) existe mas é tratado como coadjuvante. Isso é a decisão correta — o jogo não deve ser redesenhado para atender solo em detrimento do social.

### ✅ Público-alvo — APROVADO

---

## Seção 3 — Duração da partida

> 3,5 min de jogo ativo. ~5 min com lobby.

**Respeita a Constituição?** Sim. A Constituição define "sessões de 3 a 8 minutos" como inegociável. 5 minutos está no centro da janela.

**Reforça a identidade emocional?** Sim. "Partidas curtas criam loops" — a duração é o mecanismo que torna o "de novo" irresistível e que respeita o tempo do jogador.

**Observação técnica:** O lobby de 30–90s é a maior variação de tempo e está fora do controle do design (depende do comportamento do host). Em grupos engajados isso é rápido; em grupos desorganizados pode dobrar o tempo percebido. Não é um problema — é uma característica social — mas precisa ser monitorado nas métricas de abandono pré-jogo.

### ✅ Duração — APROVADA

---

## Seção 4 — Número de jogadores (2–6)

> Mínimo 2, máximo 6, ideal 3–4. Sem bots.

**Respeita a Constituição?** Sim. "Amigos antes dos jogos" é reforçado pela ausência deliberada de bots — o jogo só funciona com pessoas reais.

**Reforça a identidade emocional?** Sim. A "rivalidade carinhosa" é mais rica com 3–4 jogadores — há espaço para alianças tácitas, momentos de comédia coletiva, e narrativa de grupo. Com 2, é duelo puro. Com 6, é caos produtivo.

**Ponto de atenção:** O mínimo de 2 jogadores significa que um jogador solo não pode explorar o jogo sem convencer alguém. Isso é socialmente correto (Constituição: "Amigos antes dos jogos") mas cria uma barreira de entrada que pode impedir a descoberta do produto. Não é um defeito de design — é uma posição filosófica — mas deve ser uma decisão consciente, não acidental.

### ✅ Número de jogadores — APROVADO

---

## Seção 5 — Fluxo completo da partida

### 5a. Lobby

> Host cria sala, código de 6 letras, jogadores entram, host inicia quando quiser.

✅ **Aprovado.** O lobby sem timer força o host a gerenciar o grupo — o que é socialmente natural. Ninguém começa uma partida de cartas antes de todos estarem sentados.

### 5b. Loop de pergunta

> Countdown → Pergunta → Timer → Resposta → Reveal → Placar → próxima pergunta.

✅ **Aprovado como estrutura.** O loop é limpo, repetível e ensinável em segundos.

### 5c. Tela de espera após responder

> "Aguardando X jogadores…" com silhuetas animadas. Pode durar até 13 segundos.

🟡 **Ajuste necessário.**

O Emotional Design Guide proíbe explicitamente o "Tédio passivo" — qualquer momento em que o jogador está esperando sem engajamento. Um jogador que respondeu em 2 segundos pode esperar 13 segundos olhando para silhuetas. Isso viola o princípio.

**Ajuste proposto:** A tela de espera deve ter engajamento passivo leve — não mecânico, não que distraia da tensão. Exemplos: mostrar o streak atual com uma animação pulsando, exibir a pergunta reformulada de outra forma (não a resposta, apenas a pergunta para revisão mental), ou usar a câmera dos avatares dos outros jogadores para comunicar que eles ainda estão pensando (se o app tiver acesso à câmera). O mínimo: o timer ainda aparece para o jogador que já respondeu, comunicando quanto tempo os outros ainda têm.

### 5d. Tela de resultado final

> Pódio + pontuação + XP + conquistas + botões Revanche / Sair.

🟡 **Ajuste necessário.**

O Emotional Design Guide define que "a vitória deve ser narrável" e que "o próximo jogo já começou." A tela atual cumpre o segundo mas não o primeiro. Mostrar números não é narrar. O vencedor vê "18.450 pts" — não vê "você virou no Relâmpago e venceu por 3.250 pontos."

**Ajuste proposto:** Adicionar uma linha de destaque por jogador, gerada automaticamente pelo servidor a partir dos dados já calculados. Uma frase específica, não genérica:
- "Você manteve streak de 6 e nunca errou no Relâmpago."
- "Ana respondeu a pergunta 7 em 0.4s — a mais rápida da partida."
- "Pedro saiu de 1º para 3º em duas perguntas e ainda terminou no pódio."

Esses dados existem. É uma frase a mais por jogador. É a diferença entre um placar e uma história.

**Também:** O pódio deve ser revelado dramaticamente — 3º → 2º → 1º, com 1–2 segundos entre cada reveal. O vencedor é a última coisa que aparece. O delay é artificial e intencional — é puro teatro, custo zero.

### ✅ Fluxo geral — APROVADO  
### 🟡 Tela de espera + Resultado final — AJUSTES NECESSÁRIOS

---

## Seção 6 — Regras detalhadas

### 6.1 Perguntas

> 10 perguntas, 4 opções, 1 correta, 120 chars max, sem "nenhuma das anteriores".

✅ **Aprovado.** A restrição de "nenhuma das anteriores" é brilhante — elimina ambiguidade e respeita a regra de aprender em menos de 1 minuto. Cada pergunta é sempre o mesmo formato: 4 opções, uma certa, escolha. Sem surpresas estruturais.

### 6.2 Timer (15s)

✅ **Aprovado.** O timer de 15s está calibrado corretamente — longo o suficiente para criar decisão genuína, curto o suficiente para criar pressão real. O piscar nos últimos 5 segundos é o tipo de polimento que o Emotional Design Guide chama de "funcionalidade."

### 6.3 Resposta (simultânea, sem troca)

✅ **Aprovado.** Não poder trocar a resposta é uma decisão de design impecável — cria compromisso. O momento de tocar a opção tem peso real.

### 6.4 Modo Relâmpago — Mecânica do timer

> Q8, Q9, Q10 têm timer de 10s em vez de 15s.

✅ **Aprovado.** A mudança de timer é o melhor mecanismo de escalada de tensão do jogo. É elegante: mesma estrutura, diferente peso. Cria a possibilidade de viradas sem invalidar o jogo anterior.

### 6.4 Modo Relâmpago — Tela de Aviso

> "⚡⚡⚡ MODO RELÂMPAGO — Últimas 3 perguntas!" como tela de interrupção de 3 segundos antes da P8.

🔴 **Removida.**

Esta tela viola dois princípios simultaneamente.

**Constituição:** "Toda funcionalidade nova deve justificar seu custo em complexidade." A tela de aviso não é uma funcionalidade — é um anúncio. Seu custo (interrupção do fluxo, novidade que se desgasta em 2–3 partidas, UX de "espere enquanto nada acontece") não é justificado pelo benefício.

**Emotional Design Guide:** "Tensão honesta" — a tensão deve emergir dos sistemas, não de anúncios que ordenam ao jogador que se sinta tenso. Quando o jogo avisa "AGORA VOCÊ DEVE SE SENTIR MAIS PRESSIONADO," ele está pedindo emoção emprestada em vez de criá-la.

**Substituição:** O timer de 10s na P8 é o aviso. O jogador que está engajado percebe imediatamente. O momento de percepção ("espera, o timer está menor?") é mais poderoso do que uma tela que explica o que vai acontecer.

**O aviso no placar parcial** da P7 ("⚡ Modo Relâmpago em X pergs!") pode ser mantido como preview antecipado — é informação, não interrupção.

### 6.5 Categorias (6 categorias)

✅ **Aprovado.** Seis categorias é o número certo para um lançamento — específico o suficiente para criar identidade ("eu sou de Cultura Pop"), amplo o suficiente para não fragmentar o base de jogadores.

---

## Seção 7 — Sistema de pontuação

### 7.1–7.3 Fórmula base + bônus de velocidade

> 1000 pts base, +500 bônus velocidade (linear), −200 por erro, 0 por expirar.

✅ **Aprovado.** A fórmula é mais complexa do que parece — mas a complexidade está escondida atrás do resultado. O jogador vê "+2.200" não vê "(1000+400)×1,5". Complexidade invisível não é complexidade do jogador. Isso respeita a Constituição.

O −200 por erro cria a decisão mais interessante do jogo: "com 8s restantes e incerteza, vale arriscar?" Isso é tensão honesta, não punição gratuita.

### 7.4 Multiplicador de streak

> 1× → 1,5× → 2× → 2,5× por acertos consecutivos. Erro zera. Expirado não afeta.

✅ **Aprovado — com uma ressalva de comunicação.**

O streak é a mecânica mais rica do jogo. Cria personagens na mesa ("Pedro tem ×2,5!"), cria risco real de perder (o multiplicador está em jogo em toda resposta), e cria as histórias mais memoráveis ("eu tava em streak de 7 e errei a última").

**Ressalva:** "Sem resposta não quebra o streak" é a única regra contraintuitiva do jogo. Viola o "aprender em menos de 1 minuto" se precisar ser explicada verbalmente.

**Ajuste proposto:** A UI deve comunicar isso visualmente sem palavras. Quando o timer expira e o streak permanece intacto, a chama do streak deve pulsar brevemente — como dizendo "você sobreviveu." O jogador aprende a regra pela experiência, não pelo manual.

---

## Seção 8 — Critérios de vitória

> Maior pontuação total vence. Server authoritative.

✅ **Aprovado.** Simples, claro, justo. "Tensão honesta" — o resultado é determinado por performance, não por sorte de sistema.

A possibilidade de vencer com pontuação negativa (se todos pontuaram menos) é um detalhe brilhante — cria a narrativa cômica de "ganhei e estava negativo" sem criar injustiça.

---

## Seção 9 — Critérios de empate

> Primário: acertos. Secundário: tempo total. Terciário: ordem de entrada.

✅ **Aprovado.** O empate técnico é uma raridade matemática bem tratada. A complexidade é escondida do jogador (ele vê apenas "Empate técnico, desempatado por velocidade"). Respeita a Constituição: a lógica é sofisticada, a experiência é simples.

---

## Seção 10 — Sistema de XP

### 10.1–10.2 Estrutura de XP

> 50 base + 10/acerto + 100/60/30 por posição + bônus de streak. Máx 400 XP.

✅ **Aprovado.** O XP resolve o "vazio pós-vitória" — sempre há progresso ocorrendo. A estrutura é justa e compreensível.

### 10.2 Bônus de amigo (+10% XP)

> +10% de XP quando há pelo menos 1 amigo na partida.

🔴 **Removido.**

**Constituição:** "Viralidade deve nascer da emoção, e não de recompensas artificiais. O jogador deve querer chamar um amigo porque se divertiu, não porque ganhou moedas."

10% de XP é exatamente o tipo de incentivo artificial que a Constituição proíbe. É um número pequeno o suficiente para não mover comportamento (ninguém manda mensagem para um amigo às 22h por 10% de XP) e grande o suficiente para ser uma concessão filosófica que abre a porta para mais incentivos artificiais no futuro.

**Substituição:** Nenhuma é necessária. A razão para jogar com amigos é que é mais divertido. Se o jogo cumprir o Emotional Design Guide, essa é razão suficiente.

---

## Seção 11 — Sistema de conquistas

### 11.1 Conquistas de desempenho

| Conquista | Veredicto | Justificativa |
|---|---|---|
| Primeiro Relâmpago (1ª vitória) | ✅ | Rito de passagem. Todo jogo deve ter este momento. |
| Na Velocidade da Luz (<1s) | ✅ | Cria história específica e narrável. |
| Impecável (10/10 acertos) | ✅ | Aspiracional. Define o teto de habilidade. |
| Relâmpago Puro (Q8–Q10 sem erro) | ✅ | Reconhece a parte mais dramática do jogo. |
| Eletrificado (streak ≥4) | ✅ | Recompensa a mecânica central. |
| Virada Heroica (último→1º após P7) | ✅ | A melhor conquista do jogo. É a narrativa do Modo Relâmpago condensada em uma conquista. Deve ter o tratamento visual mais especial de todas. |

### 11.2 Conquistas de volume

> 10 partidas, 100 partidas, 100 acertos no total.

🟡 **Aprovadas com ressalva.**

Conquistas de volume são mecânicas de retenção, não de momento. Não criam histórias próprias — criam hábito. Isso não é ruim (hábito é retenção), mas é emocionalmente vazio se for tudo que existe.

**Ressalva:** Estas conquistas devem ter framing que celebre a jornada, não apenas o número. "100 partidas" pode ser "você jogou mais de 8 horas de Faísca" com algum dado que torne o número humano, não abstrato.

### 11.3 Conquistas sociais

| Conquista | Veredicto | Justificativa |
|---|---|---|
| Anfitrião (host 5x) | ✅ | Recompensa comportamento que beneficia a plataforma. |
| Faísca em Grupo (5–6 jogadores) | ✅ | Incentiva sessões maiores sem pressionar. |
| Rivalidade Saudável (5x vs mesmo amigo) | ✅ | Reconhece o padrão de duelo que queremos encorajar. |

### 11.4 Conquistas ocultas

| Conquista | Veredicto | Justificativa |
|---|---|---|
| Corajoso ou Louco (3 erros seguidos + vitória) | ✅ | Genial. Transforma uma sequência de vergonha em narrativa de heroísmo. É exatamente como o Emotional Design Guide define boa derrota: "eu vi onde errei e mesmo assim venci." |
| Azar do Novato (0 acertos numa partida) | 🟡 | A mecânica é aceitável — é uma conquista oculta, revelada apenas ao próprio jogador. O risco é o tom. Se o nome, o ícone e o texto soarem como zombaria, viola "Humilhação pública nunca." Se soarem como cumplicidade ("ei, todos nós temos um dia ruim"), é comédia bem-vinda. **Ajuste necessário:** auditoria de tom antes da implementação. O jogador que 0/10 não deve sentir que o jogo está rindo dele. Deve sentir que o jogo entende que isso acontece. |

---

## Seção 12 — Wireframes

> Wireframes ASCII para todas as telas principais.

🟡 **Aprovados como estrutura, incompletos como especificação.**

Os wireframes comunicam layout e hierarquia de informação com clareza. Cumprem seu papel de definir o quê aparece em cada tela.

O que está ausente é o Emotional Design Guide aplicado às telas: o *como* de cada transição, o *timing* de cada elemento entrando em cena, e a *intenção emocional* de cada tela.

**Ajuste necessário:** Cada wireframe deve ter uma linha de "intenção emocional" e uma linha de "timing de reveal". Não é implementação — é direção para quem implementar.

Exemplo para Tela 6 (Reveal):
> *Intenção: clímax de cada rodada. Cada elemento entra em cena com timing, não aparece instantaneamente. A opção correta pulsa antes de se estabilizar. Os pontos contam de 0 ao valor final. O badge "⚡ mais rápido" aparece brevemente sobre o avatar do jogador com menor responseTimeMs.*

Sem essa especificação, a implementação padrão será uma troca de cores. Troca de cores não é o Reveal que este jogo precisa.

**Adicionalmente:** O GDD inteiro não menciona som uma única vez. Som não é detalhe — é a metade da experiência emocional. Cada tela crítica (reveal, Relâmpago, resultado final, streak quebrando) precisa de uma diretiva de som antes da implementação.

---

## Seção 13 — Estados da partida

> waiting / playing / abandoned / finished. Subestados em JSONB: question / reveal / scoreboard / lightning_warning / final.

✅ **Aprovado.** Arquitetura limpa e reutilizável. O subestado `lightning_warning` precisa ser renomeado para refletir a mudança da seção 6.4 — a tela de aviso foi removida, mas o estado ainda é necessário para o momento de transição antes da P8. Sugestão: renomear para `lightning_transition` para refletir que é uma mudança de estado, não um anúncio.

---

## Seção 14 — Ações do jogador

### ANSWER

✅ **Aprovado.** Validação com tolerância de 200ms para latência é fair design — respeita o jogador sem abrir brechas de exploração.

### REACT (emojis)

🟡 **Aprovado com ajuste.**

Os emojis de reação são o único mecanismo de "celebração coletiva" do jogo. O Emotional Design Guide identifica a ausência de momentos coletivos como uma das lacunas maiores. Os emojis são a resposta mais simples para isso — mas estão subdimensionados.

**Problema:** Janela de 2 segundos. O jogador processa o resultado, identifica a emoção, decide reagir, localiza o botão, toca — tudo isso em 2 segundos. Para quem acertou, é rápido. Para quem errou e está processando a perda do streak, 2 segundos já passaram.

**Ajuste proposto:** Estender a janela para a duração total do reveal (os 3 segundos de reveal + os 2 segundos de reação = 5 segundos de janela de reação a partir do início do reveal). Manter o limite de uma reação por reveal por jogador.

### START e REMATCH

✅ **Aprovados.** REMATCH como botão imediato no resultado final é o "o próximo jogo já começou" em forma de UI.

---

## Seção 15 — Eventos do servidor

✅ **Aprovados.** A decisão de `session.player_answered` revelar apenas o *contador* (não quem respondeu) é design de tensão sofisticado — você sabe que alguém já escolheu mas não sabe se foi a resposta certa ou errada. Isso aumenta a pressão sem entregar informação prematuramente.

---

## Seção 16 — Reconexão

### Mecânica de reconexão (janela 30s, jogo não pausa)

✅ **Aprovado.** Não pausar o jogo respeita o tempo dos outros jogadores — Constituição: "Respeite o tempo do jogador."

### Comunicação ao reconectar

🟡 **Ajuste necessário.**

A mecânica está certa. A comunicação ao jogador que volta pode ser melhorada.

Quando alguém reconecta após perder 2–3 perguntas e se vê em último lugar sem ter escolhido isso, o risco é "Frustração sistêmica" — sentir que fatores externos destruíram sua partida. O design não tem culpa técnica, mas a comunicação pode atenuar o impacto.

**Ajuste proposto:** Ao reconectar, o estado sincronizado deve incluir um resumo humanizado: "Você perdeu 2 perguntas enquanto desconectado. Você está em 3º lugar. Ainda há 5 perguntas — a partida está aberta." É informação que o jogador já teria de qualquer forma, entregue com contexto emocional em vez de apenas estado técnico.

---

## Seção 17 — Casos extremos

### 17.1–17.7 (Edge cases técnicos)

✅ **Aprovados.** A cobertura de edge cases é exemplar. Cada cenário tem tratamento determinístico.

### 17.3 Mensagem de partida abandonada

🟡 **Ajuste necessário.**

"Partida encerrada por falta de jogadores" é a mensagem atual. É tecnicamente precisa e emocionalmente fria. Para um jogador que ficou sozinho esperando 30 segundos na esperança de que os amigos voltassem, essa mensagem chega num momento de frustração real.

**Ajuste proposto:** A mensagem e a tela de abandono precisam de tratamento empático. O conteúdo da informação não muda — o tom sim. "Seus amigos saíram da partida. Crie uma nova sala quando estiver pronto." Pequena diferença, grande impacto emocional.

### 17.8 Banco de perguntas esgotado

🟡 **Ajuste necessário — e sinal de alerta maior.**

Este caso extremo técnico é o proxy do maior risco estratégico do produto: esgotamento de conteúdo. O GDD trata como edge case. É uma certeza com data marcada.

50 perguntas por categoria = 5 runs não repetitivos. Com 3 partidas por semana, um usuário ativo esgota uma categoria em menos de 2 semanas. A mensagem "Não há perguntas suficientes nesta categoria" é o fim da linha para esse usuário.

Este não é um ajuste de UX. É um risco de produto que precisa de decisão antes da implementação. Ver seção de Riscos.

---

## Seção 18 — Por que é divertido

> Seis argumentos: cada segundo tem peso, errar dói, streak cria personagens, Relâmpago muda tudo, reveal é social, sessões curtas criam loops.

✅ **Aprovado como framework de argumentação.**

Os seis argumentos alinham com os pilares do Emotional Design Guide. A seção serve bem como referência interna para o time — quando alguém questionar uma decisão de design, esta seção é a âncora.

**Nota:** O argumento 2 ("errar dói") precisa de cuidado na comunicação interna. "Dói" na intenção do designer é diferente de "punitivo" na experiência do jogador. A diferença: −200 que o jogador entende e aceita é design. −200 que o jogador sente como injusto é bug de percepção. A calibração desta diferença é responsabilidade do playtest, não do GDD.

---

## Seção 19 — Diferenciação

> Tabela comparativa com concorrentes. Lista "O que não vamos fazer."

✅ **Aprovado — especialmente a lista negativa.**

"O que não vamos fazer" é o documento dentro do documento mais valioso desta seção. Sem vidas, sem power-ups, sem modo assíncrono, sem anúncios, sem perguntas ambíguas. Esta lista é a Constituição aplicada ao Faísca. Deve ser relida toda vez que alguém propuser uma nova feature.

---

## Seção 20 — Métricas de sucesso

> D1 40%, D7 20%, sessões/semana 3+, completion 85%, revanche 35%, emoji 60%.

🟡 **Aprovado com complemento.**

As métricas de engajamento são apropriadas. Mas o Emotional Design Guide introduz uma camada que métricas tradicionais não medem: a experiência emocional.

**Complemento proposto — métricas proxy de emoção:**

| Métrica proxy | O que mede | Sinal de alerta |
|---|---|---|
| Taxa de "de novo" voluntário vs por pressão social | Qualidade do loop | < 25% sugere que o loop está funcionando por obrigação, não desejo |
| Tempo médio na tela de resultado | Engajamento com a narrativa | < 5s sugere que ninguém está lendo o destaque da partida |
| Taxa de uso de emoji no 1º segundo vs 2º segundo | Se a janela de 5s é suficiente | Maioria no 2º segundo = janela anterior (2s) estava cortando reações |
| Taxa de abandono na tela de espera pós-resposta | Risco de tédio passivo | > 5% sugere que a espera está quebrando o engajamento |

---

## Resumo executivo das decisões

### ✅ Mecânicas aprovadas

- Objetivo e premissa (quiz simultâneo, velocidade + precisão)
- Público-alvo e contexto de uso
- Duração (5 min total)
- Número de jogadores (2–6, sem bots)
- Timer padrão (15s)
- Timer Relâmpago (10s para Q8–Q10) — **a mecânica**
- Fórmula de pontuação (complexidade oculta, experiência simples)
- Sistema de streak (1×→1,5×→2×→2,5×)
- "Sem resposta não quebra streak" — com ajuste de comunicação via UI
- Critérios de vitória e empate
- Seis categorias
- Estrutura de XP (50 base + bônus por acerto e posição)
- Conquistas de desempenho (todas as seis)
- "Corajoso ou Louco" (melhor conquista oculta)
- Conquistas sociais (Anfitrião, Faísca em Grupo, Rivalidade Saudável)
- Conquistas de volume (com ressalva de framing)
- Estados da partida e subestados
- Ações ANSWER, START e REMATCH
- Validação de timestamp com tolerância de 200ms
- Eventos de servidor (especialmente `player_answered` sem revelar quem)
- Mecânica de reconexão (30s, sem pausar o jogo)
- Todos os edge cases técnicos (17.1–17.7)
- Tabela de diferenciação e lista "O que não vamos fazer"

---

### 🟡 Mecânicas que precisam ajuste

| O que | Ajuste necessário |
|---|---|
| Tela de espera pós-resposta | Adicionar engajamento passivo; exibir timer restante para quem já respondeu |
| Tela de resultado final | Revelar pódio dramaticamente (3º→2º→1º). Adicionar destaque narrativo por jogador gerado por dados já existentes. |
| Janela de emoji de reação | Estender de 2s para duração total do reveal (5s a partir do início do reveal) |
| Comunicação de "sem resposta não quebra streak" | UI deve comunicar visualmente (pulso na chama) sem palavra alguma |
| Wireframes | Adicionar linha de "intenção emocional" e "timing de reveal" por tela |
| Som | O GDD não menciona som. Cada tela crítica precisa de diretiva de som antes da implementação. |
| Conquista "Azar do Novato" | Auditoria de tom antes de implementar — deve ser cumplicidade, não zombaria |
| Conquistas de volume | Reformular copy para celebrar a jornada, não apenas o número |
| Reconexão — comunicação | Mensagem de retorno deve incluir contexto emocional, não apenas estado técnico |
| Abandono — mensagem | Reescrever com tom empático |
| Métricas de sucesso | Adicionar métricas proxy de emoção |
| Subestado `lightning_warning` | Renomear para `lightning_transition` (a tela foi removida, o estado de transição permanece) |

---

### 🔴 Mecânicas removidas

| O que | Por que |
|---|---|
| **Tela de aviso do Modo Relâmpago** (⚡⚡⚡ MODO RELÂMPAGO!) | Interrompe o fluxo. Perde novidade em 2–3 partidas. A tensão deve emergir do timer mais curto, não de um anúncio que ordena tensão. O timer de 10s é o aviso. |
| **Bônus de +10% XP por jogar com amigos** | Incentivo artificial que viola a Constituição: "Viralidade deve nascer da emoção, não de recompensas artificiais." Não move comportamento. Abre precedente filosófico perigoso. |

---

## Nota de maturidade do GDD

**72% pronto para implementação.**

| Dimensão | Nota | Observação |
|---|---|---|
| Clareza da premissa | 100% | O jogo é cristalino em seu conceito |
| Especificação técnica | 95% | Estados, validações, edge cases — exemplar |
| Design emocional das telas | 45% | Wireframes descrevem layout, não experience |
| Som e feedback sensorial | 0% | Ausente. Crítico para polimento |
| Estratégia de conteúdo | 0% | 50 perguntas seed sem plano de expansão |
| Monetização | 0% | Ausente do documento |
| Loop viral / compartilhamento | 30% | Existe intenção (emojis, revanche) mas sem artefato compartilhável |

A nota 72% significa: o GDD está pronto para começar a implementação dos sistemas core, mas não está pronto para ser considerado completo. Implementar o que está aqui sem resolver os gaps identificados é construir uma base sólida num terreno com rachaduras.

---

## Os cinco maiores riscos antes da implementação

---

### Risco 1 — Esgotamento de conteúdo (semana 2–3)
**Probabilidade: certa. Impacto: alto.**

50 perguntas por categoria = 5 runs sem repetição. Jogadores ativos (3 sessões/semana) começam a reconhecer perguntas em 2 semanas. Quando isso acontece, o loop "eu sabia isso!" morre — e com ele, a emoção principal do jogo.

Este é o único risco que pode matar o produto antes que ele tenha chance de ser avaliado. Não é um risco de design — é um risco operacional que deve ter decisão e dono antes de uma linha de código ser escrita.

**Decisão necessária antes da implementação:** Definir a estratégia de conteúdo. Banco mínimo viável de lançamento. Frequência de atualização. Quem cria ou cuida o conteúdo. Processo de quality assurance de perguntas.

---

### Risco 2 — Reveal sem espetáculo (morte silenciosa do melhor momento)
**Probabilidade: alta sem especificação. Impacto: alto.**

O reveal acontece 10 vezes por partida — é a tela mais repetida do jogo. Se for implementado como uma troca de cores (o que acontece quando não há especificação de experiência), o melhor momento do jogo será ordinário. E um momento ordinário repetido 10 vezes é um loop que cansa.

**Decisão necessária antes da implementação:** Especificação detalhada de timing, animação e som para o reveal. Não é implementação — é direção. Deve existir antes que qualquer desenvolvedor toque nesta tela.

---

### Risco 3 — Ausência de loop viral (crescimento limitado ao boca a boca ativo)
**Probabilidade: certa sem intervenção. Impacto: médio-alto.**

Nada no design atual gera compartilhamento orgânico. O jogador que quer "mostrar" uma vitória ou um momento não tem como fazê-lo sem uma captura de tela manual e um contexto verbal. Isso funciona com ~10 amigos próximos. Não funciona como motor de crescimento.

**Decisão necessária antes da implementação:** Definir o artefato compartilhável. O "Destaque da Partida" proposto nos ajustes é o candidato mais simples. Deve ser especificado e implementado no v1 — não é feature futura.

---

### Risco 4 — Tela de espera como gargalo de retenção
**Probabilidade: média. Impacto: médio.**

O intervalo entre "responder rápido" e "ver o reveal" pode ser de até 13 segundos sem engajamento. Em mobile, onde a atenção é fragmentada, 13 segundos de silêncio é suficiente para o jogador abrir outra notificação e não voltar. O Emotional Design Guide chama isso de "tédio passivo" — proibido.

**Decisão necessária antes da implementação:** Definir o que acontece na tela de espera para o jogador que já respondeu. Mesmo que seja mínimo (timer visível + streak animado), precisa existir antes do lançamento.

---

### Risco 5 — Falta de decisão de monetização antes da construção
**Probabilidade: certa. Impacto: alto a longo prazo.**

O GDD não menciona monetização. Construir toda a infraestrutura do produto sem saber onde a receita vai vir significa que qualquer decisão de monetização futura vai exigir retrabalho arquitetural — não apenas novo design.

A questão não é "qual é o modelo de monetização certo" — essa pergunta tem respostas discutíveis. A questão é: "qual é o modelo que este time escolheu?" A ausência de resposta é o risco.

**Decisão necessária antes da implementação:** Mesmo que seja um documento de duas páginas separado do GDD, a posição de monetização deve existir. Ela influencia o onboarding, a progressão, o design de conquistas, e a política de conteúdo — todos elementos que estão sendo construídos agora.

---

*Faísca GDD v1.1 — Revisado contra Constituição do OneTap v1.0 e Emotional Design Guide v1.0*  
*Julho 2026*
