// Banco de dados simulado com cifras reais formatadas
const songsDatabase = [
    {
        id: 1,
        title: "Garota de Ipanema",
        artist: "Tom Jobim",
        tone: "F",
        favorite: true,
        cifra: `[Intro] F7M  G7(13)

[Verso 1]
F7M                      G7(13)
 Olha que coisa mais linda, mais cheia de graça
Gm7                      C7(9)        F7M    C7(9)
 É ela, a menina que vem e que passa
F7M                  F7            Bb7M
 Num doce balanço a caminho do mar
Bbm6                             F7M
 Moça do corpo dourado, do sol de Ipanema
    D7(9)              Gm7
O seu balançado é mais que um poema
      C7(9)                F7M    Gb7  F7M
É a coisa mais linda que eu já vi passar`
    },
    {
        id: 2,
        title: "Pais e Filhos",
        artist: "Legião Urbana",
        tone: "C",
        favorite: false,
        cifra: `[Intro] C  Em  Am  G  F

[Verso 1]
C              Em
 Estou sentindo falta de você
Am                  G
 Do bem que você me fazia
C                 Em
 De tudo que ficou pra trás
Am                    G
 Da nossa antiga sintonia
F                   G
 E nos dissemos tanta coisa
C                   Am
 Que a gente nem lembra mais`
    },
    {
        id: 3,
        title: "Mal Acostumado",
        artist: "Araketu",
        tone: "G",
        favorite: true,
        cifra: `[Intro] G  D/F#  Em  C

[Verso 1]
G                 D/F#
 Meu amor, olha só, hoje eu vim aqui
Em                 C
 Só pra te falar que eu te adoro sim
G                 D/F#
 Não dá pra ficar longe de você
Em                 C
 Meu coração só sabe te querer`
    }
];

const semitones = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

let currentSong = null;
let currentTransposeOffset = 0;
let currentFontSize = 14;
let autoScrollInterval = null;
let isScrolling = false;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderSongLists();
    setupNavigation();
    setupTools();
});

// Renderizar listas de músicas na Home e Favoritas
function renderSongLists(filterText = '') {
    const grid = document.getElementById('songsGrid');
    const favGrid = document.getElementById('favoritesGrid');
    
    grid.innerHTML = '';
    favGrid.innerHTML = '';

    const filtered = songsDatabase.filter(s => 
        s.title.toLowerCase().includes(filterText.toLowerCase()) || 
        s.artist.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.forEach(song => {
        const cardHTML = createSongCardHTML(song);
        grid.innerHTML += cardHTML;
        
        if (song.favorite) {
            favGrid.innerHTML += cardHTML;
        }
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding:20px;">Nenhuma música encontrada.</p>`;
    }

    attachCardEvents();
}

function createSongCardHTML(song) {
    return `
        <div class="song-card" data-id="${song.id}">
            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
            </div>
            <div class="song-tone">${song.tone}</div>
        </div>
    `;
}

function attachCardEvents() {
    document.querySelectorAll('.song-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-id');
            openCifra(parseInt(id));
        });
    });
}

// Navegação por abas
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Busca em tempo real
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderSongLists(e.target.value);
    });
}

// Abrir visualizador de cifra
function openCifra(id) {
    currentSong = songsDatabase.find(s => s.id === id);
    currentTransposeOffset = 0;
    currentFontSize = 14;
    stopAutoScroll();

    document.getElementById('viewSongTitle').innerText = currentSong.title;
    document.getElementById('viewSongArtist').innerText = currentSong.artist;
    document.getElementById('currentTone').innerText = currentSong.tone;
    updateFavoriteButtonState();

    updateCifraDisplay();

    document.getElementById('cifraView').classList.add('active');
}

// Fechar visualizador
document.getElementById('backBtn').addEventListener('click', () => {
    stopAutoScroll();
    document.getElementById('cifraView').classList.remove('active');
});

// Botão Favorito dentro da cifra
const favViewBtn = document.getElementById('favViewBtn');
favViewBtn.addEventListener('click', () => {
    if (!currentSong) return;
    currentSong.favorite = !currentSong.favorite;
    updateFavoriteButtonState();
    renderSongLists(document.getElementById('searchInput').value);
});

function updateFavoriteButtonState() {
    if (currentSong && currentSong.favorite) {
        favViewBtn.innerHTML = `<i data-lucide="heart" style="fill: var(--accent);"></i>`;
    } else {
        favViewBtn.innerHTML = `<i data-lucide="heart"></i>`;
    }
    lucide.createIcons();
}

// Ferramentas da Cifra (Transposição, Fonte, Autoscroll)
function setupTools() {
    // Transposição + / -
    document.getElementById('transposeUp').addEventListener('click', () => transpose(1));
    document.getElementById('transposeDown').addEventListener('click', () => transpose(-1));

    // Tamanho da fonte
    document.getElementById('fontUp').addEventListener('click', () => adjustFontSize(1));
    document.getElementById('fontDown').addEventListener('click', () => adjustFontSize(-1));

    // Auto-scroll
    document.getElementById('autoScrollBtn').addEventListener('click', toggleAutoScroll);
}

function transpose(step) {
    currentTransposeOffset = (currentTransposeOffset + step) % 12;
    if (currentTransposeOffset < 0) currentTransposeOffset += 12;

    // Calcular novo tom base
    let baseIndex = semitones.indexOf(currentSong.tone.replace('M','').replace('m',''));
    if (baseIndex !== -1) {
        let newIndex = (baseIndex + currentTransposeOffset) % 12;
        document.getElementById('currentTone').innerText = semitones[newIndex];
    }

    updateCifraDisplay();
}

function adjustFontSize(delta) {
    currentFontSize = Math.max(10, Math.min(24, currentFontSize + delta));
    document.getElementById('cifraPreText').style.fontSize = `${currentFontSize}px`;
}

// Lógica de transposição de acordes no texto
function updateCifraDisplay() {
    let text = currentSong.cifra;
    
    if (currentTransposeOffset !== 0) {
        // Expressão regular simples para encontrar acordes isolados
        text = text.replace(/\b([A-G][#b]?(?:M|m|7|9|13|4|sus|dim|aug)*)\b/g, (match) => {
            let chordRoot = match.match(/^[A-G][#b]?/)[0];
            let chordSuffix = match.slice(chordRoot.length);
            let idx = semitones.indexOf(chordRoot);
            if (idx !== -1) {
                let newIdx = (idx + currentTransposeOffset) % 12;
                return semitones[newIdx] + chordSuffix;
            }
            return match;
        });
    }

    document.getElementById('cifraPreText').innerText = text;
    document.getElementById('cifraPreText').style.fontSize = `${currentFontSize}px`;
}

// Auto-scroll funcional
function toggleAutoScroll() {
    const btn = document.getElementById('autoScrollBtn');
    if (isScrolling) {
        stopAutoScroll();
    } else {
        startAutoScroll();
    }
}

function startAutoScroll() {
    isScrolling = true;
    const btn = document.getElementById('autoScrollBtn');
    btn.classList.add('active');
    btn.innerHTML = `<i data-lucide="pause"></i> Pausar`;
    lucide.createIcons();

    const container = document.getElementById('cifraScrollContainer');
    autoScrollInterval = setInterval(() => {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
            stopAutoScroll();
        } else {
            container.scrollTop += 1.2; // Velocidade suave
        }
    }, 30);
}

function stopAutoScroll() {
    isScrolling = false;
    clearInterval(autoScrollInterval);
    const btn = document.getElementById('autoScrollBtn');
    btn.classList.remove('active');
    btn.innerHTML = `<i data-lucide="play"></i> Auto-scroll`;
    lucide.createIcons();
}
