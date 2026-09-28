/**
 * ============================================================================
 * UNIVERSIDADE ESTADUAL DO SUDOESTE DA BAHIA - UESB
 * Departamento de Ciências Exatas - DCET
 * Disciplina: Compiladores
 * Trabalho Prático da I Unidade - Analisador Léxico (Mini_Pascal)
 * ============================================================================
 * 
 * Este arquivo implementa o Analisador Léxico baseado em um
 * AUTÔMATO FINITO DETERMINÍSTICO (AFD).
 * 
 * O analisador opera como uma máquina de estados que consome caracteres
 * do código-fonte e agrupa-os em unidades mínimas com significado (tokens).
 */

// ----------------------------------------------------------------------------
// 1. ESTRUTURA DE DADOS: TABELA DE PALAVRAS RESERVADAS
// ----------------------------------------------------------------------------
// Implementada utilizando um conjunto (Set) para busca com complexidade O(1).
// As palavras reservadas são armazenadas em caixa alta para garantir
// busca insensível a maiúsculas/minúsculas (case-insensitive), padrão Pascal.

const PALAVRAS_RESERVADAS = new Set([
    "ABSOLUTE", "ARRAY", "BEGIN", "CASE", "CHAR", "CONST", "DIV", "DO", 
    "DOWTO", "ELSE", "END", "EXTERNAL", "FILE", "FOR", "FORWARD", "FUNC", 
    "FUNCTION", "GOTO", "IF", "IMPLEMENTATION", "INTEGER", "INTERFACE", 
    "INTERRUPT", "LABEL", "MAIN", "NIL", "NIT", "OF", "PACKED", "PROC", 
    "PROGRAM", "REAL", "RECORD", "REPEAT", "SET", "SHL", "SHR", "STRING", 
    "THEN", "TO", "TYPE", "UNIT", "UNTIL", "USES", "VAR", "WHILE", 
    "WITH", "XOR"
]);

// Operadores lógicos e aritméticos textuais especiais
const OPERADORES_LOGICOS = new Set(["AND", "OR", "NOT"]);
const OPERADORES_ARITMETICOS_TEXTUAIS = new Set(["MOD"]);

// ----------------------------------------------------------------------------
// 2. CATEGORIAS DE TOKENS (Conforme especificação da UESB)
// ----------------------------------------------------------------------------
const TIPO_TOKEN = {
    PALAVRA_RESERVADA: "Palavra reservada",
    IDENTIFICADOR: "Identificador",
    NUMERO_INTEIRO: "Número inteiro",
    NUMERO_REAL: "Número real",
    OPERADOR_ARITMETICO: "Operador aritmético",
    OPERADOR_RELACIONAL: "Operador relacional",
    OPERADOR_LOGICO: "Operador lógico",
    SIMBOLO_ESPECIAL: "Símbolo especial",
    ATRIBUICAO: "Atribuição",
    CONSTANTE_CARACTERE: "Constante caractere",
    CONSTANTE_STRING: "Constante string",
    FIM: "Fim",
    ERRO: "Erro léxico"
};

// ----------------------------------------------------------------------------
// 3. ESTADOS DO AUTÔMATO FINITO DETERMINÍSTICO (AFD)
// ----------------------------------------------------------------------------
const ESTADO = {
    INICIO: 0,
    IDENTIFICADOR: 1,
    NUMERO_INTEIRO: 2,
    NUMERO_PONTO: 3,
    NUMERO_REAL: 4,
    NUMERO_EXP_INICIO: 5,
    NUMERO_EXP_SINAL: 6,
    NUMERO_EXP_DIGITOS: 7,
    DOIS_PONTOS: 8,
    MENOR: 9,
    MAIOR: 10,
    BARRA: 11,
    COMENTARIO_BLOCO: 12,
    COMENTARIO_FECHANDO: 13,
    STRING: 14,
    CARACTERE: 15,
    CARACTERE_FECHA: 16
};

// ----------------------------------------------------------------------------
// 4. CLASSE PRINCIPAL: ANALISADOR LÉXICO
// ----------------------------------------------------------------------------
class AnalisadorLexico {
    /**
     * @param {string} codigoFonte Código fonte a ser analisado
     */
    constructor(codigoFonte) {
        this.fonte = codigoFonte || "";
        this.tamanho = this.fonte.length;
        this.posicao = 0;   // Índice do caractere atual
        this.linha = 1;     // Número da linha atual
        this.coluna = 1;    // Número da coluna atual
        this.erros = [];    // Lista de erros léxicos encontrados
    }

    /**
     * Retorna o caractere atual sem avançar o cursor (lookahead)
     */
    caractereAtual() {
        if (this.posicao >= this.tamanho) return null;
        return this.fonte[this.posicao];
    }

    /**
     * Retorna o próximo caractere sem avançar o cursor (lookahead de 2 posições)
     */
    espiarProximo() {
        if (this.posicao + 1 >= this.tamanho) return null;
        return this.fonte[this.posicao + 1];
    }

    /**
     * Avança o cursor para o próximo caractere e atualiza linha/coluna
     */
    avancar() {
        const c = this.caractereAtual();
        this.posicao++;
        if (c === '\n') {
            this.linha++;
            this.coluna = 1;
        } else {
            this.coluna++;
        }
        return c;
    }

    /**
     * Verifica se um caractere é uma letra (a-z, A-Z) ou sublinhado (_)
     */
    isLetra(c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    }

    /**
     * Verifica se um caractere é um dígito (0-9)
     */
    isDigito(c) {
        return c >= '0' && c <= '9';
    }

    /**
     * Verifica se é espaço em branco (espaço, tabulação, quebra de linha)
     */
    isEspaco(c) {
        return c === ' ' || c === '\t' || c === '\r' || c === '\n';
    }

    /**
     * Obtém o próximo token do código fonte baseado no Autômato Finito Determinístico.
     * Sempre que chamado, retorna um objeto { lexema, token, linha, coluna }
     * ou null quando atinge o final do arquivo.
     */
    obterProximoToken() {
        let estado = ESTADO.INICIO;
        let lexema = "";
        let linhaInicio = this.linha;
        let colunaInicio = this.coluna;

        while (this.posicao < this.tamanho) {
            const c = this.caractereAtual();

            switch (estado) {
                // -------------------------------------------------------------
                // ESTADO INICIAL (S0)
                // -------------------------------------------------------------
                case ESTADO.INICIO:
                    linhaInicio = this.linha;
                    colunaInicio = this.coluna;

                    // 1. Ignorar espaços em branco
                    if (this.isEspaco(c)) {
                        this.avancar();
                        continue;
                    }

                    // 2. Início de identificador ou palavra reservada: [a-zA-Z_]
                    if (this.isLetra(c)) {
                        lexema += this.avancar();
                        estado = ESTADO.IDENTIFICADOR;
                        break;
                    }

                    // 3. Início de número inteiro ou real: [0-9]
                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_INTEIRO;
                        break;
                    }

                    // 4. Operador de Atribuição (:=) ou Dois Pontos (:)
                    if (c === ':') {
                        lexema += this.avancar();
                        estado = ESTADO.DOIS_PONTOS;
                        break;
                    }

                    // 5. Operador Relacional Menor (<), Menor Igual (<=) ou Diferente (<>)
                    if (c === '<') {
                        lexema += this.avancar();
                        estado = ESTADO.MENOR;
                        break;
                    }

                    // 6. Operador Relacional Maior (>), Maior Igual (>=)
                    if (c === '>') {
                        lexema += this.avancar();
                        estado = ESTADO.MAIOR;
                        break;
                    }

                    // 7. Operador Relacional Igual (=)
                    if (c === '=') {
                        lexema += this.avancar();
                        return { lexema, token: TIPO_TOKEN.OPERADOR_RELACIONAL, linha: linhaInicio, coluna: colunaInicio };
                    }

                    // 8. Operadores Aritméticos: +, -, *
                    if (c === '+' || c === '-' || c === '*') {
                        lexema += this.avancar();
                        return { lexema, token: TIPO_TOKEN.OPERADOR_ARITMETICO, linha: linhaInicio, coluna: colunaInicio };
                    }

                    // 9. Barra (/) - pode ser divisão ou início de comentário de bloco (/*)
                    if (c === '/') {
                        lexema += this.avancar();
                        estado = ESTADO.BARRA;
                        break;
                    }

                    // 10. Ponto final (.) - indica 'Fim' na especificação Mini_Pascal
                    if (c === '.') {
                        lexema += this.avancar();
                        return { lexema, token: TIPO_TOKEN.FIM, linha: linhaInicio, coluna: colunaInicio };
                    }

                    // 11. Símbolos especiais simples: , ; ( )
                    if (c === ',' || c === ';' || c === '(' || c === ')') {
                        lexema += this.avancar();
                        return { lexema, token: TIPO_TOKEN.SIMBOLO_ESPECIAL, linha: linhaInicio, coluna: colunaInicio };
                    }

                    // 12. Constante caractere delimitada por aspas simples (' ')
                    if (c === "'") {
                        lexema += this.avancar();
                        estado = ESTADO.CARACTERE;
                        break;
                    }

                    // 13. Constante string delimitada por aspas duplas (" ")
                    if (c === '"') {
                        lexema += this.avancar();
                        estado = ESTADO.STRING;
                        break;
                    }

                    // 14. Caractere desconhecido / Erro léxico
                    lexema += this.avancar();
                    const erro = {
                        lexema,
                        token: TIPO_TOKEN.ERRO,
                        mensagem: `Caractere inválido ou desconhecido '${lexema}'`,
                        linha: linhaInicio,
                        coluna: colunaInicio
                    };
                    this.erros.push(erro);
                    return erro;

                // -------------------------------------------------------------
                // ESTADO: IDENTIFICADOR / PALAVRA RESERVADA
                // -------------------------------------------------------------
                case ESTADO.IDENTIFICADOR:
                    if (this.isLetra(c) || this.isDigito(c)) {
                        lexema += this.avancar();
                    } else {
                        // Fim do identificador: verificar se é palavra reservada ou operador
                        const lexemaUpper = lexema.toUpperCase();

                        if (PALAVRAS_RESERVADAS.has(lexemaUpper)) {
                            return { lexema, token: TIPO_TOKEN.PALAVRA_RESERVADA, linha: linhaInicio, coluna: colunaInicio };
                        } else if (OPERADORES_LOGICOS.has(lexemaUpper)) {
                            return { lexema, token: TIPO_TOKEN.OPERADOR_LOGICO, linha: linhaInicio, coluna: colunaInicio };
                        } else if (OPERADORES_ARITMETICOS_TEXTUAIS.has(lexemaUpper)) {
                            return { lexema, token: TIPO_TOKEN.OPERADOR_ARITMETICO, linha: linhaInicio, coluna: colunaInicio };
                        } else {
                            return { lexema, token: TIPO_TOKEN.IDENTIFICADOR, linha: linhaInicio, coluna: colunaInicio };
                        }
                    }
                    break;

                // -------------------------------------------------------------
                // ESTADO: NÚMERO INTEIRO
                // -------------------------------------------------------------
                case ESTADO.NUMERO_INTEIRO:
                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                    } else if (c === '.') {
                        // Verificar se é número real (ex: 3.14) ou ponto final seguido de espaço/eof
                        // Se o próximo caractere após o ponto for um dígito, transita para real
                        const prox = this.espiarProximo();
                        if (this.isDigito(prox)) {
                            lexema += this.avancar(); // consome '.'
                            estado = ESTADO.NUMERO_REAL;
                        } else {
                            // É apenas um inteiro seguido de outro token (ex: 'end.' ou intervalo '..')
                            return { lexema, token: TIPO_TOKEN.NUMERO_INTEIRO, linha: linhaInicio, coluna: colunaInicio };
                        }
                    } else if (c === 'e' || c === 'E') {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_INICIO;
                    } else {
                        return { lexema, token: TIPO_TOKEN.NUMERO_INTEIRO, linha: linhaInicio, coluna: colunaInicio };
                    }
                    break;

                // -------------------------------------------------------------
                // ESTADO: NÚMERO REAL
                // -------------------------------------------------------------
                case ESTADO.NUMERO_REAL:
                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                    } else if (c === 'e' || c === 'E') {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_INICIO;
                    } else {
                        return { lexema, token: TIPO_TOKEN.NUMERO_REAL, linha: linhaInicio, coluna: colunaInicio };
                    }
                    break;

                // -------------------------------------------------------------
                // ESTADO: EXPONENTE EM NÚMERO REAL (ex: 24.40e-04 ou 1e+2)
                // -------------------------------------------------------------
                case ESTADO.NUMERO_EXP_INICIO:
                    if (c === '+' || c === '-') {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_SINAL;
                    } else if (this.isDigito(c)) {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_DIGITOS;
                    } else {
                        const erro = {
                            lexema,
                            token: TIPO_TOKEN.ERRO,
                            mensagem: `Formato de número real inválido após expoente '${lexema}'`,
                            linha: linhaInicio,
                            coluna: colunaInicio
                        };
                        this.erros.push(erro);
                        return erro;
                    }
                    break;

                case ESTADO.NUMERO_EXP_SINAL:
                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_DIGITOS;
                    } else {
                        const erro = {
                            lexema,
                            token: TIPO_TOKEN.ERRO,
                            mensagem: `Esperado dígito após sinal do expoente em '${lexema}'`,
                            linha: linhaInicio,
                            coluna: colunaInicio
                        };
                        this.erros.push(erro);
                        return erro;
                    }
                    break;

                case ESTADO.NUMERO_EXP_DIGITOS:
                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                    } else {
                        return { lexema, token: TIPO_TOKEN.NUMERO_REAL, linha: linhaInicio, coluna: colunaInicio };
                    }
                    break;

                // -------------------------------------------------------------
                // ESTADO: DOIS PONTOS ( : ou := )
                // -------------------------------------------------------------
                case ESTADO.DOIS_PONTOS:
                    if (c === '=') {
                        lexema += this.avancar();
                        return { lexema, token: TIPO_TOKEN.ATRIBUICAO, linha: linhaInicio, coluna: colunaInicio };
                    } else {
                        return { lexema, token: TIPO_TOKEN.SIMBOLO_ESPECIAL, linha: linhaInicio, coluna: colunaInicio };
                    }

                // -------------------------------------------------------------
                // ESTADO: MENOR QUE ( < ou <= ou <> )
                // -------------------------------------------------------------
                case ESTADO.MENOR:
                    if (c === '=' || c === '>') {
                        lexema += this.avancar();
                        return { lexema, token: TIPO_TOKEN.OPERADOR_RELACIONAL, linha: linhaInicio, coluna: colunaInicio };
                    } else {
                        return { lexema, token: TIPO_TOKEN.OPERADOR_RELACIONAL, linha: linhaInicio, coluna: colunaInicio };
                    }

                // -------------------------------------------------------------
                // ESTADO: MAIOR QUE ( > ou >= )
                // -------------------------------------------------------------
                case ESTADO.MAIOR:
                    if (c === '=') {
                        lexema += this.avancar();
                        return { lexema, token: TIPO_TOKEN.OPERADOR_RELACIONAL, linha: linhaInicio, coluna: colunaInicio };
                    } else {
                        return { lexema, token: TIPO_TOKEN.OPERADOR_RELACIONAL, linha: linhaInicio, coluna: colunaInicio };
                    }

                // -------------------------------------------------------------
                // ESTADO: BARRA ( / ou /* início de comentário )
                // -------------------------------------------------------------
                case ESTADO.BARRA:
                    if (c === '*') {
                        this.avancar(); // consome '*'
                        estado = ESTADO.COMENTARIO_BLOCO;
                    } else {
                        // Apenas operador de divisão
                        return { lexema, token: TIPO_TOKEN.OPERADOR_ARITMETICO, linha: linhaInicio, coluna: colunaInicio };
                    }
                    break;

                // -------------------------------------------------------------
                // ESTADO: DENTRO DO COMENTÁRIO DE BLOCO (/* ... */)
                // -------------------------------------------------------------
                case ESTADO.COMENTARIO_BLOCO:
                    if (c === '*') {
                        this.avancar();
                        estado = ESTADO.COMENTARIO_FECHANDO;
                    } else {
                        this.avancar(); // ignora conteúdo do comentário
                    }
                    break;

                case ESTADO.COMENTARIO_FECHANDO:
                    if (c === '/') {
                        this.avancar(); // fecha comentário
                        // Comentário descartado com sucesso, reiniciar para o próximo token
                        estado = ESTADO.INICIO;
                        lexema = "";
                    } else if (c === '*') {
                        this.avancar(); // ainda em asteriscos consecutivos
                    } else {
                        this.avancar();
                        estado = ESTADO.COMENTARIO_BLOCO;
                    }
                    break;

                // -------------------------------------------------------------
                // ESTADO: CONSTANTE STRING (" ... ")
                // -------------------------------------------------------------
                case ESTADO.STRING:
                    if (c === '"') {
                        lexema += this.avancar();
                        return { lexema, token: TIPO_TOKEN.CONSTANTE_STRING, linha: linhaInicio, coluna: colunaInicio };
                    } else if (c === '\n' || c === null) {
                        const erro = {
                            lexema,
                            token: TIPO_TOKEN.ERRO,
                            mensagem: "Constante string não fechada antes do final da linha",
                            linha: linhaInicio,
                            coluna: colunaInicio
                        };
                        this.erros.push(erro);
                        return erro;
                    } else {
                        lexema += this.avancar();
                    }
                    break;

                // -------------------------------------------------------------
                // ESTADO: CONSTANTE CARACTERE ('x')
                // -------------------------------------------------------------
                case ESTADO.CARACTERE:
                    if (c === "'") {
                        // Caractere vazio ''
                        lexema += this.avancar();
                        const erro = {
                            lexema,
                            token: TIPO_TOKEN.ERRO,
                            mensagem: "Constante caractere vazia '' não permitida",
                            linha: linhaInicio,
                            coluna: colunaInicio
                        };
                        this.erros.push(erro);
                        return erro;
                    } else if (c === '\n' || c === null) {
                        const erro = {
                            lexema,
                            token: TIPO_TOKEN.ERRO,
                            mensagem: "Constante caractere não fechada",
                            linha: linhaInicio,
                            coluna: colunaInicio
                        };
                        this.erros.push(erro);
                        return erro;
                    } else {
                        lexema += this.avancar();
                        estado = ESTADO.CARACTERE_FECHA;
                    }
                    break;

                case ESTADO.CARACTERE_FECHA:
                    if (c === "'") {
                        lexema += this.avancar();
                        return { lexema, token: TIPO_TOKEN.CONSTANTE_CARACTERE, linha: linhaInicio, coluna: colunaInicio };
                    } else {
                        // Mais de um caractere dentro de aspas simples
                        while (this.posicao < this.tamanho && this.caractereAtual() !== "'" && this.caractereAtual() !== '\n') {
                            lexema += this.avancar();
                        }
                        if (this.caractereAtual() === "'") {
                            lexema += this.avancar();
                        }
                        const erro = {
                            lexema,
                            token: TIPO_TOKEN.ERRO,
                            mensagem: "Constante caractere deve conter exatamente um caractere. Para textos, utilize aspas duplas (\")",
                            linha: linhaInicio,
                            coluna: colunaInicio
                        };
                        this.erros.push(erro);
                        return erro;
                    }
            }
        }

        // Se chegou ao final e ficou em algum estado não-final
        if (estado === ESTADO.IDENTIFICADOR) {
            const lexemaUpper = lexema.toUpperCase();
            if (PALAVRAS_RESERVADAS.has(lexemaUpper)) {
                return { lexema, token: TIPO_TOKEN.PALAVRA_RESERVADA, linha: linhaInicio, coluna: colunaInicio };
            } else if (OPERADORES_LOGICOS.has(lexemaUpper)) {
                return { lexema, token: TIPO_TOKEN.OPERADOR_LOGICO, linha: linhaInicio, coluna: colunaInicio };
            } else if (OPERADORES_ARITMETICOS_TEXTUAIS.has(lexemaUpper)) {
                return { lexema, token: TIPO_TOKEN.OPERADOR_ARITMETICO, linha: linhaInicio, coluna: colunaInicio };
            }
            return { lexema, token: TIPO_TOKEN.IDENTIFICADOR, linha: linhaInicio, coluna: colunaInicio };
        }

        if (estado === ESTADO.NUMERO_INTEIRO) {
            return { lexema, token: TIPO_TOKEN.NUMERO_INTEIRO, linha: linhaInicio, coluna: colunaInicio };
        }

        if (estado === ESTADO.NUMERO_REAL || estado === ESTADO.NUMERO_EXP_DIGITOS) {
            return { lexema, token: TIPO_TOKEN.NUMERO_REAL, linha: linhaInicio, coluna: colunaInicio };
        }

        if (estado === ESTADO.DOIS_PONTOS) {
            return { lexema, token: TIPO_TOKEN.SIMBOLO_ESPECIAL, linha: linhaInicio, coluna: colunaInicio };
        }

        if (estado === ESTADO.MENOR || estado === ESTADO.MAIOR) {
            return { lexema, token: TIPO_TOKEN.OPERADOR_RELACIONAL, linha: linhaInicio, coluna: colunaInicio };
        }

        if (estado === ESTADO.BARRA) {
            return { lexema, token: TIPO_TOKEN.OPERADOR_ARITMETICO, linha: linhaInicio, coluna: colunaInicio };
        }

        if (estado === ESTADO.COMENTARIO_BLOCO || estado === ESTADO.COMENTARIO_FECHANDO) {
            const erro = {
                lexema: "/* ...",
                token: TIPO_TOKEN.ERRO,
                mensagem: "Comentário de bloco não fechado no final do arquivo",
                linha: linhaInicio,
                coluna: colunaInicio
            };
            this.erros.push(erro);
            return erro;
        }

        if (estado === ESTADO.STRING || estado === ESTADO.CARACTERE || estado === ESTADO.CARACTERE_FECHA) {
            const erro = {
                lexema,
                token: TIPO_TOKEN.ERRO,
                mensagem: "Constante literal não fechada no final do arquivo",
                linha: linhaInicio,
                coluna: colunaInicio
            };
            this.erros.push(erro);
            return erro;
        }

        return null; // Fim do código fonte alcançado
    }

    /**
     * Executa a análise completa do código fonte e retorna todos os tokens e erros
     */
    executar() {
        const tokens = [];
        let tokenAtual;

        while ((tokenAtual = this.obterProximoToken()) !== null) {
            tokens.push(tokenAtual);
        }

        return {
            tokens,
            erros: this.erros
        };
    }
}

// Exportação compatível tanto para navegador quanto para Node.js
if (typeof window !== "undefined") {
    window.AnalisadorLexico = AnalisadorLexico;
    window.TIPO_TOKEN = TIPO_TOKEN;
    window.PALAVRAS_RESERVADAS = PALAVRAS_RESERVADAS;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { AnalisadorLexico, TIPO_TOKEN, PALAVRAS_RESERVADAS };
}
