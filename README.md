# UNIVERSIDADE ESTADUAL DO SUDOESTE DA BAHIA – UESB
## Departamento de Ciências Exatas – DCET
### Curso: Ciência da Computação | Disciplina: Compiladores
**Trabalho Prático da I Unidade: Implementação do Analisador Léxico (Mini_Pascal)**

---

## 1. Visão Geral do Projeto

Este projeto consiste na implementação de um **Analisador Léxico** para a linguagem **Mini_Pascal**, construído estritamente sobre a teoria de **Linguagens Formais e Autômatos Finitos Determinísticos (AFD)**.

O analisador foi desenvolvido utilizando **HTML5, Vanilla CSS e Vanilla JavaScript** puros, atendendo plenamente à exigência de **execução direta sem necessidade de compilação, instalação de dependências ou frameworks adicionais**.

---

## 2. Instruções de Instalação e Execução

### Modo 1: Execução Direta no Navegador (Recomendado)
Como o projeto foi concebido em tecnologias web nativas:
1. Abra a pasta do projeto no explorador de arquivos do Windows.
2. Dê um duplo clique no arquivo [`index.html`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/index.html).
3. O projeto será executado instantaneamente no seu navegador padrão (Google Chrome, Microsoft Edge, Firefox, etc.), pronto para uso.

### Modo 2: Execução via Linha de Comando (Node.js - Opcional)
O módulo [`lexer.js`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/lexer.js) foi projetado para ser universal (isomórfico). Para testar via terminal com Node.js:
```bash
node -e "const { AnalisadorLexico } = require('./lexer.js'); const fs = require('fs'); const lexer = new AnalisadorLexico(fs.readFileSync('exemplos_teste/teste1_exemplo_documento.txt', 'utf8')); console.log(lexer.executar().tokens);"
```

---

## 3. Especificação do Autômato Finito Determinístico (AFD)

O analisador léxico opera formalmente como uma 5-tupla $M = (\Sigma, Q, \delta, q_0, F)$:

- $\Sigma$: Alfabeto de entrada (conjunto de caracteres ASCII válidos).
- $Q$: Conjunto de estados $\{S_0, S_1, S_2, S_3, S_4, S_5, S_6, S_7, S_8, S_9, S_{10}, S_{11}, S_{12}, S_{13}, S_{14}, S_{15}, S_{16}\}$.
- $q_0$: Estado inicial ($S_0$).
- $\delta$: Função de transição de estados ($Q \times \Sigma \rightarrow Q$).
- $F$: Conjunto de estados de aceitação / reconhecimento de tokens.

### Tabela de Transições do Autômato

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
| **$S_1$ (Ident)** | Outro caractere | Retorna | Consulta tabela: `Palavra reservada`, `Operador lógico`, `Operador aritmético` ou `Identificador` |
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

## 4. Respostas às Decisões de Projeto (Conforme Roteiro UESB)

### a) Vai existir um limite para o tamanho dos identificadores?
> **Decisão:** Não há limite arbitrário curto rígido imposto ao tamanho dos identificadores. Eles podem ter qualquer extensão suportada pela memória, iniciando obrigatoriamente por letra ou caractere sublinhado `_`, seguido por letras, números e sublinhados (`[a-zA-Z_][a-zA-Z0-9_]*`). Isso oferece total conformidade e robustez para projetos complexos.

### b) Quais os tokens para as cadeias: `<palavra_reservada, palavra_reservada>` ou `<palavra_reservada, t_palavra_reservada>`?
> **Decisão:** Adotou-se o padrão nominal descritivo conforme explicitado no exemplo de execução do documento (páginas 3 e 4). Cada token pertence à sua respectiva categoria nominal:
> - `Palavra reservada`
> - `Identificador`
> - `Número inteiro`
> - `Número real`
> - `Operador aritmético`
> - `Operador relacional`
> - `Operador lógico`
> - `Símbolo especial`
> - `Atribuição`
> - `Constante caractere`
> - `Constante string`
> - `Fim`
> 
> Na saída em arquivo texto, o analisador gera os pares no formato `<cadeia, token>`, como `<program, Palavra reservada>` e `<:=, Atribuição>`, sem o uso de códigos numéricos opacos.

### c) Como implementar a tabela de palavras reservadas / símbolos?
> **Decisão (Opção A):** Foi implementada uma tabela dedicada para as palavras reservadas utilizando a estrutura `Set` com busca em tempo constante **$O(1)$** por hash. A tabela é instanciada na inicialização do analisador e contém todas as palavras reservadas especificadas no documento (em maiúsculas para busca *case-insensitive*):
> ```javascript
> const PALAVRAS_RESERVADAS = new Set([
>     "ABSOLUTE", "ARRAY", "BEGIN", "CASE", "CHAR", "CONST", "DIV", "DO", 
>     "DOWTO", "ELSE", "END", "EXTERNAL", "FILE", "FOR", "FORWARD", "FUNC", 
>     "FUNCTION", "GOTO", "IF", "IMPLEMENTATION", "INTEGER", "INTERFACE", 
>     "INTERRUPT", "LABEL", "MAIN", "NIL", "NIT", "OF", "PACKED", "PROC", 
>     "PROGRAM", "REAL", "RECORD", "REPEAT", "SET", "SHL", "SHR", "STRING", 
>     "THEN", "TO", "TYPE", "UNIT", "UNTIL", "USES", "VAR", "WHILE", 
>     "WITH", "XOR"
> ]);
> ```
> O autômato primeiro extrai a cadeia completa no estado `S1` e em seguida faz a consulta imediata $O(1)$. Se pertencer ao conjunto, classifica como `Palavra reservada`; caso contrário, classifica como `Identificador`.

### d) As informações que ficarão na tabela de símbolos serão inseridas pelo analisador léxico ou sintático?
> **Decisão:** Na arquitetura clássica recomendada para a etapa seguinte (SLR(1) na II Unidade), o **analisador léxico** tem como função exclusiva reconhecer os tokens e seus atributos básicos (lexema, tipo, linha e coluna). A inserção com tipagem semântica, escopo de bloco e endereço de memória é de responsabilidade primária do **analisador sintático e semântico**, evitando poluição precoce da tabela de símbolos com identificadores temporários em trechos com erro de sintaxe.

### e) Como serão tratados os erros léxicos? Especifique que estratégias de correção serão adotadas.
> **Decisão:** O analisador adota a **estratégia de recuperação em modo pânico léxico com relatório descritivo**:
> 1. Quando um caractere não reconhecido pelo AFD é lido (ex: `&`, `@`, `#`), o analisador registra um objeto de erro com a descrição, lexema inválido, número exato da linha e número da coluna.
> 2. O caractere espúrio é consumido e o autômato retorna imediatamente ao estado inicial $S_0$.
> 3. Isso impede que um único caractere inválido interrompa abruptamente a análise do restante do código-fonte, permitindo ao desenvolvedor visualizar todos os erros do arquivo em uma única execução.
> 4. Casos como strings ou comentários não fechados antes do fim de linha ou EOF também são detectados e devidamente sinalizados com mensagem clara ao usuário.

---

## 5. Relação dos Arquivos de Teste

O projeto inclui um diretório [`exemplos_teste/`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/exemplos_teste/) com 5 arquivos completos e diversificados:

1. **[`teste1_exemplo_documento.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/exemplos_teste/teste1_exemplo_documento.txt)**: Exemplo 1 original fornecido no roteiro do trabalho (cálculo com `pi`, condicionais `if-then-else`, `read`, `write`, `writeln`).
2. **[`teste2_programa_piloto.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/exemplos_teste/teste2_programa_piloto.txt)**: Exemplo 2 fornecido no roteiro (laço `for cont=1 to total do`, cálculo de médias com reais, comentários de bloco e mensagens em constantes strings).
3. **[`teste3_estruturas_repeticao.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/exemplos_teste/teste3_estruturas_repeticao.txt)**: Teste com laços `while-do` e `repeat-until`, operadores lógicos `and`, `or`, `not`, operadores relacionais `<>`, `<=`, `>=` e operador aritmético `mod`.
4. **[`teste4_tipos_e_expressoes.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/exemplos_teste/teste4_tipos_e_expressoes.txt)**: Teste com notação científica de números reais (ex: `24.40e-04`, `1.5e+02`), constantes de caracteres delimitadas por aspas simples `'A'` e constantes strings.
5. **[`teste5_erros_lexicos.txt`](file:///c:/Users/Brener/Documents/projetos/projeto-compilador/exemplos_teste/teste5_erros_lexicos.txt)**: Teste contendo propositalmente erros léxicos para validar a resiliência do compilador (símbolos desconhecidos como `&`, `@`, `#`, expoentes incompletos e strings não fechadas).

---

## 6. Estrutura do Código-Fonte

```
projeto-compilador/
│
├── index.html                   # Interface gráfica web amigável (executável direto)
├── style.css                    # Folha de estilos moderna (Vanilla CSS)
├── lexer.js                     # Motor léxico baseado no AFD (ricamente comentado)
├── app.js                       # Controlador da interface e manipulação de arquivos
├── DOCUMENTACAO.md              # Documentação completa para entrega
│
└── exemplos_teste/              # Arquivos .txt de teste exigidos na especificação
    ├── teste1_exemplo_documento.txt
    ├── teste2_programa_piloto.txt
    ├── teste3_estruturas_repeticao.txt
    ├── teste4_tipos_e_expressoes.txt
    └── teste5_erros_lexicos.txt
```
