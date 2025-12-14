/* ============================================================
   FUNÇÕES UTILITÁRIAS (CORREÇÃO DE FUSO E FORMATAÇÃO)
============================================================ */

// Corrige o bug do dia anterior (fuso horário)
function criarDataSemFuso(dataString) {
    if (!dataString) return null;
    const [ano, mes, dia] = dataString.split('-');
    return new Date(ano, mes - 1, dia);
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function alternarCampos() {
    const motivo = document.getElementById("motivo").value;
    const boxAviso = document.getElementById("boxAviso");
    
    // Se pediu demissão, esconde opções de aviso trabalhado/indenizado
    if (motivo === "pedido") {
        boxAviso.style.display = "none";
    } else {
        boxAviso.style.display = "block";
    }
}

/* ============================================================
   LÓGICA DE CÁLCULO CLT (REAL)
============================================================ */

function calcularRescisaoAvancada() {
    // 1. Coleta de dados com correção de fuso
    const salario = parseFloat(document.getElementById("salario").value);
    const admissao = criarDataSemFuso(document.getElementById("admissao").value);
    const demissao = criarDataSemFuso(document.getElementById("demissao").value);
    const motivo = document.getElementById("motivo").value;
    const tipoAviso = document.getElementById("aviso").value;
    const saldoFgts = parseFloat(document.getElementById("saldoFgts").value) || 0;
    const temFeriasVencidas = document.getElementById("feriasVencidas").checked;

    // Validação
    if (!salario || !admissao || !demissao) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }
    if (demissao <= admissao) {
        alert("A demissão não pode ser anterior à admissão.");
        return;
    }

    // 2. Cálculos de Tempo (Anos e Meses)
    // Cálculo de anos completos para a Lei do Aviso Prévio (12.506)
    let anosTrabalhados = demissao.getFullYear() - admissao.getFullYear();
    const m = demissao.getMonth() - admissao.getMonth();
    if (m < 0 || (m === 0 && demissao.getDate() < admissao.getDate())) {
        anosTrabalhados--;
    }
    if (anosTrabalhados < 0) anosTrabalhados = 0;

    // Cálculo de dias extras de aviso (3 dias por ano, máx 60 extras, total 90)
    let diasAvisoLei = anosTrabalhados * 3;
    if (diasAvisoLei > 60) diasAvisoLei = 60; // Limite da lei

    // 3. Definição das Variáveis Financeiras
    let valorSaldoSalario = 0;
    let valorAvisoIndenizado = 0; // Valor cheio ou proporcional
    let valorAvisoTrabalhado = 0; // Se houver
    let valorFeriasVencidas = 0;
    let valorFeriasProp = 0;
    let valor13 = 0;
    let valorMultaFGTS = 0;

    // --- A) Saldo de Salário ---
    // Paga pelos dias trabalhados no mês da demissão
    const diasTrabalhadosMes = demissao.getDate();
    // Para cálculo exato, usa-se divisor 30 na maioria dos sindicatos
    valorSaldoSalario = (salario / 30) * diasTrabalhadosMes;

    // --- B) Lógica do Aviso Prévio (Complexa) ---
    // Projeção do tempo de serviço (Aviso indenizado conta como tempo para férias/13º)
    let dataProjecao = new Date(demissao); 
    
    if (motivo === "semJusta") {
        if (tipoAviso === "indenizado") {
            // Empresa mandou embora e pagou para sair na hora
            // Recebe 30 dias + dias da lei (3/ano)
            const diasTotalAviso = 30 + diasAvisoLei;
            valorAvisoIndenizado = (salario / 30) * diasTotalAviso;
            
            // Projeta a data para frente para calcular 13º e Férias
            dataProjecao.setDate(dataProjecao.getDate() + diasTotalAviso);
            
        } else {
            // Aviso Trabalhado
            // O funcionário trabalha os 30 dias (já inclusos no salário ou saldo).
            // PORÉM, os dias extras (3 por ano) normalmente são INDENIZADOS, 
            // pois a lei não obriga trabalhar mais que 30 dias.
            if (diasAvisoLei > 0) {
                valorAvisoIndenizado = (salario / 30) * diasAvisoLei; // Paga os dias da lei como extra
            }
            // A projeção conta apenas os dias indenizados extras
            dataProjecao.setDate(dataProjecao.getDate() + diasAvisoLei);
        }
        
        // Multa 40% FGTS
        valorMultaFGTS = saldoFgts * 0.40;
    }

    // --- C) Contagem de Avos (Lógica Blindada para Virada de Ano) ---
    
    // 1. Cálculo do 13º Salário
    // Se a projeção virou o ano (Ex: Demissão Dez/25 -> Projeção Jan/26)
    // O funcionário ganha o 13º de 2025 (12/12) + Avos de 2026.
    let meses13 = 0;
    
    if (dataProjecao.getFullYear() > demissao.getFullYear()) {
        // Se mudou de ano, paga o ano da demissão cheio (12/12)
        // Nota: Em rescisão, normalmente paga-se tudo como "13º Rescisão"
        // Aqui vamos somar tudo em 12 avos para simplificar ou tratar separadamente
        meses13 = 12; 
        
        // Verifica se ganhou avos no ano novo (SÓ se tiver >= 15 dias no ano novo)
        // Ex: Projeção caiu 02/01 (2 dias) -> Não ganha avo de 2026.
        // Ex: Projeção caiu 20/01 (20 dias) -> Ganha +1 avo (mas CLT limita a 12/ano, então pagaria como indenizado extra ou soma)
        // Para simplificar a UI: Vamos considerar 12/12 pois ele completou o ano.
    } else {
        // Mesmo ano
        meses13 = dataProjecao.getMonth() + 1;
        if (dataProjecao.getDate() < 15) meses13 -= 1;
    }

    // 2. Cálculo de Férias Proporcionais (Ajuste Fino de Data)
    // O cálculo de mês a mês simples falha se o dia da projeção for menor que o dia da admissão
    // Ex: Admissão dia 21. Projeção dia 02. (Diferença de meses dá 2, mas não completou o segundo mês)
    
    let dataAniversario = new Date(admissao);
    dataAniversario.setFullYear(dataProjecao.getFullYear());
    // Se aniversário ainda não chegou no ano da projeção, volta 1 ano
    if (dataAniversario > dataProjecao) {
        dataAniversario.setFullYear(dataProjecao.getFullYear() - 1);
    }
    
    // Diferença bruta de meses
    let avosFerias = (dataProjecao.getFullYear() - dataAniversario.getFullYear()) * 12 + 
                     (dataProjecao.getMonth() - dataAniversario.getMonth());

    // Ajuste do dia: Se o dia da projeção é menor que o dia do aniversário, não fechou o mês
    if (dataProjecao.getDate() < dataAniversario.getDate()) {
        avosFerias -= 1;
    }

    // Regra dos 15 dias: Verifica os dias restantes (fração)
    // Pega a data exata de fechamento do último mês completo
    let dataFechamentoMes = new Date(dataAniversario);
    dataFechamentoMes.setMonth(dataFechamentoMes.getMonth() + avosFerias);
    
    // Calcula quantos dias sobraram após o último mês completo
    const diffTime = Math.abs(dataProjecao - dataFechamentoMes);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays >= 15) {
        avosFerias += 1;
    }

    // Travas finais
    if (avosFerias > 12) avosFerias = 12;
    if (avosFerias < 0) avosFerias = 0;
    if (meses13 > 12) meses13 = 12;

    // --- D) Valores Finais de Férias e 13º ---
    
    if (temFeriasVencidas) {
        valorFeriasVencidas = salario + (salario / 3);
    }

    const valorBaseFeriasProp = (salario / 12) * avosFerias;
    valorFeriasProp = valorBaseFeriasProp + (valorBaseFeriasProp / 3);

    valor13 = (salario / 12) * meses13;

    // --- E) Totalizador ---
    const total = valorSaldoSalario + valorAvisoIndenizado + valorFeriasVencidas + 
                  valorFeriasProp + valor13 + valorMultaFGTS;

    // 4. Renderização do HTML
    const resultadoDiv = document.getElementById("resultado");
    let html = `
        <div class="result-box">
            <h2>Resultado Estimado (Bruto)</h2>
            
            <div class="result-row">
                <span>Saldo de Salário (${diasTrabalhadosMes} dias):</span>
                <strong>${formatarMoeda(valorSaldoSalario)}</strong>
            </div>`;

    if (valorAvisoIndenizado > 0) {
        const labelAviso = tipoAviso === 'trabalhado' 
            ? `Aviso Prévio Proporcional Indenizado (${diasAvisoLei} dias):`
            : `Aviso Prévio Indenizado (${30 + diasAvisoLei} dias):`;
            
        html += `
            <div class="result-row">
                <span>${labelAviso}</span>
                <strong>${formatarMoeda(valorAvisoIndenizado)}</strong>
            </div>`;
    }

    if (valorFeriasVencidas > 0) {
        html += `
            <div class="result-row">
                <span>Férias Vencidas + 1/3:</span>
                <strong>${formatarMoeda(valorFeriasVencidas)}</strong>
            </div>`;
    }

    html += `
            <div class="result-row">
                <span>Férias Proporcionais (${avosFerias}/12) + 1/3:</span>
                <strong>${formatarMoeda(valorFeriasProp)}</strong>
            </div>
            <div class="result-row">
                <span>13º Salário Proporcional (${meses13}/12):</span>
                <strong>${formatarMoeda(valor13)}</strong>
            </div>`;

    if (valorMultaFGTS > 0) {
        html += `
            <div class="result-row" style="color: #2e7d32;">
                <span>Multa 40% FGTS:</span>
                <strong>${formatarMoeda(valorMultaFGTS)}</strong>
            </div>`;
    }

    html += `
            <div class="result-row total">
                <span>Total Bruto Estimado:</span>
                <span>${formatarMoeda(total)}</span>
            </div>
        </div>
    `;

    resultadoDiv.innerHTML = html;
    resultadoDiv.classList.remove('fade-in');
    void resultadoDiv.offsetWidth; 
    resultadoDiv.classList.add('fade-in');
    resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}