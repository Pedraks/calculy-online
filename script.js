// Array de Regras (Você pode adicionar quantas quiser aqui)
const rules = [
  { 
    id: 1, 
    text: "Regra 1: A senha deve conter a primeira letra da palavra Pipoca (Maiúscula).", 
    validate: (p) => p.includes('P') 
  },
  { 
    id: 2, 
    text: "Regra 2: A senha deve conter a segunda letra da palavra Arroz (minúscula).", 
    validate: (p) => p.includes('r') 
  },
  { 
    id: 3, 
    text: "Regra 3: A senha deve incluir um metal (ex: ouro, prata, ferro, cobre).", 
    validate: (p) => /ouro|prata|ferro|cobre|zinco|bronze/i.test(p) 
  },
  { 
    id: 4, 
    text: "Regra 4: A senha deve ter exatamente 25 caracteres.", 
    validate: (p) => p.length === 25 
  },
  { 
    id: 5, 
    text: "Regra 5: A senha deve conter uma peça de xadrez.", 
    validate: (p) => /peão|peao|torre|cavalo|bispo|rainha|rei/i.test(p) 
  },
  { 
    id: 6, 
    text: "Regra 6: A soma de todos os números na senha deve ser exatamente 12.", 
    validate: (p) => {
        const sum = (p.match(/\d/g) || []).reduce((a, b) => a + parseInt(b), 0);
        return p.match(/\d/) && sum === 12;
    }
  }
];

const input = document.getElementById('password-input');
const container = document.getElementById('rules-container');
const btn = document.getElementById('hack-btn');
const charCount = document.getElementById('char-count');

let visibleRules = 1;

function updateGame() {
    const pass = input.value;
    charCount.innerText = `${pass.length} caracteres inseridos`;

    let allVisiblePass = true;
    container.innerHTML = ''; 

    // Renderiza apenas as regras que o jogador já desbloqueou
    for (let i = 0; i < visibleRules; i++) {
        const rule = rules[i];
        const isPassing = rule.validate(pass);

        const div = document.createElement('div');
        div.className = `rule ${isPassing ? 'pass' : 'fail'}`;
        div.innerText = `${isPassing ? '[✓ Acesso]' : '[X Erro]'} ${rule.text}`;
        
        // Insere no topo para a regra mais recente ficar visível
        container.prepend(div);

        if (!isPassing) {
            allVisiblePass = false;
        }
    }

    // Se o jogador acertou todas as visíveis, libera a próxima (Efeito cascata)
    if (allVisiblePass && visibleRules < rules.length) {
        visibleRules++;
        updateGame(); 
        return; 
    }

    // Condição de Vitória Completa
    if (allVisiblePass && visibleRules === rules.length) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}

// Escuta a digitação em tempo real
input.addEventListener('input', updateGame);

// Evento de vitória
btn.addEventListener('click', () => {
    alert("SYSTEM HACKED! Você venceu o imHackerDle de hoje.");
    // Aqui você pode adicionar lógica de copiar pro clipboard os resultados quadradinhos 🟩🟥
});

// Inicializa a primeira regra na tela
updateGame();
