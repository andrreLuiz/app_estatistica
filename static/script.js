'use strict';

// ===== Elementos e estado ===== //
const el = {
    fileInput: document.getElementById('fileInput'),
    fileNameDisplay: document.getElementById('fileNameDisplay'),
    colunaContainer: document.getElementById('colunaContainer'),
    colunaSelect: document.getElementById('colunaSelect'),
    btnAnalisar: document.getElementById('btnAnalisar'),
    emptyState: document.getElementById('emptyState'),
    resultadosArea: document.getElementById('resultadosArea'),
    loadingBox: document.getElementById('loadingBox'),
    msgBox: document.getElementById('msgBox'),
    tabelaBody: document.getElementById('tabelaBody'),
    chart: document.getElementById('chart_div'),
    abas: document.querySelectorAll('.tab-btn'),
    modoBtns: document.querySelectorAll('.mode-btn'),
    modoCsv: document.getElementById('modo-csv'),
    modoTexto: document.getElementById('modo-texto'),
    nomeVariavel: document.getElementById('nomeVariavel'),
    dadosTexto: document.getElementById('dadosTexto'),
    contadorValores: document.getElementById('contadorValores'),
};

const estado = {
    modo: 'csv',              
    arquivo: null,            
    colunasCarregadas: false, 
};

const CORES = { barra: '#0d9488', poligono: '#d97706', grade: '#f5f5f4', eixo: '#57534e' };

const formatoPct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = {
    inteiro: new Intl.NumberFormat('pt-BR'),
    valor: new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }),
    relativa: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
    pct: (v) => `${formatoPct.format(v)}%`,
};

// Interface //
function mostrar(elemento, animar = true) {
    elemento.hidden = false;
    if (animar) {
        elemento.classList.remove('fade-in');
        void elemento.offsetWidth; // força reflow para reiniciar a animação
        elemento.classList.add('fade-in');
    }
}

function esconder(...elementos) {
    elementos.forEach((e) => { e.hidden = true; });
}

function mostrarMensagem(texto, tipo = 'erro') {
    el.msgBox.textContent = texto;
    el.msgBox.dataset.tipo = tipo;
    mostrar(el.msgBox);
}

function definirCarregando(carregando) {
    el.loadingBox.hidden = !carregando;
    atualizarBotao(carregando);
}

function atualizarBotao(carregando = false) {
    const pronto = estado.modo === 'csv' ? estado.colunasCarregadas : contarValores() > 0;
    el.btnAnalisar.hidden = estado.modo === 'csv' && !estado.colunasCarregadas;
    el.btnAnalisar.disabled = carregando || !pronto;
}

function trocarModo(modo) {
    estado.modo = modo;
    el.modoBtns.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.modo === modo)));
    el.modoCsv.hidden = modo !== 'csv';
    el.modoTexto.hidden = modo !== 'texto';
    esconder(el.msgBox);
    atualizarBotao();
    if (modo === 'texto') el.dadosTexto.focus();
}

function separarValores(texto) {
    return texto.replace(/,\s+/g, ' ').split(/[\s;]+/).filter(Boolean);
}

function contarValores() {
    return separarValores(el.dadosTexto.value).length;
}

function aoDigitar() {
    const n = contarValores();
    el.contadorValores.textContent = n ? `${fmt.inteiro.format(n)} ${n === 1 ? 'valor' : 'valores'}` : '';
    atualizarBotao();
}

async function postar(url, campos) {
    const formData = new FormData();
    Object.entries(campos).forEach(([chave, valor]) => formData.append(chave, valor));

    const resposta = await fetch(url, { method: 'POST', body: formData });
    let dados;
    try {
        dados = await resposta.json();
    } catch {
        throw new Error(`Resposta inválida do servidor (HTTP ${resposta.status}).`);
    }
    if (!resposta.ok) throw new Error(dados.error || 'Erro inesperado.');
    return dados;
}

// principal //
async function aoSelecionarArquivo(evento) {
    const [arquivo] = evento.target.files;
    if (!arquivo) return;

    estado.arquivo = arquivo;
    estado.colunasCarregadas = false;
    evento.target.value = ''; 
    el.fileNameDisplay.textContent = arquivo.name;
    el.fileNameDisplay.classList.add('file-selected');
    esconder(el.msgBox, el.colunaContainer);
    atualizarBotao();

    try {
        const { colunas } = await postar('/api/colunas', { file: arquivo });
        if (colunas.length === 0) {
            mostrarMensagem('O arquivo não possui colunas numéricas.');
            return;
        }
        // new Option() usa texto puro: nomes de coluna nunca viram HTML
        el.colunaSelect.replaceChildren(...colunas.map((c) => new Option(c, c)));
        estado.colunasCarregadas = true;
        mostrar(el.colunaContainer);
        atualizarBotao();
        mostrar(el.btnAnalisar);
    } catch (erro) {
        mostrarMensagem(erro.message);
    }
}

function requisicaoDeAnalise() {
    if (estado.modo === 'csv') {
        return postar('/api/analisar', { file: estado.arquivo, coluna: el.colunaSelect.value });
    }
    return postar('/api/analisar-texto', { dados: el.dadosTexto.value, nome: el.nomeVariavel.value });
}

async function aoAnalisar() {
    if (el.btnAnalisar.disabled) return;

    esconder(el.msgBox);
    definirCarregando(true);
    try {
        const resultado = await requisicaoDeAnalise();
        preencherResultados(resultado);
        esconder(el.emptyState);
        mostrar(el.resultadosArea);
        renderizarGrafico(resultado.coluna, resultado.grafico);
    } catch (erro) {
        esconder(el.resultadosArea);
        mostrar(el.emptyState, false);
        mostrarMensagem(erro.message);
    } finally {
        definirCarregando(false);
    }
}

// ===== Renderização ===== //
function preencherResultados({ coluna, resumo, tabela }) {
    document.getElementById('tituloVariavel').textContent = coluna;
    document.getElementById('badgeTipo').textContent = resumo.tipo;
    document.getElementById('kpi-n').textContent = fmt.inteiro.format(resumo.n);
    document.getElementById('kpi-unicos').textContent = fmt.inteiro.format(resumo.unicos);
    document.getElementById('kpi-min').textContent = fmt.valor.format(resumo.min);
    document.getElementById('kpi-max').textContent = fmt.valor.format(resumo.max);
    preencherTabela(tabela);
}

function criarLinha(celulas, classe = '') {
    const tr = document.createElement('tr');
    if (classe) tr.className = classe;
    celulas.forEach((texto) => {
        const td = document.createElement('td');
        td.textContent = texto;
        tr.appendChild(td);
    });
    return tr;
}

function preencherTabela({ linhas, total }) {
    const trs = linhas.map((l) => criarLinha([
        l.classe,
        fmt.inteiro.format(l.fi),
        fmt.relativa.format(l.fr),
        fmt.pct(l.fr_pct),
        fmt.inteiro.format(l.fac),
        fmt.pct(l.fac_pct),
    ]));
    trs.push(criarLinha([
        'Total',
        fmt.inteiro.format(total.fi),
        fmt.relativa.format(total.fr),
        fmt.pct(total.fr_pct),
        '',
        '',
    ], 'total-row'));
    el.tabelaBody.replaceChildren(...trs);
}

function renderizarGrafico(coluna, g) {
    // As frequências já vêm prontas do servidor: o gráfico mostra exatamente o que está na tabela
    const barras = {
        type: 'bar',
        x: g.x,
        y: g.y,
        width: g.discreta ? g.amplitude * 0.6 : g.amplitude,
        name: g.discreta ? 'Frequência absoluta' : 'Histograma',
        customdata: g.rotulos,
        hovertemplate: '%{customdata}<br>Frequência: %{y}<extra></extra>',
        marker: { color: CORES.barra, line: { color: '#ffffff', width: 1 } },
    };

    const poligono = {
        type: 'scatter',
        x: g.x_poligono,
        y: g.y_poligono,
        mode: 'lines+markers',
        name: 'Polígono de frequência',
        hoverinfo: 'skip',
        line: { color: CORES.poligono, width: 2 },
        marker: { size: 6, color: CORES.poligono, line: { color: '#ffffff', width: 1.5 } },
    };

    const ticks = g.limites ?? g.x; // contínua: limites das classes; discreta: os próprios valores
    const eixo = { gridcolor: CORES.grade, color: CORES.eixo };

    const layout = {
        margin: { t: 20, r: 20, l: 50, b: 50 },
        bargap: 0,
        legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1 },
        xaxis: { ...eixo, title: { text: coluna }, tickvals: ticks, ticktext: ticks.map((v) => fmt.valor.format(v)) },
        yaxis: { ...eixo, title: { text: 'Frequência absoluta' }, rangemode: 'tozero' },
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        font: { family: 'Inter, sans-serif', size: 12 },
        separators: ',.',
    };

    Plotly.react(el.chart, [barras, poligono], layout, { responsive: true, displayModeBar: false });
}

function trocarAba(idAba) {
    el.abas.forEach((botao) => {
        const ativa = botao.dataset.tab === idAba;
        botao.setAttribute('aria-selected', String(ativa));
        document.getElementById(botao.dataset.tab).hidden = !ativa;
    });
    // O Plotly não consegue medir um elemento oculto; recalcula o tamanho ao exibir
    if (idAba === 'tab-grafico' && el.chart.data) Plotly.Plots.resize(el.chart);
}

// Eventos //
el.fileInput.addEventListener('change', aoSelecionarArquivo);
el.dadosTexto.addEventListener('input', aoDigitar);
el.dadosTexto.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) aoAnalisar(); 
});
el.modoBtns.forEach((botao) => botao.addEventListener('click', () => trocarModo(botao.dataset.modo)));
el.btnAnalisar.addEventListener('click', aoAnalisar);
el.abas.forEach((botao) => botao.addEventListener('click', () => trocarAba(botao.dataset.tab)));