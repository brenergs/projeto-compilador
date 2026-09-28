/**
 * ============================================================================
 * UNIVERSIDADE ESTADUAL DO SUDOESTE DA BAHIA - UESB
 * Aplicação Web do Analisador Léxico - Mini_Pascal
 * Controlador da Interface (Vanilla JavaScript)
 * ============================================================================
 */

// Exemplos pré-carregados para facilitar o teste imediato
const EXEMPLOS = {
    teste1: `program teste;
var x,y: integer;
const pi := 3.1416;
/* inicio do programa */
begin
read(x);
if (x > y) then
y := x ;
else
y := -x;
writeln(x);
write(y);
end.`,

    teste2: `/* Outro exemplo de programa */
Program Piloto;
 /* declarações de variáveis e constantes globais */
 var cont, total: integer ;
Nota1, Nota2, Media_das_medias, med: real;
/* Inicio do Programa */
begin
media_das_medias := 0;
writeln("******** ENTRADA DE DADOS ***************");
writeln("Digite o total de alunos");
read(total);
for cont=1 to total do
begin
writeln("Digite os valores da primeira nota do aluno ", cont);
read(Nota1);
writeln("Digite os valores da segunda nota do aluno ", cont);
read(Nota2);
med := (Nota1+Nota2)/2.0;
media_das_medias := media_das_medias + med;
write("Media = ",med);
end;
write("Media Geral = ", Media_das_medias/total);
end.`,

    teste3: `program RepeticoesEOperadores;
var
    i, limite, resultado: integer;
    ativo: integer;
/* Teste de laços while e repeat com operadores relacionais e lógicos */
begin
    i := 0;
    limite := 10;
    
    while (i <= limite) and not (i = 5) do
    begin
        resultado := i mod 2;
        if (resultado = 0) or (i >= 8) then
            writeln("Par ou maior que oito: ", i);
        i := i + 1;
    end;

    repeat
        i := i - 1;
        write("Regredindo: ", i);
    until (i <> 0);
end.`,

    teste4: `program TiposEConstantes;
var
    letra: char;
    mensagem: string;
    fator1, fator2, total: real;
    expoente: real;
/* Testando números reais exponenciais, caracteres e strings */
begin
    letra := 'A';
    mensagem := "Processando calculos cientificos...";
    writeln(mensagem);
    
    fator1 := 1.33;
    fator2 := 24.40e-04;
    expoente := 1.5e+02;
    
    total := (fator1 * fator2) / expoente;
    writeln("Total calculado = ", total);
    writeln("Caractere selecionado = ", letra);
end.`,

    teste5: `program TesteErrosLexicos;
var
    salario, taxa: real;
    nome: string;
    caractereInvalido: char;
begin
    /* Testando caracteres desconhecidos e erros de formatacao */
    salario := 1500.00;
    taxa := 12.e;        /* Erro: expoente incompleto */
    Mari& := 10;         /* Erro: símbolo '&' desconhecido */
    nome := "String nao fechada nesta linha;
    caractereInvalido := 'abc'; /* Erro: char com mais de 1 caractere */
    valor@ := #50;       /* Erros: símbolos '@' e '#' desconhecidos */
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
    const contadorLinhas = document.getElementById("stat-linhas");
    const contadorTempo = document.getElementById("stat-tempo");

    // Elementos de visualização de saída
    const corpoTabela = document.getElementById("corpo-tabela-tokens");
    const areaTextoSaida = document.getElementById("saida-texto-formatado");
    const secaoErros = document.getElementById("secao-erros");
    const listaErros = document.getElementById("lista-erros");
    const tabTabela = document.getElementById("tab-tabela");
    const tabTexto = document.getElementById("tab-texto");
    const viewTabela = document.getElementById("view-tabela");
    const viewTexto = document.getElementById("view-texto");

    let tokensAtuais = [];
    let errosAtuais = [];

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
    // Upload de Arquivo .txt
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
            inputArquivo.value = ""; // reset
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
        renderizarResultados([], []);
        contadorTokens.textContent = "0";
        contadorErros.textContent = "0";
        contadorTempo.textContent = "0ms";
    });

    // ------------------------------------------------------------------------
    // Alternância entre visualização em Tabela e Texto
    // ------------------------------------------------------------------------
    tabTabela.addEventListener("click", () => {
        tabTabela.classList.add("active");
        tabTexto.classList.remove("active");
        viewTabela.classList.remove("oculto");
        viewTexto.classList.add("oculto");
    });

    tabTexto.addEventListener("click", () => {
        tabTexto.classList.add("active");
        tabTabela.classList.remove("active");
        viewTexto.classList.remove("oculto");
        viewTabela.classList.add("oculto");
    });

    // ------------------------------------------------------------------------
    // Execução da Análise Léxica
    // ------------------------------------------------------------------------
    function executarAnalise() {
        const codigo = editor.value;
        if (!codigo.trim()) {
            renderizarResultados([], []);
            contadorTokens.textContent = "0";
            contadorErros.textContent = "0";
            contadorTempo.textContent = "0ms";
            return;
        }

        const tInicio = performance.now();
        const lexer = new AnalisadorLexico(codigo);
        const resultado = lexer.executar();
        const tFim = performance.now();

        tokensAtuais = resultado.tokens;
        errosAtuais = resultado.erros;

        const duracao = (tFim - tInicio).toFixed(1);
        contadorTempo.textContent = `${duracao}ms`;
        contadorTokens.textContent = tokensAtuais.filter(t => t.token !== TIPO_TOKEN.ERRO).length;
        contadorErros.textContent = errosAtuais.length;

        renderizarResultados(tokensAtuais, errosAtuais);
    }

    btnAnalisar.addEventListener("click", executarAnalise);

    // ------------------------------------------------------------------------
    // Renderização dos Resultados na Interface
    // ------------------------------------------------------------------------
    function renderizarResultados(tokens, erros) {
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

                // Criação da badge de estilo para a categoria do token
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

        // 2. Formato em Texto (Conforme especificação: par <cadeia, token> por linha e no modelo do exemplo)
        let textoSaida = "";
        tokens.forEach(t => {
            if (t.token !== TIPO_TOKEN.ERRO) {
                // Formato exigido no documento: "<cadeia, token>" ou formato colunar "lexema Token"
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
    }

    // ------------------------------------------------------------------------
    // Download do Arquivo .txt com o resultado
    // ------------------------------------------------------------------------
    btnBaixarTxt.addEventListener("click", () => {
        if (tokensAtuais.length === 0) {
            alert("Realize a análise léxica antes de baixar o arquivo de saída.");
            return;
        }

        let conteudo = "";
        // Criação de arquivo com um par <cadeia, token> por linha conforme exigência da UESB
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
        return texto
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
