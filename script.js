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
    const canvasRev = document.getElementById('revenueChart');
    const canvasStock = document.getElementById('stockChart');
    
    // Proteção: só avança se os gráficos existirem no HTML
    if (!canvasRev || !canvasStock) return;

    if(revenueChartInstance) revenueChartInstance.destroy();
    if(stockChartInstance) stockChartInstance.destroy();

    // 1. Gráfico de Linha (Faturamento)
    const ctxRev = canvasRev.getContext('2d');
    
    let gradient = ctxRev.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(2, 132, 199, 0.4)'); 
    gradient.addColorStop(1, 'rgba(2, 132, 199, 0.0)');

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
                tension: 0.4
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
    const ctxStock = canvasStock.getContext('2d');
    
    const randomLow = Math.floor(Math.random() * 60) + 10;
    const randomNeg = Math.floor(Math.random() * 20) + 2;
    const randomGhost = Math.floor(Math.random() * 150) + 50;

    stockChartInstance = new Chart(ctxStock, {
        type: 'doughnut',
        data: {
            labels: ['Saudável', 'Baixo', 'Negativo', 'Fantasma'],
            datasets: [{
                data: [3452, randomLow, randomNeg, randomGhost],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#64748b'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 12 } }
                }
            }
        }
    });
}


// ==========================================
// MÓDULO DE PEDIDOS E FORNECEDORES
// ==========================================

const suppliersData = [
    {
        id: 1, name: "AgroSul Alimentos S.A", cnpj: "11.222.333/0001-44",
        products: [
            { id: 101, name: "Arroz Branco 5kg", price: 22.90 },
            { id: 102, name: "Feijão Preto 1kg", price: 8.50 },
            { id: 103, name: "Farinha de Trigo 1kg", price: 5.20 }
        ]
    },
    {
        id: 2, name: "Laticínios Vale Ltda", cnpj: "44.555.666/0001-77",
        products: [
            { id: 201, name: "Leite Integral 1L", price: 4.80 },
            { id: 202, name: "Queijo Mussarela (Kg)", price: 45.00 }
        ]
    },
    {
        id: 3, name: "Bebidas Máxima", cnpj: "77.888.999/0001-11",
        products: [
            { id: 301, name: "Refrigerante Cola 2L", price: 9.50 },
            { id: 302, name: "Água Mineral 500ml (Pct 12)", price: 15.00 }
        ]
    },
    {
        id: 4, name: "Distribuidora Carnes Sul", cnpj: "22.111.000/0001-22",
        products: [
            { id: 401, name: "Picanha Bovina (Kg)", price: 68.90 },
            { id: 402, name: "Frango Inteiro (Kg)", price: 11.50 }
        ]
    },
    {
        id: 5, name: "Hortifruti Frescor", cnpj: "99.000.111/0001-33",
        products: [
            { id: 501, name: "Tomate Carmem (Kg)", price: 7.90 },
            { id: 502, name: "Cebola Nacional (Kg)", price: 5.50 }
        ]
    }
];

// Estado do carrinho de pedidos
let orderCart = {};

// Função para alternar entre Telas (Dashboard <-> Pedidos)
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    closeAllMenus();
    if (screenId === 'order-screen') {
        renderSuppliers();
    }
}

// Renderiza a lista de fornecedores
function renderSuppliers() {
    const container = document.getElementById('suppliers-container');
    container.innerHTML = '';

    suppliersData.forEach(supp => {
        let prodHTML = '';
        supp.products.forEach(prod => {
            const currentQty = orderCart[prod.id]?.qty || 0;
            prodHTML += `
                <div class="product-item">
                    <div class="prod-info">
                        <span class="prod-name">${prod.name}</span>
                        <span class="prod-price">R$ ${prod.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateQty(${supp.id}, ${prod.id}, -1)">-</button>
                        <input type="text" class="qty-input" id="qty-${prod.id}" value="${currentQty}" readonly>
                        <button class="qty-btn" onclick="updateQty(${supp.id}, ${prod.id}, 1)">+</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML += `
            <div class="supplier-card">
                <div class="supplier-header">
                    <div>
                        <h3>${supp.name}</h3>
                        <span class="supplier-cnpj">CNPJ: ${supp.cnpj}</span>
                    </div>
                </div>
                <div class="supplier-products">
                    ${prodHTML}
                </div>
            </div>
        `;
    });
    calculateTotal();
}

function updateQty(suppId, prodId, change) {
    if (!orderCart[prodId]) {
        // Encontra produto e fornecedor
        const supp = suppliersData.find(s => s.id === suppId);
        const prod = supp.products.find(p => p.id === prodId);
        orderCart[prodId] = { suppName: supp.name, suppCnpj: supp.cnpj, prodName: prod.name, price: prod.price, qty: 0 };
    }

    let newQty = orderCart[prodId].qty + change;
    if (newQty < 0) newQty = 0;
    
    orderCart[prodId].qty = newQty;
    document.getElementById(`qty-${prodId}`).value = newQty;
    
    if (newQty === 0) delete orderCart[prodId]; // Remove do carrinho se for 0
    calculateTotal();
}

function calculateTotal() {
    let total = 0;
    Object.values(orderCart).forEach(item => {
        total += item.price * item.qty;
    });
    document.getElementById('total-order-price').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Controle de Modais
function showLowStockAlert() {
    document.getElementById('low-stock-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Geração da Nota Fiscal
function generateInvoice() {
    const items = Object.values(orderCart);
    if (items.length === 0) {
        alert("Selecione pelo menos um produto para gerar o pedido.");
        return;
    }

    const tbody = document.getElementById('invoice-items');
    tbody.innerHTML = '';
    let totalNF = 0;

    items.forEach(item => {
        const itemTotal = item.price * item.qty;
        totalNF += itemTotal;
        tbody.innerHTML += `
            <tr>
                <td>${item.suppName}<br><small>${item.suppCnpj}</small></td>
                <td>${item.prodName}</td>
                <td>${item.qty}</td>
                <td>R$ ${item.price.toFixed(2).replace('.', ',')}</td>
                <td>R$ ${itemTotal.toFixed(2).replace('.', ',')}</td>
            </tr>
        `;
    });

    document.getElementById('inv-total-price').innerText = `R$ ${totalNF.toFixed(2).replace('.', ',')}`;
    
    // Data atual
    const today = new Date();
    document.getElementById('inv-date').innerText = today.toLocaleDateString('pt-BR') + ' ' + today.toLocaleTimeString('pt-BR');

    document.getElementById('invoice-modal').classList.add('active');
}

function confirmOrder() {
    alert("Pedido enviado com sucesso para os fornecedores!");
    orderCart = {}; // Limpa o carrinho
    renderSuppliers();
    closeModal('invoice-modal');
    switchScreen('dashboard-screen'); // Volta pro dashboard
}
