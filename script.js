let currentRole = 'admin';
let currentBranchName = 'Filial MAX Centro';

document.addEventListener("DOMContentLoaded", () => {
    // Gerar QR Code
    const currentUrl = window.location.href;
    new QRCode(document.getElementById("qrcode-display"), {
        text: currentUrl,
        width: 150,
        height: 150,
        colorDark : "#0f172a",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    // Fechar dropdown de filiais se clicar fora dele
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
    
    // Troca as telas
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');

    // Atualiza opções dependendo do nível de acesso
    updateRoleView();
}

function logout() {
    closeAllMenus();
    document.getElementById('dashboard-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
}

// Funções de Menu Lateral
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

// Funções do Dropdown de Filiais
function toggleBranchMenu(event) {
    event.stopPropagation(); // Evita que o clique feche imediatamente
    document.getElementById('branch-dropdown').classList.toggle('active');
}

function selectBranch(branchName) {
    currentBranchName = branchName;
    document.getElementById('current-branch-text').innerText = 'Loja: ' + branchName;
    document.getElementById('branch-dropdown').classList.remove('active');
    updateRoleView(); // Atualiza o texto do perfil refletindo a nova loja
}

// Atualiza os textos e botões dependendo se é admin ou view
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
