# UNIVERSIDADE ESTADUAL DO SUDOESTE DA BAHIA – UESB
## Departamento de Ciências Exatas – DCET
### Curso: Ciência da Computação | Disciplina: Compiladores
**Trabalho Prático da I e II Unidades: Analisador Léxico (AFD) e Analisador Sintático SLR(1) (Linguagem Sigma)**

---

## 1. Visão Geral do Projeto

Este projeto integra o desenvolvimento do **Analisador Léxico** (baseado em Autômato Finito Determinístico - AFD) e do **Analisador Sintático Ascendente SLR(1)** para a linguagem **Sigma**, complementado por uma **Tabela de Símbolos**, rastreamento passo a passo da pilha sintática e um **Simulador Visual Interativo do AFD fundamentado em conceitos de IHC (Interação Humano-Computador)**.

A aplicação foi construída com tecnologias web puras (**HTML5, Vanilla CSS e Vanilla JavaScript**), sem frameworks ou dependências externas, garantindo **execução direta em qualquer navegador sem necessidade de compilação ou configuração de ambiente**.

---

## 2. Instruções de Instalação e Execução

### Modo 1: Execução Direta no Navegador (Recomendado)
1. Abra a pasta do projeto no explorador de arquivos.
2. Dê um duplo clique no arquivo [`index.html`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/index.html).
3. O projeto será executado instantaneamente no navegador web, pronto para uso.
4. **Layout Viewport-Fit (100vh):** Toda a aplicação se ajusta à tela sem necessidade de scroll vertical global na página principal.

### Modo 2: Execução via Linha de Comando (Node.js - Opcional)
Os módulos [`lexer.js`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/lexer.js) e [`parser.js`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/parser.js) são universais (isomórficos):
```bash
# Análise Léxica via Terminal
node -e "const { AnalisadorLexico } = require('./lexer.js'); const fs = require('fs'); const lexer = new AnalisadorLexico(fs.readFileSync('exemplos_teste/teste1_programa_completo.txt', 'utf8')); console.log(lexer.executar().tokens);"

# Análise Sintática SLR(1) via Terminal
node -e "const fs = require('fs'); const { AnalisadorLexico } = require('./lexer.js'); const { AnalisadorSintatico } = require('./parser.js'); const tokens = new AnalisadorLexico(fs.readFileSync('exemplos_teste/teste1_programa_completo.txt', 'utf8')).executar().tokens; console.log(new AnalisadorSintatico().analisar(tokens));"
```

---

## 3. Funcionalidades da Interface

A interface foi projetada seguindo as Heurísticas de Usabilidade de Nielsen (visibilidade do estado do sistema, controle do usuário e correspondência com o modelo mental do domínio):

1. **Header com Ações Diretas:**
   - Botão **`📖 Especificações`**: abre um modal popup com as especificações formais da linguagem Sigma, estados do autômato e regras gramaticais.
   - Botão **`⚙️ Simulador AFD`**: atalho direto no cabeçalho para abrir o simulador do autômato a qualquer momento.
2. **Painel de Métricas Rápidas:**
   - Exibição de *Tokens Reconhecidos*, *Erros Léxicos*, *Status Sintático (ACEITO / ERRO)*, *Símbolos Declarados*, *Linhas de Código* e *Tempo de Análise (ms)*.
3. **Editor de Código Fonte:**
   - Numeração dinâmica de linhas sincronizada com scroll, seletor de programas pré-definidos, botão de upload `.txt`/`.pas`, botão de limpar e execução de análise.
4. **Painel de Resultados com Abas Lado a Lado:**
   - **Sintático SLR(1):** tabela com rastreamento completo da pilha de estados, pilha de símbolos, entrada restante e ação realizada (*Shift*, *Reduce*, *Accept* ou *Error*).
   - **Tabela de Símbolos:** visualização das variáveis declaradas com categoria, tipo (`integer`/`boolean`), linha e coluna, além de alertas semânticos de redeclaração ou variável não declarada.
   - **Tokens:** tabela com lexema, categoria do token, linha e coluna.
   - **Texto .txt:** saída pura colunar e botão `💾 Baixar saída .txt` para exportação no formato `<cadeia, token>`.
5. **Simulador Visual do AFD (Popup Interativo):**
   - Acessível pelo **botão flutuante no canto inferior esquerdo** ou pelo botão no header.
   - **Pan & Zoom Dinâmico:** liberdade total de movimentação com clique e arraste do mouse (`grab`/`grabbing`), zoom contínuo pela roda do scroll (`wheel`) e botões de zoom `+`, `−` e `⟲ Reset`.
   - **Controles de Reprodução:** `⏮ Início`, `◀ Passo`, `▶ Play / ⏸ Pause`, `Passo ▶` e seletor de velocidade (100ms a 1200ms).
   - **HUD de Feedback:** exibição do passo atual, caractere consumido (`␣`, `\n`, `\t`), lexema parcial acumulado, estado atual com iluminação colorida e descrição explicativa de cada transição.

---

## 4. Especificação do Autômato Finito Determinístico (AFD Léxico)

O analisador léxico opera formalmente como uma 5-tupla $M = (\Sigma, Q, \delta, q_0, F)$:
- $\Sigma$: Alfabeto de entrada (caracteres ASCII válidos).
- $Q$: Conjunto de 17 estados $\{S_0, S_1, S_2, S_3, S_4, S_5, S_6, S_7, S_8, S_9, S_{10}, S_{11}, S_{12}, S_{13}, S_{14}, S_{15}, S_{16}\}$.
- $q_0$: Estado inicial ($S_0$).
- $\delta$: Função determinística de transição ($Q \times \Sigma \rightarrow Q$).
- $F$: Estados de aceitação/reconhecimento (com tratamento e descarte transparente de comentários de bloco `/* ... */`).

### Tabela de Transições do Autômato Léxico

| Estado Atual | Entrada | Próximo Estado | Ação / Token Gerado |
|---|---|---|---|
| **$S_0$ (Início)** | Espaço, `\t`, `\r`, `\n` | $S_0$ | Descartar (espaço não significativo) |
| **$S_0$ (Início)** | `[a-zA-Z_]` | $S_1$ | Inicia identificador ou palavra reservada |
| **$S_0$ (Início)** | `[0-9]` | $S_2$ | Inicia número inteiro |
| **$S_0$ (Início)** | `:` | $S_8$ | Lê dois pontos ou atribuição |
| **$S_0$ (Início)** | `<` | $S_9$ | Operador relacional `<`, `<=`, `<>` |
| **$S_0$ (Início)** | `>` | $S_{10}$ | Operador relacional `>`, `>=` |
| **$S_0$ (Início)** | `=` | Retorna | `Operador relacional` |
| **$S_0$ (Início)** | `+`, `-`, `*` | Retorna | `Operador aritmético` |
| **$S_0$ (Início)** | `/` | $S_{11}$ | Divisão ou início de comentário de bloco |
| **$S_0$ (Início)** | `.` | Retorna | `Fim` (ou ponto delimitador) |
| **$S_0$ (Início)** | `,`, `;`, `(`, `)` | Retorna | `Símbolo especial` |
| **$S_0$ (Início)** | `"` | $S_{14}$ | Inicia constante string |
| **$S_0$ (Início)** | `'` | $S_{15}$ | Inicia constante caractere |
| **$S_1$ (Ident)** | `[a-zA-Z0-9_]` | $S_1$ | Continua acumulando lexema |
| **$S_1$ (Ident)** | Outro caractere | Retorna | Consulta tabela $O(1)$: `Palavra reservada`, `Operador lógico`, `Operador aritmético` ou `Identificador` |
| **$S_2$ (Int)** | `[0-9]` | $S_2$ | Continua acumulando dígitos inteiros |
| **$S_2$ (Int)** | `.` seguido de `[0-9]` | $S_4$ | Transita para parte fracionária |
| **$S_2$ (Int)** | `e` ou `E` | $S_5$ | Transita para notação científica |
| **$S_2$ (Int)** | Outro caractere | Retorna | `Número inteiro` |
| **$S_4$ (Real)** | `[0-9]` | $S_4$ | Continua acumulando dígitos fracionários |
| **$S_4$ (Real)** | `e` ou `E` | $S_5$ | Transita para notação científica |
| **$S_4$ (Real)** | Outro caractere | Retorna | `Número real` |
| **$S_5$ (Exp)** | `+` ou `-` | $S_6$ | Lê sinal do expoente |
| **$S_5$ (Exp)** | `[0-9]` | $S_7$ | Lê dígitos do expoente |
| **$S_6$ (Exp Sinal)** | `[0-9]` | $S_7$ | Lê dígitos do expoente após o sinal |
| **$S_7$ (Exp Dígitos)**| `[0-9]` | $S_7$ | Continua acumulando dígitos do expoente |
| **$S_7$ (Exp Dígitos)**| Outro caractere | Retorna | `Número real` |
| **$S_8$ (Dois Pontos)**| `=` | Retorna | `Atribuição` (`:=`) |
| **$S_8$ (Dois Pontos)**| Outro caractere | Retorna | `Símbolo especial` (`:`) |
| **$S_9$ (Menor)** | `=` ou `>` | Retorna | `Operador relacional` (`<=` ou `<>`) |
| **$S_9$ (Menor)** | Outro caractere | Retorna | `Operador relacional` (`<`) |
| **$S_{10}$ (Maior)** | `=` | Retorna | `Operador relacional` (`>=`) |
| **$S_{10}$ (Maior)** | Outro caractere | Retorna | `Operador relacional` (`>`) |
| **$S_{11}$ (Barra)** | `*` | $S_{12}$ | Entra em comentário de bloco `/*` |
| **$S_{11}$ (Barra)** | Outro caractere | Retorna | `Operador aritmético` (`/`) |
| **$S_{12}$ (Comentário)**| `*` | $S_{13}$ | Possível fechamento de comentário |
| **$S_{12}$ (Comentário)**| Qualquer outro | $S_{12}$ | Ignora conteúdo do comentário |
| **$S_{13}$ (Comentário)**| `/` | $S_0$ | Fecha comentário `*/` e descarta |
| **$S_{13}$ (Comentário)**| `*` | $S_{13}$ | Permanece no estado de fechamento |
| **$S_{13}$ (Comentário)**| Qualquer outro | $S_{12}$ | Retorna ao corpo do comentário |
| **$S_{14}$ (String)** | `"` | Retorna | `Constante string` |
| **$S_{14}$ (String)** | `\n` ou EOF | Retorna | `Erro léxico` (String não fechada) |
| **$S_{15}$ (Caractere)**| Qualquer char | $S_{16}$ | Lê caractere único |
| **$S_{16}$ (Fecha Char)**| `'` | Retorna | `Constante caractere` |

---

## 5. Especificação do Analisador Sintático SLR(1)

O módulo [`parser.js`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/parser.js) implementa um analisador ascendente determinístico baseado na técnica **Simple LR(1)**:
- **Coleção Canônica LR(0):** 105 estados gerados dinamicamente via cálculo de `closure()` e `gotoItens()`.
- **Tabelas ACTION e GOTO:** preenchidas com auxílio dos conjuntos `FOLLOW`. A gramática foi refatorada para possuir **0 conflitos Shift/Reduce ou Reduce/Reduce**.
- **Resolução de Ambiguidades Gramaticais:**
  - Expressões aritméticas estratificadas em `E`, `Term` e `Fat` garantindo precedência (`*`, `/` > `+`, `-`, unário `-`) e associatividade à esquerda.
  - Resolução do *dangling-else* através da divisão de comandos em fechados (`C_fechado`) e abertos (`C_aberto`), associando todo `else` ao `if` mais próximo.
  - Eliminação de conflitos em expressões booleanas com parênteses (`if (x > y) then`) via unificação em `B -> E relop E | E` e `Fat -> ( B )`.
- **Diagnóstico Descritivo de Erros:** quando o autômato encontra um token inesperado, a análise aponta linha, coluna, lexema lido e a lista exata de terminais esperados naquele estado da tabela ACTION.

---

## 6. Relação dos Arquivos de Teste

A pasta [`exemplos_teste/`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/exemplos_teste/) contém 6 programas que cobrem exaustivamente as produções da linguagem Sigma:

1. **[`teste1_programa_completo.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/exemplos_teste/teste1_programa_completo.txt)**: Programa completo com declarações (`integer`, `boolean`), leitura `read(x)`, atribuição, condicional `if-then-else`, escrita `write` e `writeln`.
2. **[`teste2_while_composto.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/exemplos_teste/teste2_while_composto.txt)**: Laço `while` com bloco composto `begin ... end`, leitura com `readln(limite)` e acumulador aritmético.
3. **[`teste3_sem_declaracoes.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/exemplos_teste/teste3_sem_declaracoes.txt)**: Programa válido sem seção de variáveis `var` (segunda produção de `S`), chamada de `readln` sem parâmetros e expressões aritméticas com parênteses e operador unário `-`.
4. **[`teste4_dangling_else_relacionais.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/exemplos_teste/teste4_dangling_else_relacionais.txt)**: Condicionais aninhadas (*dangling-else*), todos os operadores relacionais (`<`, `<=`, `>`, `>=`, `=`, `<>`) e teste com variável booleana direta.
5. **[`teste5_erros_sintaticos.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/exemplos_teste/teste5_erros_sintaticos.txt)**: Código com erros sintáticos propositais (expressão incompleta `10 + ;`, ausência de `then` e delimitador final faltante), validando a rejeição pelo autômato SLR(1) com mensagem explicativa.
6. **[`teste6_erros_lexicos.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/exemplos_teste/teste6_erros_lexicos.txt)**: Código com símbolos inválidos (`&`, `@`, `#`) e string não fechada para testar a resiliência léxica.

---

## 7. Estrutura do Código-Fonte

```
projeto-compilador/
│
├── index.html                   # Interface gráfica web responsiva (viewport-fit 100vh)
├── style.css                    # Estilos modernos em Vanilla CSS com suporte a modais e grafo SVG
├── lexer.js                     # Analisador Léxico baseado em AFD e gerador de passos de simulação
├── simulador_afd.js             # Módulo SVG interativo do AFD com Pan & Zoom e HUD de IHC
├── parser.js                    # Analisador Sintático SLR(1), Coleção LR(0) e Tabela de Símbolos
├── app.js                       # Controlador da interface, modais, eventos e execução
├── README.md                    # Documentação geral do projeto
├── DOCUMENTACAO_II_UNIDADE.md   # Artigo e relatório técnico completo da II Unidade
│
└── exemplos_teste/              # Conjunto de programas de teste da linguagem Sigma
    ├── teste1_programa_completo.txt
    ├── teste2_while_composto.txt
    ├── teste3_sem_declaracoes.txt
    ├── teste4_dangling_else_relacionais.txt
    ├── teste5_erros_sintaticos.txt
    └── teste6_erros_lexicos.txt
```
