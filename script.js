let currentRole = 'admin';
let currentBranchName = 'Filial MAX Centro';

// Variáveis globais para controlar os gráficos e recriá-los ao mudar de filial
let revenueChartInstance = null;
let stockChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    const currentUrl = window.location.href;
    new QRCode(document.getElementById("qrcode-display"), {
        text: currentUrl,
        width: 150,
        height: 150,
        colorDark : "#0f172a",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    window.onclick = function(event) {
        if (!event.target.closest('.branch-selector')) {
            const dropdown = document.getElementById('branch-dropdown');
            if (dropdown && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        }
    }
});

function login(role) {
    currentRole = role;
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');
    updateRoleView();
    
    // Inicia os gráficos assim que logar
    setTimeout(initCharts, 200); 
}

function logout() {
    closeAllMenus();
    document.getElementById('dashboard-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
}

function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    const overlay = document.getElementById('overlay');
    
    if (menu.classList.contains('active')) {
        closeAllMenus();
    } else {
        menu.classList.add('active');
        overlay.classList.add('active');
    }
}

function closeAllMenus() {
    document.getElementById('left-sidebar').classList.remove('active');
    document.getElementById('right-sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function toggleBranchMenu(event) {
    event.stopPropagation();
    document.getElementById('branch-dropdown').classList.toggle('active');
}

function selectBranch(branchName) {
    currentBranchName = branchName;
    document.getElementById('current-branch-text').innerText = 'Loja: ' + branchName;
    document.getElementById('branch-dropdown').classList.remove('active');
    updateRoleView();
    
    // Recria os gráficos para simular que buscou os dados da nova filial
    initCharts(); 
}

function updateRoleView() {
    const adminItems = document.querySelectorAll('.admin-only');
    const profileRoleText = document.getElementById('profile-branch-text');
    
    if (currentRole === 'view') {
        adminItems.forEach(item => item.style.display = 'none');
        profileRoleText.innerText = 'Visualização • ' + currentBranchName;
    } else {
        adminItems.forEach(item => item.style.display = 'flex');
        profileRoleText.innerText = 'Administrador • ' + currentBranchName;
    }
}

// ==========================================
// CONFIGURAÇÃO DOS GRÁFICOS (Chart.js)
// ==========================================
function initCharts() {
    // Destrói gráficos antigos se existirem (ex: ao trocar de filial)
    if(revenueChartInstance) revenueChartInstance.destroy();
    if(stockChartInstance) stockChartInstance.destroy();

    // 1. Gráfico de Linha (Faturamento)
    const ctxRev = document.getElementById('revenueChart').getContext('2d');
    
    // Cria um efeito de degradê azul abaixo da linha
    let gradient = ctxRev.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(2, 132, 199, 0.4)'); // Azul StockGuard
    gradient.addColorStop(1, 'rgba(2, 132, 199, 0.0)');

    // Gera números aleatórios baseados na filial para o dashboard parecer "vivo"
    const randomData = Array.from({length: 7}, () => Math.floor(Math.random() * (160000 - 90000) + 90000));

    revenueChartInstance = new Chart(ctxRev, {
        type: 'line',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Hoje'],
            datasets: [{
                label: 'Receita (R$)',
                data: randomData,
                borderColor: '#0284c7',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#0284c7',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.4 // Deixa a linha curvada/suave
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.parsed.y.toLocaleString('pt-BR');
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: false, grid: { borderDash: [5, 5] } },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Gráfico de Rosca (Saúde do Estoque)
    const ctxStock = document.getElementById('stockChart').getContext('2d');
    
    // Randomiza pequenos defeitos no estoque só para teste
    const randomLow = Math.floor(Math.random() * 60) + 10;
    const randomNeg = Math.floor(Math.random() * 20) + 2;
    const randomGhost = Math.floor(Math.random() * 150) + 50;

    stockChartInstance = new Chart(ctxStock, {
        type: 'doughnut',
        data: {
            labels: ['Estoque Saudável', 'Baixo', 'Negativo', 'Fantasma'],
            datasets: [{
                data: [3452, randomLow, randomNeg, randomGhost],
                backgroundColor: [
                    '#10b981', // Verde Sucesso
                    '#f59e0b', // Laranja Aviso
                    '#ef4444', // Vermelho Perigo
                    '#64748b'  // Cinza Fantasma
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%', // Espessura da rosca
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 12 } }
                }
            }
        }
    });
}
