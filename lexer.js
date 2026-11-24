/**
 * ============================================================================
 * UNIVERSIDADE ESTADUAL DO SUDOESTE DA BAHIA - UESB
 * Departamento de Ciências Exatas - DCET
 * Disciplina: Compiladores
 * Trabalho Prático da I e II Unidades - Analisador Léxico (Mini_Pascal / Sigma)
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
    "ABSOLUTE", "ARRAY", "BEGIN", "BOOLEAN", "CASE", "CHAR", "CONST", "DIV", "DO", 
    "DOWTO", "ELSE", "END", "EXTERNAL", "FILE", "FOR", "FORWARD", "FUNC", 
    "FUNCTION", "GOTO", "IF", "IMPLEMENTATION", "INTEGER", "INTERFACE", 
    "INTERRUPT", "LABEL", "MAIN", "NIL", "NIT", "OF", "PACKED", "PROC", 
    "PROGRAM", "READ", "READLN", "REAL", "RECORD", "REPEAT", "SET", "SHL", "SHR", "STRING", 
    "THEN", "TO", "TYPE", "UNIT", "UNTIL", "USES", "VAR", "WHILE", 
    "WITH", "WRITE", "WRITELN", "XOR"
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
        this.historicoPassos = []; // Passos de transição do AFD para simulação visual
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
            erros: this.erros,
            passosAFD: this.historicoPassos
        };
    }

    /**
     * Gera uma sequência detalhada de passos da máquina de estados do AFD
     * para visualização e simulação didática de IHC.
     */
    gerarSimulacaoAFD() {
        // Reinicializa cursor
        this.posicao = 0;
        this.linha = 1;
        this.coluna = 1;
        this.erros = [];
        const passos = [];

        let estado = ESTADO.INICIO;
        let lexema = "";
        let posInicio = 0;

        const registrarPasso = (tipoAcao, estadoOrigem, estadoDestino, charLido, descricao) => {
            passos.push({
                posicaoCursor: this.posicao,
                linha: this.linha,
                coluna: this.coluna,
                tipoAcao, // 'transicao', 'descarte', 'reconhecimento', 'erro'
                estadoOrigem,
                estadoDestino,
                charLido: charLido === '\n' ? '\\n' : (charLido === '\t' ? '\\t' : (charLido === ' ' ? '␣' : charLido)),
                lexema,
                descricao
            });
        };

        // Estado inicial
        registrarPasso('inicio', ESTADO.INICIO, ESTADO.INICIO, null, 'Início do processamento no estado S0');

        while (this.posicao < this.tamanho) {
            const c = this.caractereAtual();
            const posAtual = this.posicao;

            switch (estado) {
                case ESTADO.INICIO:
                    posInicio = this.posicao;
                    if (this.isEspaco(c)) {
                        this.avancar();
                        registrarPasso('descarte', ESTADO.INICIO, ESTADO.INICIO, c, `Espaço em branco descartado: '${c === '\n' ? '\\n' : (c === ' ' ? '␣' : c)}'`);
                        continue;
                    }

                    if (this.isLetra(c)) {
                        lexema += this.avancar();
                        estado = ESTADO.IDENTIFICADOR;
                        registrarPasso('transicao', ESTADO.INICIO, ESTADO.IDENTIFICADOR, c, `Letra lida '${c}' -> transita para S1 (Identificador/Palavra)`);
                        break;
                    }

                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_INTEIRO;
                        registrarPasso('transicao', ESTADO.INICIO, ESTADO.NUMERO_INTEIRO, c, `Dígito lido '${c}' -> transita para S2 (Número Inteiro)`);
                        break;
                    }

                    if (c === ':') {
                        lexema += this.avancar();
                        estado = ESTADO.DOIS_PONTOS;
                        registrarPasso('transicao', ESTADO.INICIO, ESTADO.DOIS_PONTOS, c, `Caractere ':' lido -> transita para S8 (Dois Pontos / Atribuição)`);
                        break;
                    }

                    if (c === '<') {
                        lexema += this.avancar();
                        estado = ESTADO.MENOR;
                        registrarPasso('transicao', ESTADO.INICIO, ESTADO.MENOR, c, `Caractere '<' lido -> transita para S9 (Menor / Relacional)`);
                        break;
                    }

                    if (c === '>') {
                        lexema += this.avancar();
                        estado = ESTADO.MAIOR;
                        registrarPasso('transicao', ESTADO.INICIO, ESTADO.MAIOR, c, `Caractere '>' lido -> transita para S10 (Maior / Relacional)`);
                        break;
                    }

                    if (c === '=') {
                        lexema += this.avancar();
                        registrarPasso('reconhecimento', ESTADO.INICIO, ESTADO.INICIO, c, `Operador relacional '=' reconhecido`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                        break;
                    }

                    if (c === '+' || c === '-' || c === '*') {
                        lexema += this.avancar();
                        registrarPasso('reconhecimento', ESTADO.INICIO, ESTADO.INICIO, c, `Operador aritmético '${c}' reconhecido`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                        break;
                    }

                    if (c === '/') {
                        lexema += this.avancar();
                        estado = ESTADO.BARRA;
                        registrarPasso('transicao', ESTADO.INICIO, ESTADO.BARRA, c, `Caractere '/' lido -> transita para S11 (Barra / Divisão / Comentário)`);
                        break;
                    }

                    if (c === '.') {
                        lexema += this.avancar();
                        registrarPasso('reconhecimento', ESTADO.INICIO, ESTADO.INICIO, c, `Delimitador '.' (Fim) reconhecido`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                        break;
                    }

                    if (c === ',' || c === ';' || c === '(' || c === ')') {
                        lexema += this.avancar();
                        registrarPasso('reconhecimento', ESTADO.INICIO, ESTADO.INICIO, c, `Símbolo especial '${c}' reconhecido`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                        break;
                    }

                    if (c === "'") {
                        lexema += this.avancar();
                        estado = ESTADO.CARACTERE;
                        registrarPasso('transicao', ESTADO.INICIO, ESTADO.CARACTERE, c, `Aspas simples "'" lida -> transita para S15 (Caractere)`);
                        break;
                    }

                    if (c === '"') {
                        lexema += this.avancar();
                        estado = ESTADO.STRING;
                        registrarPasso('transicao', ESTADO.INICIO, ESTADO.STRING, c, `Aspas duplas '"' lida -> transita para S14 (String)`);
                        break;
                    }

                    lexema += this.avancar();
                    registrarPasso('erro', ESTADO.INICIO, ESTADO.INICIO, c, `Caractere inválido ou desconhecido '${c}'`);
                    lexema = "";
                    estado = ESTADO.INICIO;
                    break;

                case ESTADO.IDENTIFICADOR:
                    if (this.isLetra(c) || this.isDigito(c)) {
                        lexema += this.avancar();
                        registrarPasso('transicao', ESTADO.IDENTIFICADOR, ESTADO.IDENTIFICADOR, c, `Caractere '${c}' acumulado no identificador "${lexema}"`);
                    } else {
                        const upper = lexema.toUpperCase();
                        let tipo = 'Identificador';
                        if (PALAVRAS_RESERVADAS.has(upper)) tipo = 'Palavra reservada';
                        else if (OPERADORES_LOGICOS.has(upper)) tipo = 'Operador lógico';
                        else if (OPERADORES_ARITMETICOS_TEXTUAIS.has(upper)) tipo = 'Operador aritmético';

                        registrarPasso('reconhecimento', ESTADO.IDENTIFICADOR, ESTADO.INICIO, null, `${tipo} "${lexema}" reconhecido(a) com sucesso`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    }
                    break;

                case ESTADO.NUMERO_INTEIRO:
                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                        registrarPasso('transicao', ESTADO.NUMERO_INTEIRO, ESTADO.NUMERO_INTEIRO, c, `Dígito '${c}' acumulado no inteiro "${lexema}"`);
                    } else if (c === '.') {
                        const prox = this.espiarProximo();
                        if (this.isDigito(prox)) {
                            lexema += this.avancar();
                            estado = ESTADO.NUMERO_REAL;
                            registrarPasso('transicao', ESTADO.NUMERO_INTEIRO, ESTADO.NUMERO_REAL, c, `Ponto fracionário lido -> transita para S4 (Número Real)`);
                        } else {
                            registrarPasso('reconhecimento', ESTADO.NUMERO_INTEIRO, ESTADO.INICIO, null, `Número inteiro "${lexema}" reconhecido`);
                            lexema = "";
                            estado = ESTADO.INICIO;
                        }
                    } else if (c === 'e' || c === 'E') {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_INICIO;
                        registrarPasso('transicao', ESTADO.NUMERO_INTEIRO, ESTADO.NUMERO_EXP_INICIO, c, `Expoente '${c}' lido -> transita para S5 (Exp Início)`);
                    } else {
                        registrarPasso('reconhecimento', ESTADO.NUMERO_INTEIRO, ESTADO.INICIO, null, `Número inteiro "${lexema}" reconhecido`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    }
                    break;

                case ESTADO.NUMERO_REAL:
                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                        registrarPasso('transicao', ESTADO.NUMERO_REAL, ESTADO.NUMERO_REAL, c, `Dígito fracionário '${c}' acumulado em "${lexema}"`);
                    } else if (c === 'e' || c === 'E') {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_INICIO;
                        registrarPasso('transicao', ESTADO.NUMERO_REAL, ESTADO.NUMERO_EXP_INICIO, c, `Expoente '${c}' lido -> transita para S5`);
                    } else {
                        registrarPasso('reconhecimento', ESTADO.NUMERO_REAL, ESTADO.INICIO, null, `Número real "${lexema}" reconhecido`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    }
                    break;

                case ESTADO.NUMERO_EXP_INICIO:
                    if (c === '+' || c === '-') {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_SINAL;
                        registrarPasso('transicao', ESTADO.NUMERO_EXP_INICIO, ESTADO.NUMERO_EXP_SINAL, c, `Sinal de expoente '${c}' lido -> transita para S6`);
                    } else if (this.isDigito(c)) {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_DIGITOS;
                        registrarPasso('transicao', ESTADO.NUMERO_EXP_INICIO, ESTADO.NUMERO_EXP_DIGITOS, c, `Dígito de expoente '${c}' lido -> transita para S7`);
                    } else {
                        registrarPasso('erro', ESTADO.NUMERO_EXP_INICIO, ESTADO.INICIO, c, `Formato de expoente inválido em "${lexema}"`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    }
                    break;

                case ESTADO.NUMERO_EXP_SINAL:
                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                        estado = ESTADO.NUMERO_EXP_DIGITOS;
                        registrarPasso('transicao', ESTADO.NUMERO_EXP_SINAL, ESTADO.NUMERO_EXP_DIGITOS, c, `Dígito de expoente '${c}' lido após sinal -> transita para S7`);
                    } else {
                        registrarPasso('erro', ESTADO.NUMERO_EXP_SINAL, ESTADO.INICIO, c, `Esperado dígito após sinal em "${lexema}"`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    }
                    break;

                case ESTADO.NUMERO_EXP_DIGITOS:
                    if (this.isDigito(c)) {
                        lexema += this.avancar();
                        registrarPasso('transicao', ESTADO.NUMERO_EXP_DIGITOS, ESTADO.NUMERO_EXP_DIGITOS, c, `Dígito '${c}' acumulado no expoente`);
                    } else {
                        registrarPasso('reconhecimento', ESTADO.NUMERO_EXP_DIGITOS, ESTADO.INICIO, null, `Número real exponencial "${lexema}" reconhecido`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    }
                    break;

                case ESTADO.DOIS_PONTOS:
                    if (c === '=') {
                        lexema += this.avancar();
                        registrarPasso('reconhecimento', ESTADO.DOIS_PONTOS, ESTADO.INICIO, c, `Operador de atribuição ':=' reconhecido`);
                    } else {
                        registrarPasso('reconhecimento', ESTADO.DOIS_PONTOS, ESTADO.INICIO, null, `Símbolo especial ':' reconhecido`);
                    }
                    lexema = "";
                    estado = ESTADO.INICIO;
                    break;

                case ESTADO.MENOR:
                    if (c === '=' || c === '>') {
                        lexema += this.avancar();
                        registrarPasso('reconhecimento', ESTADO.MENOR, ESTADO.INICIO, c, `Operador relacional '${lexema}' reconhecido`);
                    } else {
                        registrarPasso('reconhecimento', ESTADO.MENOR, ESTADO.INICIO, null, `Operador relacional '<' reconhecido`);
                    }
                    lexema = "";
                    estado = ESTADO.INICIO;
                    break;

                case ESTADO.MAIOR:
                    if (c === '=') {
                        lexema += this.avancar();
                        registrarPasso('reconhecimento', ESTADO.MAIOR, ESTADO.INICIO, c, `Operador relacional '>=' reconhecido`);
                    } else {
                        registrarPasso('reconhecimento', ESTADO.MAIOR, ESTADO.INICIO, null, `Operador relacional '>' reconhecido`);
                    }
                    lexema = "";
                    estado = ESTADO.INICIO;
                    break;

                case ESTADO.BARRA:
                    if (c === '*') {
                        this.avancar();
                        estado = ESTADO.COMENTARIO_BLOCO;
                        registrarPasso('transicao', ESTADO.BARRA, ESTADO.COMENTARIO_BLOCO, c, `Início de comentário '/*' -> transita para S12`);
                    } else {
                        registrarPasso('reconhecimento', ESTADO.BARRA, ESTADO.INICIO, null, `Operador aritmético '/' reconhecido`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    }
                    break;

                case ESTADO.COMENTARIO_BLOCO:
                    if (c === '*') {
                        this.avancar();
                        estado = ESTADO.COMENTARIO_FECHANDO;
                        registrarPasso('transicao', ESTADO.COMENTARIO_BLOCO, ESTADO.COMENTARIO_FECHANDO, c, `Asterisco '*' dentro de comentário -> transita para S13`);
                    } else {
                        this.avancar();
                        registrarPasso('descarte', ESTADO.COMENTARIO_BLOCO, ESTADO.COMENTARIO_BLOCO, c, `Caractere dentro do comentário descartado`);
                    }
                    break;

                case ESTADO.COMENTARIO_FECHANDO:
                    if (c === '/') {
                        this.avancar();
                        estado = ESTADO.INICIO;
                        registrarPasso('reconhecimento', ESTADO.COMENTARIO_FECHANDO, ESTADO.INICIO, c, `Fechamento de comentário '*/' -> retorna a S0`);
                        lexema = "";
                    } else if (c === '*') {
                        this.avancar();
                        registrarPasso('transicao', ESTADO.COMENTARIO_FECHANDO, ESTADO.COMENTARIO_FECHANDO, c, `Asterisco consecutivo`);
                    } else {
                        this.avancar();
                        estado = ESTADO.COMENTARIO_BLOCO;
                        registrarPasso('transicao', ESTADO.COMENTARIO_FECHANDO, ESTADO.COMENTARIO_BLOCO, c, `Retorna ao corpo do comentário em S12`);
                    }
                    break;

                case ESTADO.STRING:
                    if (c === '"') {
                        lexema += this.avancar();
                        registrarPasso('reconhecimento', ESTADO.STRING, ESTADO.INICIO, c, `Constante string "${lexema}" reconhecida`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    } else if (c === '\n' || c === null) {
                        registrarPasso('erro', ESTADO.STRING, ESTADO.INICIO, c, `String não fechada antes do fim da linha`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    } else {
                        lexema += this.avancar();
                        registrarPasso('transicao', ESTADO.STRING, ESTADO.STRING, c, `Caractere '${c}' acumulado na string`);
                    }
                    break;

                case ESTADO.CARACTERE:
                    if (c === "'") {
                        lexema += this.avancar();
                        registrarPasso('erro', ESTADO.CARACTERE, ESTADO.INICIO, c, `Constante caractere vazia '' não permitida`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    } else if (c === '\n' || c === null) {
                        registrarPasso('erro', ESTADO.CARACTERE, ESTADO.INICIO, c, `Constante caractere não fechada`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    } else {
                        lexema += this.avancar();
                        estado = ESTADO.CARACTERE_FECHA;
                        registrarPasso('transicao', ESTADO.CARACTERE, ESTADO.CARACTERE_FECHA, c, `Caractere '${c}' lido -> transita para S16`);
                    }
                    break;

                case ESTADO.CARACTERE_FECHA:
                    if (c === "'") {
                        lexema += this.avancar();
                        registrarPasso('reconhecimento', ESTADO.CARACTERE_FECHA, ESTADO.INICIO, c, `Constante caractere '${lexema}' reconhecida`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    } else {
                        while (this.posicao < this.tamanho && this.caractereAtual() !== "'" && this.caractereAtual() !== '\n') {
                            lexema += this.avancar();
                        }
                        if (this.caractereAtual() === "'") lexema += this.avancar();
                        registrarPasso('erro', ESTADO.CARACTERE_FECHA, ESTADO.INICIO, c, `Constante caractere inválida: '${lexema}'`);
                        lexema = "";
                        estado = ESTADO.INICIO;
                    }
                    break;
            }
        }

        // Se terminar e restou algo acumulado
        if (estado === ESTADO.IDENTIFICADOR && lexema) {
            registrarPasso('reconhecimento', ESTADO.IDENTIFICADOR, ESTADO.INICIO, null, `Identificador/Palavra "${lexema}" reconhecido(a) no final`);
        } else if (estado === ESTADO.NUMERO_INTEIRO && lexema) {
            registrarPasso('reconhecimento', ESTADO.NUMERO_INTEIRO, ESTADO.INICIO, null, `Número inteiro "${lexema}" reconhecido no final`);
        } else if (estado === ESTADO.NUMERO_REAL && lexema) {
            registrarPasso('reconhecimento', ESTADO.NUMERO_REAL, ESTADO.INICIO, null, `Número real "${lexema}" reconhecido no final`);
        }

        return passos;
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
