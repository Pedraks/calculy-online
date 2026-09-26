// 1. AS REGRAS (Nível Hard)
const rules = [
  { 
    id: 1, 
    text: "Regra 1: A senha deve conter pelo menos uma letra da palavra 'PIPOCA' (obrigatoriamente em MAIÚSCULA).", 
    validate: (p) => /[PIOCA]/.test(p) 
  },
  { 
    id: 2, 
    text: "Regra 2: A senha deve conter pelo menos uma letra da palavra 'arroz' (obrigatoriamente em minúscula).", 
    validate: (p) => /[aroz]/.test(p) 
  },
  { 
    id: 3, 
    text: "Regra 3: A senha deve incluir um metal (ex: ouro, prata, ferro, cobre, zinco).", 
    validate: (p) => /ouro|prata|ferro|cobre|zinco|bronze/i.test(p) 
  },
  { 
    id: 4, 
    text: "Regra 4: A senha deve conter o resultado matemático de 2³ (dois elevado ao cubo).", 
    validate: (p) => p.includes('8') 
  },
  { 
    id: 5, 
    text: "Regra 5: A senha deve conter uma peça de xadrez.", 
    validate: (p) => /peão|peao|torre|cavalo|bispo|rainha|rei/i.test(p) 
  },
  { 
    id: 6, 
    text: "Regra 6: A soma de TODOS os números presentes na senha deve ser exatamente 33.", 
    validate: (p) => {
        const sum = (p.match(/\d/g) || []).reduce((a, b) => a + parseInt(b), 0);
        return p.match(/\d/) && sum === 33;
    }
  },
  { 
    id: 7, 
    text: "Regra 7: A senha deve conter a sigla universal para Placa de Vídeo (3 letras maiúsculas).", 
    validate: (p) => p.includes('GPU') 
  },
  { 
    id: 8, 
    text: "Regra 8: Inclua o nome do jogo quadrado onde você constrói com blocos e foge de Creepers.", 
    validate: (p) => /minecraft/i.test(p) 
  },
  { 
    id: 9, 
    text: "Regra 9: A quantidade total de vogais na senha deve ser exatamente 12.", 
    validate: (p) => {
        const vogais = (p.match(/[aeiouáéíóúâêîôûãõAEIOUÁÉÍÓÚÂÊÎÔÛÃÕ]/g) || []).length;
        return vogais === 12;
    }
  },
  { 
    id: 10, 
    text: "Regra 10: A senha deve ter exatamente 45 caracteres.", 
    validate: (p) => p.length === 45 
  }
];

// 2. A LÓGICA DO JOGO (Não apague esta parte!)
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

    // Condição de Vitória Completa (Libera o botão Executar)
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
});

// Inicializa a primeira regra na tela
updateGame();
