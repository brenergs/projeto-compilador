# Implementação de um Analisador Sintático SLR(1) e Simulador Visual de AFD para a Linguagem Sigma

**Universidade Estadual do Sudoeste da Bahia – UESB**  
**Departamento de Ciências Exatas – DCET**  
**Disciplina:** Compiladores — **Professor:** José Carlos Martins Oliveira  
**Curso:** Ciência da Computação — **II Unidade**

---

## Resumo

Este artigo técnico descreve a concepção, formalização e implementação do **Analisador Sintático SLR(1)** para a linguagem **Sigma**, integrado ao **Analisador Léxico baseado em Autômato Finito Determinístico (AFD)** da I Unidade. O compilador inclui a construção em tempo de execução dos conjuntos `FIRST` e `FOLLOW`, a geração da **Coleção Canônica de Itens LR(0)** (105 estados), as tabelas de decisão `ACTION` e `GOTO` com **zero conflitos**, a extração da **Tabela de Símbolos** e uma interface interativa baseada em princípios de **IHC (Interação Humano-Computador)** contendo um **Simulador Visual do AFD com Pan & Zoom** e um layout *viewport-fit* (sem scroll vertical global).

---

## 1. Instalação e Utilização

O projeto foi concebido utilizando exclusivamente tecnologias nativas da web (**HTML5, CSS3 e JavaScript Vanilla**), dispensando transpiladores, gerenciadores de pacotes ou servidores dedicados.

### Execução Direta no Navegador
1. Acesse a pasta do projeto e abra o arquivo [`index.html`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/index.html).
2. O sistema é carregado instantaneamente em tela cheia (100vh):
   - **Cabeçalho:** fornece os botões **`📖 Especificações`** (para consultar a teoria e formalismos em modal) e **`⚙️ Simulador AFD`** (para abrir a simulação gráfica).
   - **Painel de Métricas:** monitora tokens reconhecidos, erros léxicos, status sintático (*ACEITO/ERRO*), símbolos declarados, linhas e tempo de análise.
   - **Editor e Controle:** carregue um dos 6 exemplos pré-configurados ou suba um arquivo `.txt`/`.pas` pelo botão **📂 Abrir .txt**.
   - **Resultados Lado a Lado:** alterne entre as abas *Sintático SLR(1)* (passo a passo da pilha), *Tabela de Símbolos* (variáveis declaradas e avisos de escopo), *Tokens* e *Texto .txt* (com download da listagem colunar).
   - **Simulador Visual do AFD:** acione o botão flutuante no **canto inferior esquerdo** para abrir o modal de simulação com controles de *Play/Pause*, *Passo a Passo*, velocidade ajustável e navegação livre com *Pan & Zoom*.

### Execução via Linha de Comando (Node.js - Opcional)
```bash
node -e "const fs=require('fs'); const {AnalisadorLexico}=require('./lexer.js'); const {AnalisadorSintatico}=require('./parser.js'); const lex=new AnalisadorLexico(fs.readFileSync('exemplos_teste/teste1_programa_completo.txt','utf8')).executar(); console.log(new AnalisadorSintatico().analisar(lex.tokens));"
```

---

## 2. O que foi feito e o que não foi feito

### O que foi feito
1. **Adequação e Robustez do Analisador Léxico ([`lexer.js`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/lexer.js)):**
   - Inclusão das palavras-chave da linguagem Sigma (`BOOLEAN`, `READ`, `READLN`, `WRITE`, `WRITELN`) na tabela hash de busca $O(1)$.
   - Criação do método `gerarSimulacaoAFD()` para emitir o histórico completo de transições de estados, caracteres consumidos e descrições pedagógicas de cada ação.
2. **Construção do Analisador Sintático Ascendente SLR(1) ([`parser.js`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/parser.js)):**
   - Algoritmo de cálculo de fecho (`closure()`) e transição (`gotoItens()`) para itens $LR(0)$.
   - Construção dos conjuntos `FIRST` e `FOLLOW` para a gramática Sigma.
   - Geração dinâmica das matrizes `ACTION` (operações *Shift*, *Reduce*, *Accept*) e `GOTO` com **zero conflitos Shift/Reduce ou Reduce/Reduce**.
   - Rastreamento completo da execução com pilha de estados, pilha de símbolos, entrada restante e reduções gramaticais.
3. **Tabela de Símbolos e Verificação Semântica Leve:**
   - Extração do nome do programa e variáveis declaradas (`integer` e `boolean`) durante as reduções sintáticas de declaração.
   - Emissão de avisos semânticos para variáveis redeclaradas ou identificadores utilizados em comandos de atribuição sem declaração prévia.
4. **Simulador Visual e Interativo do AFD com IHC ([`simulador_afd.js`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/simulador_afd.js)):**
   - Renderização gráfica em SVG de todos os 17 estados e transições do autômato léxico.
   - Implementação de **Pan & Zoom contínuo** (arrasto com mouse e zoom via *wheel* ou botões `+`, `−`, `⟲ Reset`).
   - Painel HUD de feedback em tempo real (passo atual, caractere consumido, lexema acumulado, estado ativo e descrição didática).
5. **Ergonomia Visual e IHC na Interface Web ([`index.html`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/index.html) e [`style.css`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/style.css)):**
   - Reorganização do layout para *viewport-fit* (100vh sem scroll na página principal).
   - Abas de resultado e botão de download perfeitamente alinhados lado a lado.
   - Botão flutuante estilizado no canto inferior esquerdo e modal de especificações integrado ao cabeçalho.
6. **Conjunto Exaustivo de Testes ([`exemplos_teste/`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/exemplos_teste/)):** 6 arquivos cobrindo casos válidos, desvios condicionais, repetições e detecção precisa de erros léxicos e sintáticos.

### O que não foi feito
- **Recuperação de Erros Sintáticos em Modo Pânico com Continuidade:** ao encontrar o primeiro erro sintático, o analisador interrompe a derivação para reportar imediatamente o ponto exato da quebra (linha, coluna, token lido e tokens esperados), não tentando sincronizar com delimitadores `;` para múltiplos erros em cascata.
- **Geração de Código Intermediário / Código Objeto:** o escopo da II Unidade concentra-se estritamente na análise sintática determinística e tabela de símbolos.

---

## 3. O que está funcionando e o que não está funcionando

### Funcionando Integralmente
- Reconhecimento determinístico de programas válidos da linguagem Sigma, incluindo programas sem bloco de declaração `var`, chamadas de `read`/`readln`, `write`/`writeln`, comandos compostos `begin ... end`, laços `while ... do` e desvios `if ... then ... else`.
- Tratamento e descarte de comentários de bloco `/* ... */` sem interferir na análise sintática.
- Rejeição precisa de códigos inválidos com emissão de mensagem de erro informando a lista completa de símbolos permitidos para o estado da falha.
- Preenchimento e exibição da Tabela de Símbolos.
- Simulação gráfica do autômato com reprodução automática, controle de velocidade e navegação vetorial por Pan e Zoom.

### Limitações Conhecidas
- Quando o código-fonte contém erros léxicos explícitos (ex: símbolos como `&` ou `@`), os caracteres inválidos são isolados como tokens de erro e ignorados pelo parser sintático, permitindo avaliar a sintaxe residual enquanto a interface adverte o usuário a corrigir os erros léxicos.

---

## 4. Comentários sobre a Linguagem Sigma, Limitações e Modificações na Gramática

A gramática formal livre de contexto (GLC) apresentada originalmente na especificação do projeto exigiu três ajustes estruturais essenciais para permitir o reconhecimento determinístico via autômato **SLR(1)** com **0 conflitos**:

1. **Estratificação de Expressões Aritméticas (`E`):**
   - *Gramática Original:* `E -> E + E | E - E | E * E | E / E | - E | (E) | id | num`
   - *Problema:* Ambiguidade clássica de operadores que gera múltiplos conflitos *Shift/Reduce* na tabela SLR(1).
   - *Solução Adotada:* Estratificação clássica de precedência em três níveis:
     - $E \rightarrow E + Term \mid E - Term \mid Term$ (menor precedência, associatividade à esquerda)
     - $Term \rightarrow Term * Fat \mid Term / Fat \mid Fat$ (maior precedência)
     - $Fat \rightarrow - Fat \mid ( B ) \mid id \mid num$ (operador unário, subexpressões e operandos)
2. **Resolução do *Dangling-Else* (`N`):**
   - *Gramática Original:* `N -> if B then C | if B then C else C`
   - *Problema:* Conflito *Shift/Reduce* clássico quando o próximo símbolo é `else` (dúvida sobre qual `if` associar).
   - *Solução Adotada:* Divisão da categoria de comandos em comandos fechados (`C_fechado`) e abertos (`C_aberto`), forçando que cada cláusula `else` pertença ao `if` aberto mais interno.
3. **Eliminação de Conflito Reduce/Reduce em Expressões Booleanas (`B`):**
   - *Gramática Original:* `B -> E < E | ... | id` e `E -> id`.
   - *Problema:* Quando o autômato lia um identificador em contexto condicional, havia dúvida se reduzia para $B \rightarrow id$ ou $Fat \rightarrow id$, além de não comportar expressões relacionais agrupadas por parênteses como `if (x > y) then`.
   - *Solução Adotada:* Produção $B \rightarrow E \text{ relop } E \mid E$ combinada com $Fat \rightarrow ( B )$. Isso unifica os caminhos de redução, aceita parênteses de forma flexível e elimina completamente qualquer conflito *Reduce/Reduce*.

### Limitações Intrínsecas da Linguagem Sigma
- Tipagem primitiva limitada unicamente a `integer` e `boolean`.
- Ausência de declaração de matrizes, vetores, tipos de ponto flutuante na declaração de variáveis ou subrotinas (`procedure`/`function`).
- Obrigatoriedade estrita de ponto e vírgula após cada comando (`L -> C ; | C ; L`), inclusive antes da palavra reservada `end`.

---

## 5. Fundamentação de IHC (Interação Humano-Computador) no Simulador

A adição do simulador visual abordou diretamente a quebra do efeito "caixa-preta" dos compiladores, aplicando conceitos de IHC:
- **Visibilidade do Estado do Sistema (Heurística #1 de Nielsen):** o grafo SVG destaca em tempo real o estado ativo com halo ciano (`#38bdf8`), tokens aceitos em verde (`#34d399`) e arestas ativas.
- **Controle e Liberdade do Usuário (Heurística #3 de Nielsen):** suporte completo a pausa, retorno ao início, passo a passo individual, ajuste fino de velocidade e navegação espacial irrestrita através de **Pan & Zoom**.
- **Prevenção e Diagnóstico de Erros (Heurísticas #5 e #9 de Nielsen):** relatórios de erro sintático destacam a localização exata no código e listam explicitamente os terminais válidos para continuidade.

---

## 6. Avaliação da Dupla

*(Espaço reservado para a avaliação reflexiva da dupla sobre o processo de implementação, o domínio dos algoritmos SLR(1), as decisões de IHC adotadas e os resultados obtidos na disciplina.)*
