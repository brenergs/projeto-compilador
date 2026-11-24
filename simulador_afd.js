/**
 * ============================================================================
 * UNIVERSIDADE ESTADUAL DO SUDOESTE DA BAHIA - UESB
 * Simulador Visual Didático do Autômato Finito Determinístico (AFD)
 * Modelo de Interação Humano-Computador (IHC) com Pan & Zoom
 * ============================================================================
 */

// Definição das posições dos estados no grafo SVG (layout otimizado e legível)
const NODES_AFD = {
    0:  { id: 0,  nome: "S0",  label: "Início",            x: 180, y: 220, tipo: "inicial" },
    1:  { id: 1,  nome: "S1",  label: "Ident / Reservada", x: 420, y: 70,  tipo: "final" },
    2:  { id: 2,  nome: "S2",  label: "Inteiro",           x: 420, y: 170, tipo: "final" },
    3:  { id: 3,  nome: "S3",  label: "Ponto Fracionário", x: 600, y: 170, tipo: "intermediario" },
    4:  { id: 4,  nome: "S4",  label: "Real",              x: 770, y: 170, tipo: "final" },
    5:  { id: 5,  nome: "S5",  label: "Exp Início",        x: 560, y: 270, tipo: "intermediario" },
    6:  { id: 6,  nome: "S6",  label: "Exp Sinal (+/-)",   x: 720, y: 270, tipo: "intermediario" },
    7:  { id: 7,  nome: "S7",  label: "Exp Dígitos",       x: 880, y: 270, tipo: "final" },
    8:  { id: 8,  nome: "S8",  label: "Dois Pontos (:)",   x: 420, y: 340, tipo: "final" },
    9:  { id: 9,  nome: "S9",  label: "Menor (<)",         x: 420, y: 430, tipo: "final" },
    10: { id: 10, nome: "S10", label: "Maior (>)",         x: 420, y: 520, tipo: "final" },
    11: { id: 11, nome: "S11", label: "Barra (/)",         x: 230, y: 390, tipo: "final" },
    12: { id: 12, nome: "S12", label: "Comentário Bloco",  x: 230, y: 500, tipo: "intermediario" },
    13: { id: 13, nome: "S13", label: "Fechando (*)",      x: 80,  y: 500, tipo: "intermediario" },
    14: { id: 14, nome: "S14", label: "String (\"...\")",    x: 100, y: 80,  tipo: "final" },
    15: { id: 15, nome: "S15", label: "Caractere (')",     x: 260, y: 80,  tipo: "intermediario" },
    16: { id: 16, nome: "S16", label: "Fecha Char (')",    x: 340, y: 20,  tipo: "final" }
};

// Transições relevantes para renderização de arestas
const ARESTAS_AFD = [
    { de: 0, para: 1,  label: "[a-zA-Z_]" },
    { de: 1, para: 1,  label: "[a-zA-Z0-9_]", loop: true },
    { de: 0, para: 2,  label: "[0-9]" },
    { de: 2, para: 2,  label: "[0-9]", loop: true },
    { de: 2, para: 3,  label: "." },
    { de: 3, para: 4,  label: "[0-9]" },
    { de: 4, para: 4,  label: "[0-9]", loop: true },
    { de: 2, para: 5,  label: "e / E" },
    { de: 4, para: 5,  label: "e / E" },
    { de: 5, para: 6,  label: "+ / -" },
    { de: 5, para: 7,  label: "[0-9]" },
    { de: 6, para: 7,  label: "[0-9]" },
    { de: 7, para: 7,  label: "[0-9]", loop: true },
    { de: 0, para: 8,  label: ":" },
    { de: 0, para: 9,  label: "<" },
    { de: 0, para: 10, label: ">" },
    { de: 0, para: 11, label: "/" },
    { de: 11, para: 12, label: "*" },
    { de: 12, para: 13, label: "*" },
    { de: 13, para: 0,  label: "/" },
    { de: 0, para: 14, label: "\"" },
    { de: 0, para: 15, label: "'" },
    { de: 15, para: 16, label: "char" }
];

class SimuladorVisualAFD {
    constructor(svgContainerId) {
        this.svg = document.getElementById(svgContainerId);
        this.passos = [];
        this.indicePasso = 0;
        this.timer = null;
        this.velocidade = 600; // ms por passo
        this.emExecucao = false;

        // Estado de Pan & Zoom
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.arrastando = false;
        this.inicioDragX = 0;
        this.inicioDragY = 0;

        this.renderizarGrafo();
        this.configurarPanZoom();
    }

    renderizarGrafo() {
        if (!this.svg) return;

        let html = `
            <defs>
                <marker id="seta" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                </marker>
                <marker id="seta-ativa" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
                <filter id="brilho" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#38bdf8" flood-opacity="0.9"/>
                </filter>
            </defs>
            <g id="viewport-transform" transform="translate(0, 0) scale(1)">
                <g id="grupo-arestas">
        `;

        // Renderizar Arestas
        ARESTAS_AFD.forEach((a) => {
            const de = NODES_AFD[a.de];
            const para = NODES_AFD[a.para];
            const edgeId = `aresta-${a.de}-${a.para}`;

            if (a.loop) {
                const rx = de.x;
                const ry = de.y - 28;
                html += `
                    <g class="aresta-group" id="${edgeId}">
                        <path d="M ${rx - 15} ${de.y - 20} C ${rx - 25} ${ry - 35}, ${rx + 25} ${ry - 35}, ${rx + 15} ${de.y - 20}" 
                              class="aresta-path" marker-end="url(#seta)"/>
                        <text x="${rx}" y="${ry - 25}" class="aresta-texto">${a.label}</text>
                    </g>
                `;
            } else {
                const mx = (de.x + para.x) / 2;
                const my = (de.y + para.y) / 2;

                html += `
                    <g class="aresta-group" id="${edgeId}">
                        <line x1="${de.x}" y1="${de.y}" x2="${para.x}" y2="${para.y}" class="aresta-path" marker-end="url(#seta)"/>
                        <text x="${mx}" y="${my - 6}" class="aresta-texto">${a.label}</text>
                    </g>
                `;
            }
        });

        html += `</g><g id="grupo-estados">`;

        // Renderizar Nós dos Estados
        Object.values(NODES_AFD).forEach((n) => {
            const isInicial = n.tipo === "inicial";
            const isFinal = n.tipo === "final";

            html += `
                <g class="estado-node" id="nodo-estado-${n.id}" transform="translate(${n.x}, ${n.y})">
                    ${isInicial ? `<path d="M -45 0 L -28 0" class="seta-inicial" marker-end="url(#seta)"/>` : ""}
                    <circle r="24" class="circulo-base" />
                    ${isFinal ? `<circle r="20" class="circulo-duplo" />` : ""}
                    <text class="estado-id" y="4">${n.nome}</text>
                    <text class="estado-desc" y="38">${n.label}</text>
                </g>
            `;
        });

        html += `</g></g>`;
        this.svg.innerHTML = html;
        this.grupoTransform = document.getElementById("viewport-transform");
    }

    configurarPanZoom() {
        if (!this.svg) return;

        // Arrasto com mouse (Pan)
        this.svg.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return; // apenas botão esquerdo
            this.arrastando = true;
            this.inicioDragX = e.clientX - this.panX;
            this.inicioDragY = e.clientY - this.panY;
            this.svg.classList.add("arrastando");
        });

        window.addEventListener("mousemove", (e) => {
            if (!this.arrastando) return;
            this.panX = e.clientX - this.inicioDragX;
            this.panY = e.clientY - this.inicioDragY;
            this.aplicarTransform();
        });

        window.addEventListener("mouseup", () => {
            if (this.arrastando) {
                this.arrastando = false;
                this.svg.classList.remove("arrastando");
            }
        });

        // Zoom com roda do mouse (Scroll Wheel)
        this.svg.addEventListener("wheel", (e) => {
            e.preventDefault();
            const fator = e.deltaY < 0 ? 1.15 : 0.87;
            this.ajustarZoom(fator, e.clientX, e.clientY);
        }, { passive: false });
    }

    ajustarZoom(fator, centroX, centroY) {
        const novoZoom = Math.min(Math.max(this.zoom * fator, 0.4), 3.5);
        if (centroX !== undefined && centroY !== undefined) {
            const rect = this.svg.getBoundingClientRect();
            const mouseSvgX = centroX - rect.left;
            const mouseSvgY = centroY - rect.top;

            this.panX = mouseSvgX - (mouseSvgX - this.panX) * (novoZoom / this.zoom);
            this.panY = mouseSvgY - (mouseSvgY - this.panY) * (novoZoom / this.zoom);
        }
        this.zoom = novoZoom;
        this.aplicarTransform();
    }

    aplicarTransform() {
        if (!this.grupoTransform) {
            this.grupoTransform = document.getElementById("viewport-transform");
        }
        if (this.grupoTransform) {
            this.grupoTransform.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
        }
        if (typeof this.onZoomMudou === "function") {
            this.onZoomMudou(Math.round(this.zoom * 100));
        }
    }

    resetarZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.aplicarTransform();
    }

    zoomMais() {
        this.ajustarZoom(1.2);
    }

    zoomMenos() {
        this.ajustarZoom(0.8);
    }

    carregarPassos(passos) {
        this.pausar();
        this.passos = passos || [];
        this.indicePasso = 0;
        this.atualizarVisualizacao();
    }

    atualizarVisualizacao() {
        if (!this.passos || this.passos.length === 0) return;

        const passo = this.passos[this.indicePasso];
        if (!passo) return;

        // Limpar destaques anteriores
        this.svg.querySelectorAll(".estado-node").forEach(n => {
            n.classList.remove("estado-ativo", "estado-reconhecido", "estado-erro");
        });
        this.svg.querySelectorAll(".aresta-group").forEach(a => a.classList.remove("aresta-ativa"));

        // Destacar estado destino atual
        const nodo = document.getElementById(`nodo-estado-${passo.estadoDestino}`);
        if (nodo) {
            if (passo.tipoAcao === "erro") {
                nodo.classList.add("estado-erro");
            } else if (passo.tipoAcao === "reconhecimento") {
                nodo.classList.add("estado-reconhecido");
            } else {
                nodo.classList.add("estado-ativo");
            }
        }

        // Destacar aresta se houve transição entre estados
        const aresta = document.getElementById(`aresta-${passo.estadoOrigem}-${passo.estadoDestino}`);
        if (aresta) {
            aresta.classList.add("aresta-ativa");
        }

        // Disparar evento para a UI
        if (typeof this.onPassoMudou === "function") {
            this.onPassoMudou(passo, this.indicePasso, this.passos.length);
        }
    }

    proximo() {
        if (this.indicePasso < this.passos.length - 1) {
            this.indicePasso++;
            this.atualizarVisualizacao();
            return true;
        } else {
            this.pausar();
            return false;
        }
    }

    anterior() {
        if (this.indicePasso > 0) {
            this.indicePasso--;
            this.atualizarVisualizacao();
            return true;
        }
        return false;
    }

    irParaInicio() {
        this.pausar();
        this.indicePasso = 0;
        this.atualizarVisualizacao();
    }

    reproduzir() {
        if (this.emExecucao) return;
        this.emExecucao = true;
        if (typeof this.onStatusExecucao === "function") this.onStatusExecucao(true);

        const tick = () => {
            const continua = this.proximo();
            if (continua && this.emExecucao) {
                this.timer = setTimeout(tick, this.velocidade);
            } else {
                this.pausar();
            }
        };
        this.timer = setTimeout(tick, this.velocidade);
    }

    pausar() {
        this.emExecucao = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (typeof this.onStatusExecucao === "function") this.onStatusExecucao(false);
    }

    setVelocidade(novaVelocidade) {
        this.velocidade = novaVelocidade;
    }
}

// Exportação global para navegador e Node
if (typeof window !== "undefined") {
    window.SimuladorVisualAFD = SimuladorVisualAFD;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { SimuladorVisualAFD, NODES_AFD, ARESTAS_AFD };
}
