# Implementação de um Analisador Sintático SLR(1) para a Linguagem Sigma

**Universidade Estadual do Sudoeste da Bahia – UESB**  
**Departamento de Ciências Exatas – DCET**  
**Disciplina:** Compiladores — **Professor:** José Carlos Martins Oliveira  
**Curso:** Ciência da Computação — **II Unidade**

---

## Resumo

Este documento apresenta o projeto e a implementação de um **Analisador Sintático SLR(1)** integrado ao **Analisador Léxico baseado em AFD** para a linguagem **Sigma**. A solução constrói dinamicamente os conjuntos `FIRST` e `FOLLOW`, a coleção canônica de itens `LR(0)` (105 estados) e as tabelas `ACTION` e `GOTO` com **zero conflitos**, além de gerar a **Tabela de Símbolos** das declarações e fornecer rastreamento passo a passo da pilha sintática e mensagens de erro descritivas em uma interface web executável diretamente no navegador.

---

## 1. Instalação e Utilização

O projeto foi desenvolvido em **HTML5, CSS3 e JavaScript Vanilla** (sem dependências externas, sem compilação e sem necessidade de servidor ou IDE).

### Execução Direta no Navegador
1. Abra a pasta `projeto-compilador/` no explorador de arquivos.
2. Dê um duplo clique no arquivo [`index.html`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/index.html).
3. Na interface:
   - Selecione um dos 6 programas de teste no menu superior ou carregue um arquivo `.txt`/`.pas` pelo botão **Abrir .txt**.
   - Clique em **Executar Análise** para visualizar:
     - **Sintático SLR(1):** status de aceitação/rejeição e rastreamento completo (Pilha de Estados, Pilha de Símbolos, Entrada e Ação).
     - **Tabela de Símbolos:** identificador do programa e variáveis declaradas com tipo, linha e coluna, além de avisos semânticos (redeclaração ou uso sem declaração prévia).
     - **Tokens / Texto .txt:** listagem completa de tokens e exportação no formato `<cadeia, token>`.

### Execução via Linha de Comando (Node.js - Opcional)
```bash
node -e "const fs=require('fs'); const {AnalisadorLexico}=require('./lexer.js'); const {AnalisadorSintatico}=require('./parser.js'); const lex=new AnalisadorLexico(fs.readFileSync('exemplos_teste/teste1_programa_completo.txt','utf8')).executar(); console.log(new AnalisadorSintatico().analisar(lex.tokens));"
```

---

## 2. O que foi feito e o que não foi feito

### O que foi feito
- **Atualização do Analisador Léxico ([`lexer.js`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/lexer.js)):** inclusão das palavras reservadas `BOOLEAN`, `READ`, `READLN`, `WRITE` e `WRITELN` na tabela `PALAVRAS_RESERVADAS` (busca $O(1)$ *case-insensitive*).
- **Motor SLR(1) Completo ([`parser.js`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/parser.js)):**
  - Cálculo automático de `FIRST` e `FOLLOW`.
  - Construção da Coleção Canônica de Itens `LR(0)` (105 estados).
  - Geração das tabelas `ACTION` e `GOTO` com **0 conflitos** Shift/Reduce ou Reduce/Reduce.
  - Rastreamento passo a passo das operações *Shift*, *Reduce*, *Accept* e *Error*.
- **Tabela de Símbolos e Verificações Leves:** registro do nome do programa e variáveis (`integer` e `boolean`) durante as reduções de declaração, com detecção de redeclaração e aviso de variável usada em atribuição sem declaração prévia.
- **Mensagens de Erro Esclarecedoras:** ao encontrar um erro sintático, o analisador informa linha, coluna, token encontrado e a lista exata de terminais esperados naquele estado.
- **Interface Web e Conjunto de Testes:** 6 arquivos de teste na pasta [`exemplos_teste/`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/projeto-compilador/exemplos_teste/).

### O que não foi feito
- **Recuperação de Erro Sintático em Modo Pânico:** ao detectar o primeiro erro sintático, o analisador interrompe a derivação e relata o erro imediatamente com os tokens esperados, em vez de tentar sincronizar com `;` ou `end` para reportar múltiplos erros sintáticos de uma só vez.
- **Geração de Código Intermediário / Árvore Sintática Abstrata (AST) Visual:** por não fazer parte do escopo da II Unidade, não foi implementado gerador de código ou renderização gráfica em árvore.

---

## 3. O que está funcionando e o que não está funcionando

- **Funcionando integralmente:**
  - Reconhecimento léxico e sintático SLR(1) de programas válidos da linguagem Sigma (com e sem bloco `var`, comandos de leitura/escrita, atribuições, `while`, `if-then` e `if-then-else` aninhados, expressões aritméticas e relacionais).
  - Rejeição correta de programas sintaticamente inválidos com indicação precisa de linha, coluna e tokens esperados.
  - Geração da Tabela de Símbolos e rastreamento da pilha SLR(1).
- **Limitações conhecidas:**
  - Caso o código possua erros léxicos graves, os tokens de erro léxico são filtrados antes da etapa sintática (e a interface alerta que a análise sintática prosseguiu ignorando os tokens inválidos, recomendando corrigir os erros léxicos primeiro).

---

## 4. Comentários sobre a Linguagem Sigma, Limitações e Modificações na Gramática

A gramática formal (GLC) fornecida originalmente na especificação apresentava três pontos incompatíveis diretamente com um analisador determinístico **SLR(1)**, os quais foram refatorados mantendo a linguagem reconhecida equivalente:

1. **Precedência e Associatividade em Expressões (`E`):**
   - *Original:* `E -> E + E | E - E | E * E | E / E | - E | (E) | id | num` (ambígua, causando conflitos Shift/Reduce).
   - *Modificação:* estratificação em `E` (`+`, `-`), `Term` (`*`, `/`) e `Fat` (`-` unário, `(B)`, `id`, `num`), garantindo precedência padrão e associatividade à esquerda sem ambiguidade.
2. **Ambiguidade do *Dangling-Else* (`N`):**
   - *Original:* `N -> if B then C | if B then C else C` (conflito Shift/Reduce quando o próximo token é `else`).
   - *Modificação:* divisão do não-terminal `C` em `C_fechado` (comandos sem `if` aberto pendente) e `C_aberto`, associando todo `else` ao `if` mais próximo de forma estritamente SLR(1).
3. **Expressões Booleanas (`B`) e Conflito Reduce/Reduce com `id`:**
   - *Original:* `B -> E < E | ... | id`. Como `E` também deriva `id` e aparece ao final de `B -> E relop E`, o conjunto `FOLLOW(Fat)` passa a conter `then` e `do`, gerando um conflito **Reduce/Reduce** em SLR(1) entre `B -> id •` e `Fat -> id •`. Além disso, a gramática original não previa parênteses ao redor de comparações como `if (x > y) then`.
   - *Modificação:* adotou-se `B -> E relop E | E` e `Fat -> ( B )`. Isso elimina completamente o conflito Reduce/Reduce e passa a aceitar expressões booleanas entre parênteses (`if (x > y) then`), mantendo `A -> id := E` restrito a expressões aritméticas. Como limitação sintática dessa escolha, expressões aritméticas isoladas (como `if 5 then`) também são aceitas sintaticamente em `B`, cabendo à análise semântica validar o tipo booleano.

### Limitações da Linguagem Sigma
- Possui apenas dois tipos (`integer` e `boolean`), sem `real`, `string` como tipo de variável, vetores ou subprogramas (`procedure`/`function`).
- Não possui operadores lógicos explícitos (`and`, `or`, `not`) nas produções de `B`, nem laço `for` ou `repeat-until`.
- Exige `;` obrigatório ao final do último comando antes de `end` (`L -> C ; | C ; L`).

---

## 5. Avaliação da Dupla

*(Espaço reservado para a avaliação pessoal da dupla sobre o desenvolvimento do trabalho, dificuldades encontradas na construção da tabela SLR(1) e aprendizados obtidos na disciplina.)*
