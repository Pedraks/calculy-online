document.addEventListener("DOMContentLoaded", () => {
    // Gera o QR Code apontando para o IP/URL atual da máquina local
    const currentUrl = window.location.href;
    new QRCode(document.getElementById("qrcode-display"), {
        text: currentUrl,
        width: 150,
        height: 150,
        colorDark : "#0f172a",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
});

function login(role) {
    // Esconde tela de login e mostra dashboard
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');

    // Lógica para esconder opções de admin na versão de visualização (lojas)
    const adminItems = document.querySelectorAll('.admin-only');
    if (role === 'view') {
        adminItems.forEach(item => item.style.display = 'none');
        document.querySelector('.role').innerText = 'Visualização • Filial MAX Centro';
    } else {
        adminItems.forEach(item => item.style.display = 'flex');
        document.querySelector('.role').innerText = 'Administrador • Filial MAX Centro';
    }
}

function logout() {
    // Fecha menus, esconde dashboard e volta ao login
    closeAllMenus();
    document.getElementById('dashboard-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
}

function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    const overlay = document.getElementById('overlay');
    
    // Se estiver aberto, fecha. Se estiver fechado, abre.
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
