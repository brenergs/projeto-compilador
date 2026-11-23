/**
 * ============================================================================
 * UNIVERSIDADE ESTADUAL DO SUDOESTE DA BAHIA - UESB
 * Aplicação Web do Analisador Léxico (AFD) e Sintático SLR(1) - Linguagem Sigma
 * Controlador da Interface (Vanilla JavaScript)
 * ============================================================================
 */

// Exemplos pré-carregados na linguagem Sigma para facilitar o teste imediato
const EXEMPLOS = {
    teste1: `program teste;
var x, y: integer;
    ativo: boolean;
/* inicio do programa Sigma */
begin
    read(x);
    y := -x + 10 * 2;
    if (x > y) then
        y := x
    else
        y := -x;
    writeln("Resultado y = ", y);
    write(x);
end.`,

    teste2: `program LacowhileComposto;
var i, limite, soma: integer;
/* Teste de laço while e comandos compostos */
begin
    i := 1;
    soma := 0;
    write("Informe o limite: ");
    readln(limite);
    while i <= limite do
    begin
        soma := soma + i;
        i := i + 1;
    end;
    writeln("Soma acumulada = ", soma);
end.`,

    teste3: `program SemDeclaracoes;
/* Programa válido sem bloco var (segunda produção de S) */
begin
    writeln("Executando sem variaveis declaradas");
    readln;
    writeln((10 + 20) * -2 / 5);
end.`,

    teste4: `program DanglingElseERelacionais;
var a, b: integer;
    flag: boolean;
begin
    read(a, b);
    if a < b then
        if a <= 0 then
            writeln("a menor que b e nao positivo")
        else
            writeln("a menor que b e positivo");
    if a <> b then
        write("Diferentes");
    if flag then
        writeln("Flag booleana ativa");
end.`,

    teste5: `program TesteErrosSintaticos;
var x, y: integer;
begin
    x := 10 + ;
    if x > 5
        writeln(x);
end`,

    teste6: `program TesteErrosLexicos;
var salario: integer;
begin
    /* Testando caracteres desconhecidos e string não fechada */
    salario := 1500;
    Mari& := 10;
    writeln("String nao fechada nesta linha;
    valor@ := #50;
end.`
};

document.addEventListener("DOMContentLoaded", () => {
    // Elementos da interface
    const editor = document.getElementById("editor-codigo");
    const numerosLinha = document.getElementById("numeros-linha");
    const btnAnalisar = document.getElementById("btn-analisar");
    const btnLimpar = document.getElementById("btn-limpar");
    const inputArquivo = document.getElementById("input-arquivo");
    const btnUpload = document.getElementById("btn-upload");
    const btnBaixarTxt = document.getElementById("btn-baixar-txt");
    const selectExemplo = document.getElementById("select-exemplo");

    // Elementos de contadores
    const contadorTokens = document.getElementById("stat-tokens");
    const contadorErros = document.getElementById("stat-erros");
    const contadorSintatico = document.getElementById("stat-sintatico");
    const cardStatSintatico = document.getElementById("card-stat-sintatico");
    const contadorSimbolos = document.getElementById("stat-simbolos");
    const contadorLinhas = document.getElementById("stat-linhas");
    const contadorTempo = document.getElementById("stat-tempo");

    // Elementos de visualização de saída
    const corpoTabela = document.getElementById("corpo-tabela-tokens");
    const corpoTabelaRastreamento = document.getElementById("corpo-tabela-rastreamento");
    const corpoTabelaSimbolos = document.getElementById("corpo-tabela-simbolos");
    const bannerSintatico = document.getElementById("banner-sintatico");
    const listaAvisosSemanticos = document.getElementById("lista-avisos-semanticos");
    const areaTextoSaida = document.getElementById("saida-texto-formatado");

    // Painéis de erro
    const secaoErros = document.getElementById("secao-erros");
    const listaErros = document.getElementById("lista-erros");
    const secaoErrosSintaticos = document.getElementById("secao-erros-sintaticos");
    const listaErrosSintaticos = document.getElementById("lista-erros-sintaticos");

    // Abas
    const abas = [
        { btn: document.getElementById("tab-rastreamento"), view: document.getElementById("view-rastreamento") },
        { btn: document.getElementById("tab-simbolos"), view: document.getElementById("view-simbolos") },
        { btn: document.getElementById("tab-tabela"), view: document.getElementById("view-tabela") },
        { btn: document.getElementById("tab-texto"), view: document.getElementById("view-texto") }
    ];

    let tokensAtuais = [];
    let errosAtuais = [];

    // Instância única do analisador sintático SLR(1)
    const parser = new AnalisadorSintatico();

    // ------------------------------------------------------------------------
    // Sincronização de numeração de linha do editor
    // ------------------------------------------------------------------------
    function atualizarNumerosLinha() {
        const linhas = editor.value.split("\n").length;
        let htmlLinhas = "";
        for (let i = 1; i <= linhas; i++) {
            htmlLinhas += `<span>${i}</span>`;
        }
        numerosLinha.innerHTML = htmlLinhas;
        contadorLinhas.textContent = linhas;
    }

    editor.addEventListener("input", atualizarNumerosLinha);
    editor.addEventListener("scroll", () => {
        numerosLinha.scrollTop = editor.scrollTop;
    });

    // ------------------------------------------------------------------------
    // Alternância entre abas de resultado
    // ------------------------------------------------------------------------
    abas.forEach((abaSelecionada) => {
        abaSelecionada.btn.addEventListener("click", () => {
            abas.forEach((a) => {
                const ativa = a === abaSelecionada;
                a.btn.classList.toggle("active", ativa);
                a.view.classList.toggle("oculto", !ativa);
            });
        });
    });

    // ------------------------------------------------------------------------
    // Carregamento de Exemplos
    // ------------------------------------------------------------------------
    selectExemplo.addEventListener("change", (e) => {
        const chave = e.target.value;
        if (chave && EXEMPLOS[chave]) {
            editor.value = EXEMPLOS[chave];
            atualizarNumerosLinha();
            executarAnalise();
        }
    });

    // ------------------------------------------------------------------------
    // Upload de Arquivo .txt / .pas
    // ------------------------------------------------------------------------
    btnUpload.addEventListener("click", () => inputArquivo.click());

    inputArquivo.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            editor.value = event.target.result;
            atualizarNumerosLinha();
            executarAnalise();
            inputArquivo.value = "";
        };
        reader.readAsText(file);
    });

    // ------------------------------------------------------------------------
    // Botão Limpar
    // ------------------------------------------------------------------------
    btnLimpar.addEventListener("click", () => {
        editor.value = "";
        tokensAtuais = [];
        errosAtuais = [];
        atualizarNumerosLinha();
        renderizarResultados([], [], null);
        contadorTokens.textContent = "0";
        contadorErros.textContent = "0";
        contadorSintatico.textContent = "-";
        cardStatSintatico.classList.remove("stat-ok", "stat-erro-sintatico");
        contadorSimbolos.textContent = "0";
        contadorTempo.textContent = "0ms";
    });

    // ------------------------------------------------------------------------
    // Execução da Análise Léxica + Sintática SLR(1)
    // ------------------------------------------------------------------------
    function executarAnalise() {
        const codigo = editor.value;
        if (!codigo.trim()) {
            renderizarResultados([], [], null);
            contadorTokens.textContent = "0";
            contadorErros.textContent = "0";
            contadorSintatico.textContent = "-";
            cardStatSintatico.classList.remove("stat-ok", "stat-erro-sintatico");
            contadorSimbolos.textContent = "0";
            contadorTempo.textContent = "0ms";
            return;
        }

        const tInicio = performance.now();
        const lexer = new AnalisadorLexico(codigo);
        const resultadoLexico = lexer.executar();
        const resultadoSintatico = parser.analisar(resultadoLexico.tokens);
        const tFim = performance.now();

        tokensAtuais = resultadoLexico.tokens;
        errosAtuais = resultadoLexico.erros;

        const duracao = (tFim - tInicio).toFixed(1);
        contadorTempo.textContent = `${duracao}ms`;
        contadorTokens.textContent = tokensAtuais.filter(t => t.token !== TIPO_TOKEN.ERRO).length;
        contadorErros.textContent = errosAtuais.length;
        contadorSimbolos.textContent = resultadoSintatico.tabelaSimbolos.length;

        const valido = resultadoSintatico.aceito && errosAtuais.length === 0;
        contadorSintatico.textContent = valido ? "ACEITO" : "ERRO";
        cardStatSintatico.classList.toggle("stat-ok", valido);
        cardStatSintatico.classList.toggle("stat-erro-sintatico", !valido);

        renderizarResultados(tokensAtuais, errosAtuais, resultadoSintatico);
    }

    btnAnalisar.addEventListener("click", executarAnalise);

    // ------------------------------------------------------------------------
    // Renderização dos Resultados na Interface
    // ------------------------------------------------------------------------
    function renderizarResultados(tokens, erros, sintatico) {
        // 1. Tabela de Tokens
        corpoTabela.innerHTML = "";
        if (tokens.length === 0) {
            corpoTabela.innerHTML = `<tr><td colspan="5" class="tabela-vazia">Nenhum token para exibir. Digite ou carregue um código-fonte e clique em Analisar.</td></tr>`;
        } else {
            tokens.forEach((t, index) => {
                const tr = document.createElement("tr");
                if (t.token === TIPO_TOKEN.ERRO) {
                    tr.classList.add("linha-erro");
                }
                const badgeClass = obterClasseBadge(t.token);
                tr.innerHTML = `
                    <td class="col-num">${index + 1}</td>
                    <td class="col-lexema"><code>${escaparHtml(t.lexema)}</code></td>
                    <td><span class="badge ${badgeClass}">${t.token}</span></td>
                    <td class="col-pos">${t.linha}</td>
                    <td class="col-pos">${t.coluna}</td>
                `;
                corpoTabela.appendChild(tr);
            });
        }

        // 2. Formato em Texto <cadeia, token>
        let textoSaida = "";
        tokens.forEach(t => {
            if (t.token !== TIPO_TOKEN.ERRO) {
                textoSaida += `${t.lexema} ${t.token}\n`;
            } else {
                textoSaida += `/* ERRO LÉXICO: ${t.lexema} (Linha ${t.linha}, Coluna ${t.coluna}): ${t.mensagem} */\n`;
            }
        });
        areaTextoSaida.value = textoSaida;

        // 3. Painel de Erros Léxicos
        if (erros.length > 0) {
            secaoErros.classList.remove("oculto");
            listaErros.innerHTML = erros.map(e => `
                <div class="item-erro">
                    <div class="erro-icone">⚠️</div>
                    <div class="erro-detalhe">
                        <strong>Linha ${e.linha}, Coluna ${e.coluna}:</strong> ${escaparHtml(e.mensagem)}
                        <span class="erro-lexema">Lexema inválido: <code>${escaparHtml(e.lexema)}</code></span>
                    </div>
                </div>
            `).join("");
        } else {
            secaoErros.classList.add("oculto");
            listaErros.innerHTML = "";
        }

        // 4. Rastreamento SLR(1), Tabela de Símbolos e Erros Sintáticos
        if (!sintatico) {
            bannerSintatico.classList.add("oculto");
            corpoTabelaRastreamento.innerHTML = `<tr><td colspan="5" class="tabela-vazia">Execute a análise para visualizar o rastreamento SLR(1).</td></tr>`;
            corpoTabelaSimbolos.innerHTML = `<tr><td colspan="6" class="tabela-vazia">Nenhum símbolo declarado ainda.</td></tr>`;
            listaAvisosSemanticos.classList.add("oculto");
            secaoErrosSintaticos.classList.add("oculto");
            return;
        }

        // Banner de status sintático
        bannerSintatico.classList.remove("oculto", "banner-aceito", "banner-erro");
        if (sintatico.aceito && erros.length === 0) {
            bannerSintatico.classList.add("banner-aceito");
            bannerSintatico.innerHTML = `
                <span>✅ Programa sintaticamente VÁLIDO na linguagem Sigma (SLR(1))</span>
                <span>${sintatico.estatisticas.passosAnalise} passos &bull; ${sintatico.estatisticas.estadosLR0} estados LR(0) &bull; ${sintatico.estatisticas.conflitosSLR1} conflitos</span>
            `;
        } else if (sintatico.aceito && erros.length > 0) {
            bannerSintatico.classList.add("banner-erro");
            bannerSintatico.innerHTML = `
                <span>⚠️ Atenção: análise sintática prosseguiu ignorando erros léxicos; corrija os erros léxicos abaixo.</span>
                <span>${sintatico.estatisticas.passosAnalise} passos</span>
            `;
        } else {
            bannerSintatico.classList.add("banner-erro");
            bannerSintatico.innerHTML = `
                <span>🛑 Programa com ERRO SINTÁTICO (rejeitado pelo autômato SLR(1))</span>
                <span>${sintatico.estatisticas.passosAnalise} passos</span>
            `;
        }

        // Tabela de Rastreamento SLR(1)
        corpoTabelaRastreamento.innerHTML = "";
        sintatico.rastreamento.forEach((r) => {
            const tr = document.createElement("tr");
            if (r.acao.startsWith("ERRO")) {
                tr.classList.add("linha-erro");
            }
            tr.innerHTML = `
                <td class="col-num">${r.passo}</td>
                <td title="${escaparHtml(r.pilhaEstados)}">${escaparHtml(r.pilhaEstados)}</td>
                <td title="${escaparHtml(r.pilhaSimbolos)}">${escaparHtml(r.pilhaSimbolos)}</td>
                <td title="${escaparHtml(r.entrada)}">${escaparHtml(r.entrada)}</td>
                <td title="${escaparHtml(r.acao)}">${escaparHtml(r.acao)}</td>
            `;
            corpoTabelaRastreamento.appendChild(tr);
        });

        // Tabela de Símbolos
        corpoTabelaSimbolos.innerHTML = "";
        if (sintatico.tabelaSimbolos.length === 0) {
            corpoTabelaSimbolos.innerHTML = `<tr><td colspan="6" class="tabela-vazia">Nenhum símbolo declarado neste programa.</td></tr>`;
        } else {
            sintatico.tabelaSimbolos.forEach((s, idx) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="col-num">${idx + 1}</td>
                    <td class="col-lexema"><code>${escaparHtml(s.nome)}</code></td>
                    <td><span class="badge badge-palavra">${escaparHtml(s.categoria)}</span></td>
                    <td><code>${escaparHtml(s.tipo)}</code></td>
                    <td class="col-pos">${s.linha}</td>
                    <td class="col-pos">${s.coluna}</td>
                `;
                corpoTabelaSimbolos.appendChild(tr);
            });
        }

        // Avisos Semânticos
        if (sintatico.avisosSemanticos.length > 0) {
            listaAvisosSemanticos.classList.remove("oculto");
            listaAvisosSemanticos.innerHTML = sintatico.avisosSemanticos.map(a => `
                <div class="item-aviso">
                    <strong>Aviso (Linha ${a.linha}, Coluna ${a.coluna}):</strong> ${escaparHtml(a.mensagem)}
                </div>
            `).join("");
        } else {
            listaAvisosSemanticos.classList.add("oculto");
            listaAvisosSemanticos.innerHTML = "";
        }

        // Erros Sintáticos
        if (sintatico.errosSintaticos.length > 0) {
            secaoErrosSintaticos.classList.remove("oculto");
            listaErrosSintaticos.innerHTML = sintatico.errosSintaticos.map(e => `
                <div class="item-erro">
                    <div class="erro-icone">🛑</div>
                    <div class="erro-detalhe">
                        <strong>Linha ${e.linha}, Coluna ${e.coluna}:</strong> ${escaparHtml(e.mensagem)}
                        <span class="erro-lexema">Token encontrado: <code>${escaparHtml(e.lexema)}</code></span>
                    </div>
                </div>
            `).join("");
        } else {
            secaoErrosSintaticos.classList.add("oculto");
            listaErrosSintaticos.innerHTML = "";
        }
    }

    // ------------------------------------------------------------------------
    // Download do Arquivo .txt com o resultado
    // ------------------------------------------------------------------------
    btnBaixarTxt.addEventListener("click", () => {
        if (tokensAtuais.length === 0) {
            alert("Realize a análise antes de baixar o arquivo de saída.");
            return;
        }

        let conteudo = "";
        tokensAtuais.forEach(t => {
            if (t.token !== TIPO_TOKEN.ERRO) {
                conteudo += `<${t.lexema}, ${t.token}>\n`;
            }
        });

        const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "saida_tokens.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // ------------------------------------------------------------------------
    // Utilitários de Interface
    // ------------------------------------------------------------------------
    function obterClasseBadge(token) {
        switch (token) {
            case TIPO_TOKEN.PALAVRA_RESERVADA: return "badge-palavra";
            case TIPO_TOKEN.IDENTIFICADOR: return "badge-identificador";
            case TIPO_TOKEN.NUMERO_INTEIRO: return "badge-inteiro";
            case TIPO_TOKEN.NUMERO_REAL: return "badge-real";
            case TIPO_TOKEN.OPERADOR_ARITMETICO: return "badge-aritmetico";
            case TIPO_TOKEN.OPERADOR_RELACIONAL: return "badge-relacional";
            case TIPO_TOKEN.OPERADOR_LOGICO: return "badge-logico";
            case TIPO_TOKEN.SIMBOLO_ESPECIAL: return "badge-especial";
            case TIPO_TOKEN.ATRIBUICAO: return "badge-atribuicao";
            case TIPO_TOKEN.CONSTANTE_STRING:
            case TIPO_TOKEN.CONSTANTE_CARACTERE: return "badge-string";
            case TIPO_TOKEN.FIM: return "badge-fim";
            case TIPO_TOKEN.ERRO: return "badge-erro";
            default: return "badge-padrao";
        }
    }

    function escaparHtml(texto) {
        if (!texto) return "";
        return String(texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Inicializar editor com o primeiro exemplo
    editor.value = EXEMPLOS.teste1;
    atualizarNumerosLinha();
    executarAnalise();
});
