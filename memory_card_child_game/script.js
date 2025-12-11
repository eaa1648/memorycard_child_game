// Oyun değişkenleri
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = 20; // Oyun süresi 20 saniye
let gameTimerInterval;
let previewTimerInterval;
let canFlip = true;
let playerName = "Misafir";
let score = 0;
let leaderboard = [];
let gameActive = false; // Oyunun aktif olup olmadığını takip eder

// Emojiler için kart değerleri
const cardValues = ['🍎', '🚀', '🐱', '🍕', '⚽', '🌵', '🎸', '💎'];

// Puanlama sistemi
const POINTS_PER_MATCH = 100;
const TIME_BONUS = 10; // Saniye başına bonus puan

// DOM elementlerini seç
const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const resetButton = document.getElementById('reset-button');
const winModal = document.getElementById('win-modal');
const finalMoves = document.getElementById('final-moves');
const finalTime = document.getElementById('final-time');
const finalScore = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again');
const displayName = document.getElementById('display-name');
const winnerName = document.getElementById('winner-name');
const previewOverlay = document.getElementById('preview-overlay');
const previewCountdownDisplay = document.getElementById('preview-countdown');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardBody = document.getElementById('leaderboard-body');
const closeLeaderboardButton = document.getElementById('close-leaderboard');
// Yeni eklenen elementler
const nameInputSection = document.getElementById('name-input-section');
const winnerNameInput = document.getElementById('winner-name-input');
const saveScoreButton = document.getElementById('save-score-button');

/**
 * Fisher-Yates karıştırma algoritması
 * @param {Array} array - Karıştırılacak dizi
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Kartları oluştur ve oyun tahtasına ekle
 */
function createCards() {
    // Her emojiden ikişer tane olacak şekilde kart dizisi oluştur
    let gameCards = [...cardValues, ...cardValues];
    
    // Kartları karıştır
    gameCards = shuffle(gameCards);
    
    // Oyun tahtasını temizle
    gameBoard.innerHTML = '';
    
    // Kartları oluştur ve oyun tahtasına ekle
    gameCards.forEach((value, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = index;
        card.dataset.value = value;
        
        card.innerHTML = `
            <div class="card-front">${value}</div>
            <div class="card-back"></div>
        `;
        
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
        cards.push(card);
    });
}

/**
 * Kartları 5 saniye boyunca göster
 */
function showCardsTemporarily() {
    // Tüm kartları çevir
    cards.forEach(card => {
        card.classList.add('flipped');
    });
    
    // Preview overlay'i göster
    previewOverlay.classList.remove('hidden');
    
    // Geri sayımı başlat (5 saniye)
    let countdown = 5;
    previewCountdownDisplay.textContent = countdown;
    
    clearInterval(previewTimerInterval);
    previewTimerInterval = setInterval(() => {
        countdown--;
        previewCountdownDisplay.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(previewTimerInterval);
            // Kartları geri çevir
            cards.forEach(card => {
                card.classList.remove('flipped');
            });
            
            // Preview overlay'i gizle
            previewOverlay.classList.add('hidden');
            
            // Oyunu başlat
            startGameTimer();
        }
    }, 1000);
}

/**
 * Kartı çevirme işlevi
 * @param {Event} e - Tıklama olayı
 */
function flipCard(e) {
    // Oyun aktif değilse veya kart çevirme engellenmişse veya zaten iki kart çevrilmişse işlem yapma
    if (!gameActive || !canFlip || flippedCards.length === 2) return;
    
    const card = e.target.closest('.card');
    
    // Eğer kart zaten çevrilmişse veya eşleşmişse işlem yapma
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    
    // Kartı çevir
    card.classList.add('flipped');
    flippedCards.push(card);
    
    // Eğer iki kart çevrilmişse eşleştirme kontrolü yap
    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        
        // Kart çevirme işlemini geçici olarak engelle
        canFlip = false;
        
        // Eşleştirme kontrolü
        setTimeout(checkMatch, 1000);
    }
}

/**
 * Eşleştirme kontrolü
 */
function checkMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.value === card2.dataset.value;
    
    if (isMatch) {
        // Eşleşen kartları kaldır
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        
        // Puan ekle
        score += POINTS_PER_MATCH;
        scoreDisplay.textContent = score;
        
        // Tüm kartlar eşleşti mi kontrol et
        if (matchedPairs === cardValues.length / 2) {
            endGame(true); // Oyuncu kazandı
        }
    } else {
        // Eşleşmeyen kartları geri çevir
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
    }
    
    // Çevrilen kartları sıfırla ve kart çevirme işlemini tekrar etkinleştir
    flippedCards = [];
    canFlip = true;
}

/**
 * Oyun zamanlayıcısını başlat (geriye sayım)
 */
function startGameTimer() {
    // Oyunu aktif hale getir
    gameActive = true;
    
    // Zamanlayıcıyı başlat (20 saniyeden geriye say)
    clearInterval(gameTimerInterval);
    timer = 20; // Başlangıç süresi
    timerDisplay.textContent = timer;
    
    gameTimerInterval = setInterval(() => {
        timer--;
        timerDisplay.textContent = timer;
        
        // Süre bitti mi kontrol et
        if (timer <= 0) {
            clearInterval(gameTimerInterval);
            gameActive = false;
            endGame(false); // Süre bitti, oyuncu kaybetti
        }
    }, 1000);
}

/**
 * Oyunu başlat
 */
function startGame() {
    // Değişkenleri sıfırla
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    timer = 20;
    score = 0;
    canFlip = true;
    gameActive = false;
    
    // Ekranı güncelle
    movesDisplay.textContent = moves;
    timerDisplay.textContent = timer;
    scoreDisplay.textContent = score;
    
    // Zamanlayıcıları durdur
    clearInterval(gameTimerInterval);
    clearInterval(previewTimerInterval);
    
    // Kartları oluştur
    createCards();
    
    // Kartları 5 saniye boyunca göster
    showCardsTemporarily();
    
    // Kazanma/modalı gizle
    winModal.classList.add('hidden');
}

/**
 * Oyunu sonlandır
 * @param {boolean} isWin - Oyuncu kazandı mı?
 */
function endGame(isWin) {
    // Oyunu devre dışı bırak
    gameActive = false;
    
    // Zamanlayıcıyı durdur
    clearInterval(gameTimerInterval);
    clearInterval(previewTimerInterval);
    
    if (isWin) {
        // Oyuncu kazandıysa bonus puan hesapla
        const timeBonus = timer * 50; // Kalan saniye başına 50 puan
        const moveBonus = Math.max(0, 500 - (moves * 10)); // Hamle başına 10 puan eksiltme
        const bonus = timeBonus + moveBonus;
        
        // Toplam puanı hesapla
        const totalScore = score + bonus;
        
        // Sonuçları modalda göster
        winnerName.textContent = playerName;
        finalMoves.textContent = moves;
        finalTime.textContent = (20 - timer); // Geçen süre
        finalScore.textContent = totalScore;
        
        // Kazandı mesajı
        document.querySelector('#win-modal h2').textContent = `Tebrikler ${playerName}!`;
        document.querySelector('#win-modal p').textContent = "Oyunu tamamladınız.";
        
        // Kullanıcı adı girişi bölümünü göster
        nameInputSection.style.display = 'block';
        winnerNameInput.value = playerName === 'Misafir' ? '' : playerName;
        
        // Modalı göster
        winModal.classList.remove('hidden');
    } else {
        // Süre bitti, oyuncu kaybetti
        // Sonuçları modalda göster
        winnerName.textContent = playerName;
        finalMoves.textContent = moves;
        finalTime.textContent = 20; // Tam süre
        finalScore.textContent = score;
        
        // Kaybetti mesajı
        document.querySelector('#win-modal h2').textContent = `${playerName}`;
        document.querySelector('#win-modal p').textContent = "Süreniz doldu!";
        
        // Kullanıcı adı girişi bölümünü göster
        nameInputSection.style.display = 'block';
        winnerNameInput.value = playerName === 'Misafir' ? '' : playerName;
        
        // Modalı göster
        winModal.classList.remove('hidden');
    }
}

/**
 * Leaderboard'a ekle
 * @param {number} totalScore - Oyuncunun toplam puanı
 */
function addToLeaderboard(totalScore) {
    // Yeni skoru ekle
    leaderboard.push({
        name: playerName,
        score: totalScore,
        moves: moves,
        time: (20 - timer) // Geçen süre
    });
    
    // Skorlara göre sırala (yüksekten düşüğe)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Sadece ilk 10 kaydı tut
    leaderboard = leaderboard.slice(0, 10);
    
    // LocalStorage'a kaydet
    localStorage.setItem('memoryGameLeaderboard', JSON.stringify(leaderboard));
    
    // Leaderboard'u güncelle
    showLeaderboard();
}

/**
 * Leaderboard'u göster
 */
function showLeaderboard() {
    // LocalStorage'dan leaderboard'u al
    const storedLeaderboard = localStorage.getItem('memoryGameLeaderboard');
    if (storedLeaderboard) {
        leaderboard = JSON.parse(storedLeaderboard);
    }
    
    // Leaderboard tablosunu güncelle
    leaderboardBody.innerHTML = '';
    
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${entry.moves}</td>
            <td>${entry.time}s</td>
        `;
        leaderboardBody.appendChild(row);
    });
    
    // Leaderboard modalını göster
    leaderboardModal.classList.remove('hidden');
}

/**
 * Olay dinleyicilerini kur
 */
function setupEventListeners() {
    // Reset butonu
    resetButton.addEventListener('click', startGame);
    
    // Tekrar oyna butonu
    playAgainButton.addEventListener('click', startGame);
    
    // Skoru kaydet butonu
    saveScoreButton.addEventListener('click', () => {
        const name = winnerNameInput.value.trim() || 'Misafir';
        playerName = name;
        displayName.textContent = playerName;
        
        // Skoru leaderboard'a ekle
        const totalScore = parseInt(finalScore.textContent);
        addToLeaderboard(totalScore);
        
        // Kullanıcı adı girişi bölümünü gizle
        nameInputSection.style.display = 'none';
    });
    
    // Enter tuşuyla skoru kaydet
    winnerNameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const name = winnerNameInput.value.trim() || 'Misafir';
            playerName = name;
            displayName.textContent = playerName;
            
            // Skoru leaderboard'a ekle
            const totalScore = parseInt(finalScore.textContent);
            addToLeaderboard(totalScore);
            
            // Kullanıcı adı girişi bölümünü gizle
            nameInputSection.style.display = 'none';
        }
    });
    
    // Leaderboard kapatma butonu
    closeLeaderboardButton.addEventListener('click', () => {
        leaderboardModal.classList.add('hidden');
    });
}

// Sayfa yüklendiğinde oyunu başlat
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showLeaderboard();
    startGame(); // Doğrudan oyunu başlat
});