/**
 * ============================================================================
 * UNIVERSIDADE ESTADUAL DO SUDOESTE DA BAHIA - UESB
 * Departamento de Ciências Exatas - DCET
 * Disciplina: Compiladores
 * Trabalho Prático da II Unidade - Analisador Sintático SLR(1) (Linguagem Sigma)
 * ============================================================================
 *
 * Este arquivo implementa um Analisador Sintático Ascendente (Bottom-Up)
 * utilizando a técnica SLR(1) — Simple LR(1) — para a linguagem Sigma.
 *
 * Funcionalidades implementadas:
 *  1. Definição formal da Gramática Livre de Contexto (GLC) refatorada para
 *     eliminação de ambiguidades (precedência aritmética, dangling-else e
 *     expressões booleanas), tornando-a estritamente SLR(1) sem conflitos.
 *  2. Cálculo automático dos conjuntos FIRST e FOLLOW.
 *  3. Construção automática da Coleção Canônica de Conjuntos de Itens LR(0).
 *  4. Geração das tabelas ACTION e GOTO do autômato SLR(1).
 *  5. Motor de análise sintática com pilha de estados/símbolos, rastreamento
 *     passo a passo, geração da Tabela de Símbolos e mensagens de erro
 *     descritivas com tokens esperados.
 */

// Importação do TIPO_TOKEN quando executado em ambiente Node.js
let _TIPO_TOKEN = typeof TIPO_TOKEN !== "undefined" ? TIPO_TOKEN : null;
if (!_TIPO_TOKEN && typeof require === "function") {
    try {
        _TIPO_TOKEN = require("./lexer.js").TIPO_TOKEN;
    } catch (_) {
        // Ignorado se não estiver disponível
    }
}

// ----------------------------------------------------------------------------
// 1. DEFINIÇÃO DA GRAMÁTICA DA LINGUAGEM SIGMA (GLC ESTRITAMENTE SLR(1))
// ----------------------------------------------------------------------------
const SIMBOLO_INICIAL_AUMENTADO = "S'";
const SIMBOLO_INICIAL = "S";

const GRAMATICA_SIGMA = [
    // 0: Produção aumentada
    { id: 0, lhs: "S'", rhs: ["S"] },

    // Programa principal
    { id: 1, lhs: "S", rhs: ["program", "id", ";", "D", "begin", "L", "end", "."] },
    { id: 2, lhs: "S", rhs: ["program", "id", ";", "begin", "L", "end", "."] },

    // Declarações de variáveis
    { id: 3, lhs: "D", rhs: ["var", "V"] },
    { id: 4, lhs: "V", rhs: ["I", ":", "T", ";", "V"] },
    { id: 5, lhs: "V", rhs: ["I", ":", "T", ";"] },
    { id: 6, lhs: "T", rhs: ["integer"] },
    { id: 7, lhs: "T", rhs: ["boolean"] },
    { id: 8, lhs: "I", rhs: ["id"] },
    { id: 9, lhs: "I", rhs: ["id", ",", "I"] },

    // Lista de comandos
    { id: 10, lhs: "L", rhs: ["C", ";"] },
    { id: 11, lhs: "L", rhs: ["C", ";", "L"] },

    // Comandos (separação C_fechado / C_aberto para resolver dangling-else sem conflito)
    { id: 12, lhs: "C", rhs: ["C_fechado"] },
    { id: 13, lhs: "C", rhs: ["C_aberto"] },

    { id: 14, lhs: "C_fechado", rhs: ["A"] },
    { id: 15, lhs: "C_fechado", rhs: ["R"] },
    { id: 16, lhs: "C_fechado", rhs: ["W"] },
    { id: 17, lhs: "C_fechado", rhs: ["M"] },
    { id: 18, lhs: "C_fechado", rhs: ["if", "B", "then", "C_fechado", "else", "C_fechado"] },
    { id: 19, lhs: "C_fechado", rhs: ["while", "B", "do", "C_fechado"] },

    { id: 20, lhs: "C_aberto", rhs: ["if", "B", "then", "C"] },
    { id: 21, lhs: "C_aberto", rhs: ["if", "B", "then", "C_fechado", "else", "C_aberto"] },
    { id: 22, lhs: "C_aberto", rhs: ["while", "B", "do", "C_aberto"] },

    // Atribuição
    { id: 23, lhs: "A", rhs: ["id", ":=", "E"] },

    // Leitura
    { id: 24, lhs: "R", rhs: ["read", "(", "I", ")"] },
    { id: 25, lhs: "R", rhs: ["readln"] },
    { id: 26, lhs: "R", rhs: ["readln", "(", "I", ")"] },

    // Escrita
    { id: 27, lhs: "W", rhs: ["write", "(", "F", ")"] },
    { id: 28, lhs: "W", rhs: ["writeln"] },
    { id: 29, lhs: "W", rhs: ["writeln", "(", "F", ")"] },
    { id: 30, lhs: "F", rhs: ["G"] },
    { id: 31, lhs: "F", rhs: ["G", ",", "F"] },
    { id: 32, lhs: "G", rhs: ["str"] },
    { id: 33, lhs: "G", rhs: ["E"] },

    // Comando composto
    { id: 34, lhs: "M", rhs: ["begin", "L", "end"] },

    // Expressões booleanas (B -> E permite id simples e (B) sem conflito Reduce/Reduce)
    { id: 35, lhs: "B", rhs: ["E", "<", "E"] },
    { id: 36, lhs: "B", rhs: ["E", "<=", "E"] },
    { id: 37, lhs: "B", rhs: ["E", ">", "E"] },
    { id: 38, lhs: "B", rhs: ["E", ">=", "E"] },
    { id: 39, lhs: "B", rhs: ["E", "=", "E"] },
    { id: 40, lhs: "B", rhs: ["E", "<>", "E"] },
    { id: 41, lhs: "B", rhs: ["E"] },

    // Expressões aritméticas com precedência e associatividade à esquerda
    { id: 42, lhs: "E", rhs: ["E", "+", "Term"] },
    { id: 43, lhs: "E", rhs: ["E", "-", "Term"] },
    { id: 44, lhs: "E", rhs: ["Term"] },

    { id: 45, lhs: "Term", rhs: ["Term", "*", "Fat"] },
    { id: 46, lhs: "Term", rhs: ["Term", "/", "Fat"] },
    { id: 47, lhs: "Term", rhs: ["Fat"] },

    { id: 48, lhs: "Fat", rhs: ["-", "Fat"] },
    { id: 49, lhs: "Fat", rhs: ["(", "B", ")"] },
    { id: 50, lhs: "Fat", rhs: ["id"] },
    { id: 51, lhs: "Fat", rhs: ["num"] }
];

// Conjunto de símbolos não-terminais extraídos automaticamente das produções
const NAO_TERMINAIS = new Set(GRAMATICA_SIGMA.map(p => p.lhs));

// Conjunto de símbolos terminais extraídos automaticamente
const TERMINAIS = new Set();
for (const prod of GRAMATICA_SIGMA) {
    for (const simb of prod.rhs) {
        if (!NAO_TERMINAIS.has(simb)) {
            TERMINAIS.add(simb);
        }
    }
}
TERMINAIS.add("$");

// ----------------------------------------------------------------------------
// 2. CONSTRUÇÃO AUTOMÁTICA DAS TABELAS SLR(1) (FIRST, FOLLOW, LR(0), ACTION/GOTO)
// ----------------------------------------------------------------------------

/**
 * Calcula os conjuntos FIRST para todos os símbolos da gramática.
 * (Nota: a gramática refatorada não possui produções vazias / epsilon).
 */
function calcularFirst() {
    const first = {};
    for (const t of TERMINAIS) {
        first[t] = new Set([t]);
    }
    for (const nt of NAO_TERMINAIS) {
        first[nt] = new Set();
    }

    let mudou = true;
    while (mudou) {
        mudou = false;
        for (const prod of GRAMATICA_SIGMA) {
            const primeiroRhs = prod.rhs[0];
            for (const terminal of first[primeiroRhs]) {
                if (!first[prod.lhs].has(terminal)) {
                    first[prod.lhs].add(terminal);
                    mudou = true;
                }
            }
        }
    }
    return first;
}

/**
 * Calcula os conjuntos FOLLOW para todos os não-terminais da gramática.
 */
function calcularFollow(first) {
    const follow = {};
    for (const nt of NAO_TERMINAIS) {
        follow[nt] = new Set();
    }
    follow[SIMBOLO_INICIAL_AUMENTADO].add("$");
    follow[SIMBOLO_INICIAL].add("$");

    let mudou = true;
    while (mudou) {
        mudou = false;
        for (const prod of GRAMATICA_SIGMA) {
            const rhs = prod.rhs;
            for (let i = 0; i < rhs.length; i++) {
                const simbolo = rhs[i];
                if (!NAO_TERMINAIS.has(simbolo)) continue;

                if (i + 1 < rhs.length) {
                    const proximo = rhs[i + 1];
                    for (const t of first[proximo]) {
                        if (!follow[simbolo].has(t)) {
                            follow[simbolo].add(t);
                            mudou = true;
                        }
                    }
                } else {
                    for (const t of follow[prod.lhs]) {
                        if (!follow[simbolo].has(t)) {
                            follow[simbolo].add(t);
                            mudou = true;
                        }
                    }
                }
            }
        }
    }
    return follow;
}

/**
 * Gera chave única para um item LR(0) { prodId, ponto }.
 */
function chaveItem(prodId, ponto) {
    return `${prodId}:${ponto}`;
}

/**
 * Gera chave única para um conjunto de itens LR(0) ordenado.
 */
function chaveEstado(itens) {
    return itens
        .map(it => chaveItem(it.prodId, it.ponto))
        .sort()
        .join("|");
}

/**
 * Calcula o fecho (CLOSURE) de um conjunto de itens LR(0).
 */
function closure(itensIniciais) {
    const conjunto = [...itensIniciais];
    const visitados = new Set(itensIniciais.map(it => chaveItem(it.prodId, it.ponto)));

    let i = 0;
    while (i < conjunto.length) {
        const item = conjunto[i++];
        const prod = GRAMATICA_SIGMA[item.prodId];
        if (item.ponto < prod.rhs.length) {
            const simboloAposPonto = prod.rhs[item.ponto];
            if (NAO_TERMINAIS.has(simboloAposPonto)) {
                for (const p of GRAMATICA_SIGMA) {
                    if (p.lhs === simboloAposPonto) {
                        const k = chaveItem(p.id, 0);
                        if (!visitados.has(k)) {
                            visitados.add(k);
                            conjunto.push({ prodId: p.id, ponto: 0 });
                        }
                    }
                }
            }
        }
    }
    return conjunto;
}

/**
 * Calcula a função de transição GOTO(I, X) para itens LR(0).
 */
function gotoItens(itens, simbolo) {
    const movidos = [];
    for (const item of itens) {
        const prod = GRAMATICA_SIGMA[item.prodId];
        if (item.ponto < prod.rhs.length && prod.rhs[item.ponto] === simbolo) {
            movidos.push({ prodId: item.prodId, ponto: item.ponto + 1 });
        }
    }
    return movidos.length > 0 ? closure(movidos) : [];
}

/**
 * Constrói a coleção canônica de estados LR(0) e as tabelas SLR(1) (ACTION e GOTO).
 */
function construirTabelaSLR1() {
    const first = calcularFirst();
    const follow = calcularFollow(first);

    const estadoInicial = closure([{ prodId: 0, ponto: 0 }]);
    const estados = [estadoInicial];
    const mapaEstados = new Map([[chaveEstado(estadoInicial), 0]]);
    const transicoes = []; // { origem, simbolo, destino }

    const todosSimbolos = [...NAO_TERMINAIS, ...TERMINAIS].filter(s => s !== "$" && s !== SIMBOLO_INICIAL_AUMENTADO);

    let idx = 0;
    while (idx < estados.length) {
        const itensAtuais = estados[idx];
        for (const simbolo of todosSimbolos) {
            const proximoConjunto = gotoItens(itensAtuais, simbolo);
            if (proximoConjunto.length === 0) continue;

            const key = chaveEstado(proximoConjunto);
            let destino = mapaEstados.get(key);
            if (destino === undefined) {
                destino = estados.length;
                estados.push(proximoConjunto);
                mapaEstados.set(key, destino);
            }
            transicoes.push({ origem: idx, simbolo, destino });
        }
        idx++;
    }

    // Inicializar tabelas ACTION e GOTO
    const action = Array.from({ length: estados.length }, () => ({}));
    const gotoTable = Array.from({ length: estados.length }, () => ({}));
    const conflitos = [];

    // 1. Preencher SHIFT e GOTO a partir das transições
    for (const { origem, simbolo, destino } of transicoes) {
        if (TERMINAIS.has(simbolo)) {
            action[origem][simbolo] = { tipo: "shift", estado: destino };
        } else {
            gotoTable[origem][simbolo] = destino;
        }
    }

    // 2. Preencher REDUCE e ACCEPT
    for (let s = 0; s < estados.length; s++) {
        for (const item of estados[s]) {
            const prod = GRAMATICA_SIGMA[item.prodId];
            if (item.ponto === prod.rhs.length) {
                if (prod.id === 0) {
                    // S' -> S •
                    action[s]["$"] = { tipo: "accept" };
                } else {
                    // A -> α • : reduzir para cada terminal em FOLLOW(A)
                    for (const term of follow[prod.lhs]) {
                        const existente = action[s][term];
                        const novaAcao = { tipo: "reduce", prodId: prod.id };
                        if (existente) {
                            conflitos.push({
                                estado: s,
                                terminal: term,
                                existente,
                                nova: novaAcao
                            });
                        } else {
                            action[s][term] = novaAcao;
                        }
                    }
                }
            }
        }
    }

    return {
        first,
        follow,
        estados,
        action,
        gotoTable,
        conflitos
    };
}

// Tabela SLR(1) pré-computada uma única vez no carregamento do módulo
const TABELA_SLR1 = construirTabelaSLR1();

// ----------------------------------------------------------------------------
// 3. ADAPTADOR DE TOKENS (LÉXICO -> TERMINAIS DA GRAMÁTICA SIGMA)
// ----------------------------------------------------------------------------

/**
 * Converte um token produzido pelo AnalisadorLexico no símbolo terminal
 * correspondente da gramática Sigma.
 */
function tokenParaTerminal(tokenObj) {
    if (!tokenObj) return "$";

    const tt = _TIPO_TOKEN || (typeof window !== "undefined" ? window.TIPO_TOKEN : null);

    if (tt) {
        if (tokenObj.token === tt.IDENTIFICADOR) return "id";
        if (tokenObj.token === tt.NUMERO_INTEIRO || tokenObj.token === tt.NUMERO_REAL) return "num";
        if (tokenObj.token === tt.CONSTANTE_STRING) return "str";
        if (tokenObj.token === tt.PALAVRA_RESERVADA) return tokenObj.lexema.toLowerCase();
        if (tokenObj.token === tt.ATRIBUICAO) return ":=";
        if (tokenObj.token === tt.FIM) return ".";
        if (
            tokenObj.token === tt.OPERADOR_ARITMETICO ||
            tokenObj.token === tt.OPERADOR_RELACIONAL ||
            tokenObj.token === tt.SIMBOLO_ESPECIAL
        ) {
            return tokenObj.lexema;
        }
    }

    return tokenObj.lexema.toLowerCase();
}

// ----------------------------------------------------------------------------
// 4. CLASSE PRINCIPAL: ANALISADOR SINTÁTICO SLR(1)
// ----------------------------------------------------------------------------
class AnalisadorSintatico {
    constructor() {
        this.tabela = TABELA_SLR1;
    }

    /**
     * Executa a análise sintática SLR(1) sobre uma lista de tokens válidos.
     * Também constrói a Tabela de Símbolos (programa e variáveis declaradas)
     * e registra o rastreamento completo da pilha.
     *
     * @param {Array<Object>} tokens Lista de tokens do AnalisadorLexico
     * @returns {Object} Resultado completo da análise sintática
     */
    analisar(tokens) {
        const tt = _TIPO_TOKEN || (typeof window !== "undefined" ? window.TIPO_TOKEN : null);

        // Filtrar eventuais tokens de erro léxico antes de montar o fluxo de entrada
        const tokensValidos = (tokens || []).filter(t => !tt || t.token !== tt.ERRO);
        const fluxo = [
            ...tokensValidos.map(t => ({
                terminal: tokenParaTerminal(t),
                lexema: t.lexema,
                linha: t.linha,
                coluna: t.coluna,
                tokenOriginal: t
            })),
            { terminal: "$", lexema: "$", linha: null, coluna: null, tokenOriginal: null }
        ];

        const pilhaEstados = [0];
        const pilhaSimbolos = ["$"];
        const pilhaAtributos = [null]; // Para construção da Tabela de Símbolos

        const rastreamento = [];
        const tabelaSimbolos = [];
        const nomesDeclarados = new Set();
        const errosSintaticos = [];
        const avisosSemanticos = [];

        // Verifica se o próprio fluxo já contém tokens desconhecidos pela gramática
        let cursor = 0;
        let passo = 1;
        let aceito = false;

        while (cursor < fluxo.length) {
            const estadoAtual = pilhaEstados[pilhaEstados.length - 1];
            const entradaAtual = fluxo[cursor];
            const terminalAtual = entradaAtual.terminal;
            const acao = this.tabela.action[estadoAtual][terminalAtual];

            // Formatar estado atual da pilha e entrada para rastreamento
            const pilhaStr = pilhaEstados.join(" ");
            const simbolosStr = pilhaSimbolos.join(" ");
            const entradaRestanteStr = fluxo
                .slice(cursor, Math.min(cursor + 6, fluxo.length))
                .map(x => x.lexema)
                .join(" ") + (cursor + 6 < fluxo.length ? " ..." : "");

            if (!acao) {
                // Erro sintático: montar lista de tokens esperados neste estado
                const esperados = Object.keys(this.tabela.action[estadoAtual]);
                const ultimaLinha =
                    entradaAtual.linha !== null
                        ? entradaAtual.linha
                        : (tokensValidos.length > 0 ? tokensValidos[tokensValidos.length - 1].linha : 1);
                const ultimaColuna =
                    entradaAtual.coluna !== null
                        ? entradaAtual.coluna
                        : (tokensValidos.length > 0 ? tokensValidos[tokensValidos.length - 1].coluna : 1);

                const encontradoDesc =
                    terminalAtual === "$"
                        ? "fim de arquivo (EOF)"
                        : `'${entradaAtual.lexema}' (${terminalAtual})`;

                const msg = `Erro sintático próximo a ${encontradoDesc}. Esperado: ${esperados.map(e => `'${e}'`).join(", ")}.`;

                errosSintaticos.push({
                    linha: ultimaLinha,
                    coluna: ultimaColuna,
                    lexema: entradaAtual.lexema,
                    terminal: terminalAtual,
                    esperados,
                    mensagem: msg
                });

                rastreamento.push({
                    passo: passo++,
                    pilhaEstados: pilhaStr,
                    pilhaSimbolos: simbolosStr,
                    entrada: entradaRestanteStr,
                    acao: `ERRO: esperado [${esperados.join(", ")}]`
                });
                break;
            }

            if (acao.tipo === "shift") {
                rastreamento.push({
                    passo: passo++,
                    pilhaEstados: pilhaStr,
                    pilhaSimbolos: simbolosStr,
                    entrada: entradaRestanteStr,
                    acao: `Empilhar (Shift) → s${acao.estado}`
                });

                pilhaEstados.push(acao.estado);
                pilhaSimbolos.push(terminalAtual);
                pilhaAtributos.push(entradaAtual);
                cursor++;
            } else if (acao.tipo === "reduce") {
                const prod = GRAMATICA_SIGMA[acao.prodId];
                const qtd = prod.rhs.length;

                rastreamento.push({
                    passo: passo++,
                    pilhaEstados: pilhaStr,
                    pilhaSimbolos: simbolosStr,
                    entrada: entradaRestanteStr,
                    acao: `Reduzir (Reduce) [${prod.id}] ${prod.lhs} → ${prod.rhs.join(" ")}`
                });

                // Desempilhar os atributos dos símbolos do lado direito
                const args = [];
                for (let k = 0; k < qtd; k++) {
                    pilhaEstados.pop();
                    pilhaSimbolos.pop();
                    args.unshift(pilhaAtributos.pop());
                }

                // Ações semânticas leves para preencher a Tabela de Símbolos
                let atributoResultante = null;

                if (prod.id === 1 || prod.id === 2) {
                    // S -> program id ; ...
                    const progToken = args[1];
                    tabelaSimbolos.unshift({
                        nome: progToken.lexema,
                        categoria: "Programa",
                        tipo: "-",
                        linha: progToken.linha,
                        coluna: progToken.coluna
                    });
                } else if (prod.id === 6 || prod.id === 7) {
                    // T -> integer | boolean
                    atributoResultante = args[0].lexema.toLowerCase();
                } else if (prod.id === 8) {
                    // I -> id
                    atributoResultante = [args[0]];
                } else if (prod.id === 9) {
                    // I -> id , I
                    atributoResultante = [args[0], ...(args[2] || [])];
                } else if (prod.id === 4 || prod.id === 5) {
                    // V -> I : T ; ...
                    const listaIds = args[0] || [];
                    const tipoVar = args[2];
                    for (const idItem of listaIds) {
                        const chave = idItem.lexema.toLowerCase();
                        if (nomesDeclarados.has(chave)) {
                            avisosSemanticos.push({
                                linha: idItem.linha,
                                coluna: idItem.coluna,
                                mensagem: `Variável '${idItem.lexema}' redeclarada.`
                            });
                        } else {
                            nomesDeclarados.add(chave);
                            tabelaSimbolos.push({
                                nome: idItem.lexema,
                                categoria: "Variável",
                                tipo: tipoVar,
                                linha: idItem.linha,
                                coluna: idItem.coluna
                            });
                        }
                    }
                } else if (prod.id === 23) {
                    // A -> id := E
                    const idToken = args[0];
                    if (!nomesDeclarados.has(idToken.lexema.toLowerCase())) {
                        avisosSemanticos.push({
                            linha: idToken.linha,
                            coluna: idToken.coluna,
                            mensagem: `Variável '${idToken.lexema}' utilizada em atribuição sem declaração prévia.`
                        });
                    }
                }

                const estadoTopo = pilhaEstados[pilhaEstados.length - 1];
                const proximoEstado = this.tabela.gotoTable[estadoTopo][prod.lhs];

                if (proximoEstado === undefined) {
                    errosSintaticos.push({
                        linha: entradaAtual.linha || 1,
                        coluna: entradaAtual.coluna || 1,
                        lexema: entradaAtual.lexema,
                        terminal: terminalAtual,
                        esperados: [],
                        mensagem: `Erro interno na tabela GOTO para o não-terminal '${prod.lhs}' no estado ${estadoTopo}.`
                    });
                    break;
                }

                pilhaEstados.push(proximoEstado);
                pilhaSimbolos.push(prod.lhs);
                pilhaAtributos.push(atributoResultante);
            } else if (acao.tipo === "accept") {
                rastreamento.push({
                    passo: passo++,
                    pilhaEstados: pilhaStr,
                    pilhaSimbolos: simbolosStr,
                    entrada: entradaRestanteStr,
                    acao: "ACEITO (Accept)"
                });
                aceito = true;
                break;
            }
        }

        // Ordenar tabela de símbolos pela posição no código-fonte (mantendo Programa no topo)
        tabelaSimbolos.sort((a, b) => {
            if (a.categoria === "Programa") return -1;
            if (b.categoria === "Programa") return 1;
            return a.linha !== b.linha ? a.linha - b.linha : a.coluna - b.coluna;
        });

        return {
            aceito,
            errosSintaticos,
            avisosSemanticos,
            tabelaSimbolos,
            rastreamento,
            estatisticas: {
                estadosLR0: this.tabela.estados.length,
                producoes: GRAMATICA_SIGMA.length,
                conflitosSLR1: this.tabela.conflitos.length,
                passosAnalise: rastreamento.length
            }
        };
    }
}

// Exportação compatível tanto para navegador quanto para Node.js
if (typeof window !== "undefined") {
    window.AnalisadorSintatico = AnalisadorSintatico;
    window.GRAMATICA_SIGMA = GRAMATICA_SIGMA;
    window.TABELA_SLR1 = TABELA_SLR1;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        AnalisadorSintatico,
        GRAMATICA_SIGMA,
        TABELA_SLR1,
        tokenParaTerminal
    };
}
