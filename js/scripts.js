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

/* ============================================================
   CALCULADORA DE FÉRIAS
   ============================================================ */
/* ============================================================
   CONFIGURAÇÕES INICIAIS (Ao carregar a página)
   ============================================================ */
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Lógica para mostrar/esconder input de dias customizados (Já existia)
    const selectDias = document.getElementById("diasFerias");
    const inputCustom = document.getElementById("diasCustom");
    
    if(selectDias && inputCustom) {
        selectDias.addEventListener("change", function() {
            if (this.value === "custom") {
                inputCustom.style.display = "block";
                inputCustom.required = true;
            } else {
                inputCustom.style.display = "none";
                inputCustom.required = false;
            }
        });
    }

    // 2. NOVA LÓGICA: Vender Férias ajusta os dias automaticamente
    const checkboxVender = document.getElementById("venderFerias");
    
    if (checkboxVender && selectDias) {
        checkboxVender.addEventListener("change", function() {
            if (this.checked) {
                // Se marcou "Vender 10 dias", o descanso muda para 20 dias automaticamente
                selectDias.value = "20";
            } else {
                // Se desmarcou, volta para o padrão de 30 dias
                selectDias.value = "30";
            }
            // Força a atualização visual (caso estivesse no modo 'custom')
            selectDias.dispatchEvent(new Event('change'));
        });
    }
});

function calcularFerias() {
    const salario = parseFloat(document.getElementById("salarioBase").value);
    const dependentes = parseInt(document.getElementById("dependentesFerias").value) || 0;
    
    let diasGozo = document.getElementById("diasFerias").value;
    if (diasGozo === "custom") {
        diasGozo = parseInt(document.getElementById("diasCustom").value);
    } else {
        diasGozo = parseInt(diasGozo);
    }

    const vender10 = document.getElementById("venderFerias").checked;
    const adiantar13 = document.getElementById("adiantar13").checked;

    if (!salario || !diasGozo) {
        alert("Preencha o salário e os dias de férias.");
        return;
    }

    // --- 1. Proventos (Ganhos) ---
    
    // A. Valor dos dias de férias (Descanso)
    const valorDiasFerias = (salario / 30) * diasGozo;
    const umTercoFerias = valorDiasFerias / 3;
    const baseTributavel = valorDiasFerias + umTercoFerias;

    // B. Abono Pecuniário (Venda de 10 dias) - ISENTO DE IMPOSTOS
    let valorAbono = 0;
    let umTercoAbono = 0;
    if (vender10) {
        // O abono é calculado sobre 10 dias do salário
        valorAbono = (salario / 30) * 10;
        umTercoAbono = valorAbono / 3;
    }

    // C. Adiantamento 13º (Metade do salário)
    let valor13 = 0;
    if (adiantar13) {
        valor13 = salario / 2;
    }

    // --- 2. Descontos (Sobre Base Tributável) ---
    // A base tributável é SÓ o valor das férias gozadas + 1/3. O abono é livre.
    
    // INSS Progressivo 2025 (Recalculando para garantir precisão)
    let inss = 0;
    let saldo = baseTributavel;
    // Faixas
    if (saldo > 7786.02) saldo = 7786.02; // Teto
    
    if (saldo > 4000.03) { inss += (saldo - 4000.03) * 0.14; saldo = 4000.03; }
    if (saldo > 2666.68) { inss += (saldo - 2666.68) * 0.12; saldo = 2666.68; }
    if (saldo > 1412.00) { inss += (saldo - 1412.00) * 0.09; saldo = 1412.00; }
    inss += saldo * 0.075;

    // IRRF
    const deducaoDep = dependentes * 189.59;
    const baseIR = baseTributavel - inss - deducaoDep;
    let irrf = 0;
    
    if (baseIR > 4664.68) { irrf = (baseIR * 0.275) - 896.00; }
    else if (baseIR > 3751.05) { irrf = (baseIR * 0.225) - 662.77; }
    else if (baseIR > 2826.65) { irrf = (baseIR * 0.15) - 381.44; }
    else if (baseIR > 2259.20) { irrf = (baseIR * 0.075) - 169.44; }
    
    if (irrf < 0) irrf = 0;

    // --- 3. Totais ---
    const totalBruto = baseTributavel + valorAbono + umTercoAbono + valor13;
    const totalDescontos = inss + irrf;
    const totalLiquido = totalBruto - totalDescontos;

    // --- 4. Renderizar ---
    const divResult = document.getElementById("resultadoFerias");
    divResult.style.display = "block";
    
    let html = `
        <div class="result-box">
            <h2>Recibo de Férias Estimado</h2>
            
            <div class="result-row">
                <span>Férias (${diasGozo} dias) + 1/3:</span>
                <strong>${formatarMoeda(baseTributavel)}</strong>
            </div>`;
            
    if (vender10) {
        html += `
            <div class="result-row" style="color: #2e7d32;">
                <span>Abono Pecuniário (Isento):</span>
                <strong>+ ${formatarMoeda(valorAbono + umTercoAbono)}</strong>
            </div>`;
    }

    if (adiantar13) {
        html += `
            <div class="result-row" style="color: #1976d2;">
                <span>Adiantamento 13º:</span>
                <strong>+ ${formatarMoeda(valor13)}</strong>
            </div>`;
    }

    html += `
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;">
            
            <div class="result-row" style="color: #d32f2f;">
                <span>INSS:</span>
                <strong>- ${formatarMoeda(inss)}</strong>
            </div>
            <div class="result-row" style="color: #d32f2f;">
                <span>IRRF:</span>
                <strong>- ${formatarMoeda(irrf)}</strong>
            </div>
            
            <div class="result-row total">
                <span>Líquido a Receber:</span>
                <span>${formatarMoeda(totalLiquido)}</span>
            </div>
        </div>
    `;

    divResult.innerHTML = html;
    divResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   CALCULADORA DE 13º SALÁRIO
   ============================================================ */
function calcularDecimoTerceiro() {
    const salario = parseFloat(document.getElementById("salarioDecimo").value);
    const meses = parseInt(document.getElementById("mesesTrabalhados").value);
    const dependentes = parseInt(document.getElementById("dependentesDecimo").value) || 0;
    const jaRecebeuPrimeira = document.getElementById("primeiraParcelaPaga").checked;

    if (!salario) {
        alert("Preencha o salário bruto.");
        return;
    }

    // 1. Valor Total Proporcional (Bruto Cheio)
    const valorTotalBruto = (salario / 12) * meses;

    // 2. Cálculo da 1ª Parcela (50% do bruto, sem descontos)
    const primeiraParcela = valorTotalBruto / 2;

    // 3. Cálculo de Descontos (Sobre o Total Bruto)
    
    // INSS Progressivo 2025
    let inss = 0;
    let saldo = valorTotalBruto;
    if (saldo > 7786.02) saldo = 7786.02; // Teto
    
    if (saldo > 4000.03) { inss += (saldo - 4000.03) * 0.14; saldo = 4000.03; }
    if (saldo > 2666.68) { inss += (saldo - 2666.68) * 0.12; saldo = 2666.68; }
    if (saldo > 1412.00) { inss += (saldo - 1412.00) * 0.09; saldo = 1412.00; }
    inss += saldo * 0.075;

    // IRRF
    const deducaoDep = dependentes * 189.59;
    const baseIR = valorTotalBruto - inss - deducaoDep;
    let irrf = 0;
    
    if (baseIR > 4664.68) { irrf = (baseIR * 0.275) - 896.00; }
    else if (baseIR > 3751.05) { irrf = (baseIR * 0.225) - 662.77; }
    else if (baseIR > 2826.65) { irrf = (baseIR * 0.15) - 381.44; }
    else if (baseIR > 2259.20) { irrf = (baseIR * 0.075) - 169.44; }
    
    if (irrf < 0) irrf = 0;

    // 4. Cálculo da 2ª Parcela
    // Total Bruto - INSS - IRRF - O que já foi pago na 1ª
    const totalDescontos = inss + irrf;
    const segundaParcela = valorTotalBruto - totalDescontos - primeiraParcela;

    // --- Renderização ---
    const divResult = document.getElementById("resultadoDecimo");
    divResult.style.display = "block";
    
    let html = `<div class="result-box"><h2>Resultado Estimado</h2>`;

    if (!jaRecebeuPrimeira) {
        html += `
            <div class="result-row" style="color: #1976d2; font-weight:bold;">
                <span>1ª Parcela (até 30/11):</span>
                <span>${formatarMoeda(primeiraParcela)}</span>
            </div>
            <div style="font-size:0.8em; color:#666; margin-bottom:10px;">(Sem descontos)</div>`;
    } else {
        html += `
            <div class="result-row" style="color: #999; text-decoration: line-through;">
                <span>1ª Parcela (Já recebida):</span>
                <span>${formatarMoeda(primeiraParcela)}</span>
            </div>`;
    }

    html += `
            <div class="result-row" style="color: #2e7d32; font-weight:bold; margin-top:15px; border-top: 1px dashed #ccc; padding-top:10px;">
                <span>2ª Parcela (até 20/12):</span>
                <span>${formatarMoeda(segundaParcela)}</span>
            </div>
            
            <div style="background:#fff; padding:10px; border-radius:5px; margin-top:10px; border:1px solid #eee;">
                <div class="result-row" style="color: #d32f2f; font-size:0.9em;">
                    <span>Desconto INSS:</span> <strong>- ${formatarMoeda(inss)}</strong>
                </div>
                <div class="result-row" style="color: #d32f2f; font-size:0.9em;">
                    <span>Desconto IRRF:</span> <strong>- ${formatarMoeda(irrf)}</strong>
                </div>
            </div>
            
            <div class="result-row total" style="margin-top:15px;">
                <span>Total Líquido (1ª + 2ª):</span>
                <span>${formatarMoeda(primeiraParcela + segundaParcela)}</span>
            </div>
        </div>
    `;

    divResult.innerHTML = html;
    divResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   CALCULADORA DE SALÁRIO LÍQUIDO
   ============================================================ */
function calcularSalarioLiquido() {
    const salarioBruto = parseFloat(document.getElementById("salarioBruto").value);
    const dependentes = parseInt(document.getElementById("dependentes").value) || 0;
    const outrosDescontos = parseFloat(document.getElementById("outrosDescontos").value) || 0;
    
    if (!salarioBruto) {
        alert("Digite o salário bruto.");
        return;
    }

    // 1. Cálculo do INSS (Tabela Progressiva 2024/2025)
    // Teto INSS atualizado base ~R$ 7.786,02
    let inss = 0;
    let salarioParaInss = salarioBruto;
    
    // Faixa 1: até 1.412,00 (7.5%)
    if (salarioParaInss > 1412.00) {
        inss += 1412.00 * 0.075;
    } else {
        inss += salarioParaInss * 0.075;
    }

    // Faixa 2: de 1.412,01 até 2.666,68 (9%)
    if (salarioParaInss > 2666.68) {
        inss += (2666.68 - 1412.00) * 0.09;
    } else if (salarioParaInss > 1412.00) {
        inss += (salarioParaInss - 1412.00) * 0.09;
    }

    // Faixa 3: de 2.666,69 até 4.000,03 (12%)
    if (salarioParaInss > 4000.03) {
        inss += (4000.03 - 2666.68) * 0.12;
    } else if (salarioParaInss > 2666.68) {
        inss += (salarioParaInss - 2666.68) * 0.12;
    }

    // Faixa 4: de 4.000,04 até Teto 7.786,02 (14%)
    if (salarioParaInss > 7786.02) {
        inss += (7786.02 - 4000.03) * 0.14;
    } else if (salarioParaInss > 4000.03) {
        inss += (salarioParaInss - 4000.03) * 0.14;
    }
    
    // Trava do teto (caso a soma passe do teto oficial)
    const tetoInss = 908.85; // Aproximado 2024, ajusta-se conforme virada do ano
    if (inss > tetoInss) inss = tetoInss;

    // 2. Cálculo do IRRF
    const deducaoDependentes = dependentes * 189.59;
    const baseIRRF = salarioBruto - inss - deducaoDependentes;
    let irrf = 0;

    if (baseIRRF <= 2259.20) {
        irrf = 0; // Isento
    } else if (baseIRRF <= 2826.65) {
        irrf = (baseIRRF * 0.075) - 169.44;
    } else if (baseIRRF <= 3751.05) {
        irrf = (baseIRRF * 0.15) - 381.44;
    } else if (baseIRRF <= 4664.68) {
        irrf = (baseIRRF * 0.225) - 662.77;
    } else {
        irrf = (baseIRRF * 0.275) - 896.00;
    }
    
    if (irrf < 0) irrf = 0;

    const salarioLiquido = salarioBruto - inss - irrf - outrosDescontos;

    // 3. Renderizar Resultado
    const divResult = document.getElementById("resultadoLiquido");
    divResult.style.display = "block";
    divResult.innerHTML = `
        <div class="result-box">
            <h2>Seu Salário Líquido</h2>
            
            <div class="result-row">
                <span>Salário Bruto:</span>
                <strong>${formatarMoeda(salarioBruto)}</strong>
            </div>
            <div class="result-row" style="color: #d32f2f;">
                <span>INSS (Previdência):</span>
                <strong>- ${formatarMoeda(inss)}</strong>
            </div>
            <div class="result-row" style="color: #d32f2f;">
                <span>IRRF (Imposto de Renda):</span>
                <strong>- ${formatarMoeda(irrf)}</strong>
            </div>
             <div class="result-row" style="color: #d32f2f;">
                <span>Outros Descontos:</span>
                <strong>- ${formatarMoeda(outrosDescontos)}</strong>
            </div>
            
            <div class="result-row total">
                <span>Líquido a Receber:</span>
                <span>${formatarMoeda(salarioLiquido)}</span>
            </div>
        </div>
    `;
    
    divResult.classList.remove('fade-in');
    void divResult.offsetWidth; 
    divResult.classList.add('fade-in');
    divResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


