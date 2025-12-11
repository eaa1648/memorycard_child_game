// Oyun değişkenleri
let score = 0;
let timeLeft = 60;
let totalClicks = 0;
let hits = 0;
let gameActive = false;
let timerInterval;
let targets = []; // Çoklu hedefleri takip etmek için dizi
let targetIdCounter = 0; // Hedef ID'si için sayaç
let difficultyLevel = 1; // Zorluk seviyesi (hedef sayısı)
let targetLifetime = 2000; // Hedeflerin ekranda kalma süresi (ms)
let targetPool = []; // Yeniden kullanılabilir hedefler için havuz
let targetSize = 'medium'; // Hedef boyutu (small, medium, large)
let maxTargets = 4; // Maksimum aynı anda ekranda olabilecek hedef sayısı
let leaderboard = []; // Leaderboard verileri

// DOM elementleri
const gameContainer = document.getElementById('game-container');
const crosshair = document.getElementById('crosshair');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const accuracyDisplay = document.getElementById('accuracy');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const leaderboardButton = document.getElementById('leaderboard-button');
const gameOverModal = document.getElementById('game-over-modal');
const playerNameInput = document.getElementById('player-name');
const saveScoreButton = document.getElementById('save-score');
const playAgainButton = document.getElementById('play-again');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardBody = document.getElementById('leaderboard-body');
const closeLeaderboardButton = document.getElementById('close-leaderboard');

// Ayarlar elementleri
const targetSizeSelect = document.getElementById('target-size');
const targetLifetimeSelect = document.getElementById('target-lifetime');
const maxTargetsSelect = document.getElementById('max-targets');

// Olay dinleyicileri
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
leaderboardButton.addEventListener('click', showLeaderboard);
saveScoreButton.addEventListener('click', saveScore);
playAgainButton.addEventListener('click', resetGame);
closeLeaderboardButton.addEventListener('click', hideLeaderboard);

// Ayarlar değişiklik olayları
targetSizeSelect.addEventListener('change', updateSettings);
targetLifetimeSelect.addEventListener('change', updateSettings);
maxTargetsSelect.addEventListener('change', updateSettings);

// Oyun konteynerine tıklama olayı (ıskalama için)
gameContainer.addEventListener('click', handleMiss);

// Mouse hareketini takip et
gameContainer.addEventListener('mousemove', moveCrosshair);

// Ayarları güncelle
function updateSettings() {
    targetSize = targetSizeSelect.value;
    targetLifetime = parseInt(targetLifetimeSelect.value);
    maxTargets = parseInt(maxTargetsSelect.value);
}

// Crosshair'i mouse ile hareket ettir
function moveCrosshair(e) {
    // RequestAnimationFrame kullanarak daha akıcı hareket
    requestAnimationFrame(() => {
        const containerRect = gameContainer.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;
        
        // Crosshair'i mouse pozisyonuna yerleştir
        crosshair.style.left = `${x - 15}px`; // 15, crosshair genişliğinin yarısı
        crosshair.style.top = `${y - 15}px`; // 15, crosshair yüksekliğinin yarısı
    });
}

// Yeniden kullanılabilir hedef havuzu oluştur
function createTargetPool() {
    // Önceden oluşturulmuş hedefleri temizle
    targetPool = [];
    
    // 15 adet hedef oluştur (maksimum ihtiyaca göre)
    for (let i = 0; i < 15; i++) {
        const target = document.createElement('div');
        target.className = `target ${targetSize}`;
        target.style.display = 'none';
        target.addEventListener('click', handleTargetClick);
        gameContainer.appendChild(target);
        targetPool.push(target);
    }
}

// Boş bir hedef al
function getAvailableTarget() {
    // Gizli olan ilk hedefi bul
    const target = targetPool.find(t => t.style.display === 'none');
    return target || null;
}

// Hedef tıklama olayı
function handleTargetClick(e) {
    e.stopPropagation();
    const targetElement = e.currentTarget;
    
    // Sadece görünür hedeflere tepki ver
    if (targetElement.style.display !== 'none' && gameActive) {
        handleHit(targetElement);
    }
}

// Oyunu başlat
function startGame() {
    if (gameActive) return;
    
    // Ayarları güncelle
    updateSettings();
    
    // Değişkenleri sıfırla
    score = 0;
    timeLeft = 60;
    totalClicks = 0;
    hits = 0;
    gameActive = true;
    targets = [];
    targetIdCounter = 0;
    difficultyLevel = 1;
    
    // Hedef havuzunu oluştur
    createTargetPool();
    
    // Ekranı güncelle
    updateDisplays();
    
    // Buton durumlarını ayarla
    startButton.disabled = true;
    resetButton.disabled = false;
    
    // Crosshair'i göster
    crosshair.style.display = 'block';
    
    // Zamanlayıcıyı başlat
    timerInterval = setInterval(updateTimer, 1000);
    
    // İlk hedefleri oluştur
    createTargets();
}

// Oyunu sıfırla
function resetGame() {
    // Oyun aktifse durdur
    if (gameActive) {
        clearInterval(timerInterval);
        gameActive = false;
    }
    
    // Tüm hedefleri gizle
    targets.forEach(targetObj => {
        clearTimeout(targetObj.timeout);
        if (targetObj.element) {
            targetObj.element.style.display = 'none';
        }
    });
    targets = [];
    
    // Havuzdaki tüm hedefleri gizle
    targetPool.forEach(target => {
        target.style.display = 'none';
    });
    
    // Crosshair'i gizle
    crosshair.style.display = 'none';
    
    // Modalı kapat
    gameOverModal.style.display = 'none';
    leaderboardModal.style.display = 'none';
    
    // Değişkenleri sıfırla
    score = 0;
    timeLeft = 60;
    totalClicks = 0;
    hits = 0;
    difficultyLevel = 1;
    
    // Ekranı güncelle
    updateDisplays();
    
    // Buton durumlarını ayarla
    startButton.disabled = false;
    resetButton.disabled = false;
}

// Hedef oluştur
function createTarget() {
    // Maksimum hedef sayısına ulaşıldıysa yeni hedef oluşturma
    if (targets.length >= maxTargets) return null;
    
    if (!gameActive) return null;
    
    // Yeniden kullanılabilir bir hedef al
    const targetElement = getAvailableTarget();
    
    // Eğer müsait hedef yoksa çık
    if (!targetElement) return null;
    
    // Hedef boyutunu ayarla
    targetElement.className = `target ${targetSize}`;
    
    // Oyun alanının boyutlarını al
    const containerWidth = gameContainer.offsetWidth;
    const containerHeight = gameContainer.offsetHeight;
    
    // Hedef boyutuna göre boyut al
    let targetWidth, targetHeight;
    switch(targetSize) {
        case 'small':
            targetWidth = 50;
            targetHeight = 50;
            break;
        case 'medium':
            targetWidth = 70;
            targetHeight = 70;
            break;
        case 'large':
            targetWidth = 90;
            targetHeight = 90;
            break;
        default:
            targetWidth = 70;
            targetHeight = 70;
    }
    
    // Hedefin taşmaması için maksimum pozisyonları hesapla
    const maxX = containerWidth - targetWidth;
    const maxY = containerHeight - targetHeight;
    
    // Rastgele pozisyon hesapla
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    
    // Hedefi pozisyonlandır
    targetElement.style.left = `${x}px`;
    targetElement.style.top = `${y}px`;
    targetElement.style.display = 'block';
    
    // Hedef objesini oluştur
    const targetObj = {
        id: targetIdCounter++,
        element: targetElement,
        timeout: null
    };
    
    // Hedefi belirlenen sürede sonra otomatik olarak kaldır
    targetObj.timeout = setTimeout(() => {
        removeTarget(targetObj);
    }, targetLifetime);
    
    // Hedefi diziye ekle
    targets.push(targetObj);
    
    return targetObj;
}

// Hedefleri oluştur (zorluk seviyesine göre)
function createTargets() {
    if (!gameActive) return;
    
    // Maksimum hedef sayısını aşmayacak şekilde hedef oluştur
    const targetsToCreate = Math.min(difficultyLevel, maxTargets - targets.length);
    
    // Hedef oluştur
    for (let i = 0; i < targetsToCreate; i++) {
        createTarget();
    }
}

// Hedefi kaldır
function removeTarget(targetObj) {
    // Hedefi diziden çıkar
    const index = targets.findIndex(t => t.id === targetObj.id);
    if (index !== -1) {
        targets.splice(index, 1);
    }
    
    // Hedefi gizle (DOM'dan kaldırmak yerine)
    if (targetObj.element) {
        targetObj.element.style.display = 'none';
    }
    
    // Timeout'u temizle
    clearTimeout(targetObj.timeout);
}

// Vuruş işlemini yönet
function handleHit(targetElement) {
    // Oyun aktif değilse işlem yapma
    if (!gameActive) return;
    
    // Hedef objesini bul
    const targetObj = targets.find(t => t.element === targetElement);
    if (!targetObj) return;
    
    // İstatistikleri güncelle
    score++;
    hits++;
    totalClicks++;
    
    // Hedefi kaldır
    removeTarget(targetObj);
    
    // Ekranı güncelle
    updateDisplays();
    
    // Yeni bir hedef oluştur
    createTarget();
}

// Iskalama işlemini yönet
function handleMiss() {
    // Oyun aktif değilse işlem yapma
    if (!gameActive) return;
    
    // İstatistikleri güncelle (sadece toplam tıklama)
    totalClicks++;
    
    // Ekranı güncelle
    updateDisplays();
}

// Zamanlayıcıyı güncelle
function updateTimer() {
    timeLeft--;
    
    // Ekranı güncelle
    updateDisplays();
    
    // Zorluk seviyesini artır (her 5 saniyede bir)
    if ((60 - timeLeft) % 5 === 0 && timeLeft < 60 && timeLeft > 0) {
        difficultyLevel = Math.min(difficultyLevel + 1, maxTargets); // Maksimum hedef sayısına kadar
    }
    
    // Yeni hedefler oluştur
    createTargets();
    
    // Süre bittiyse oyunu bitir
    if (timeLeft <= 0) {
        endGame();
    }
}

// Ekranı güncelle
function updateDisplays() {
    // Skor ve süreyi güncelle
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    
    // Doğruluk oranını hesapla ve göster
    const accuracy = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 100;
    accuracyDisplay.textContent = `${accuracy}%`;
}

// Oyunu bitir
function endGame() {
    // Oyunu devre dışı bırak
    gameActive = false;
    
    // Zamanlayıcıyı durdur
    clearInterval(timerInterval);
    
    // Tüm hedefleri gizle
    targets.forEach(targetObj => {
        clearTimeout(targetObj.timeout);
        if (targetObj.element) {
            targetObj.element.style.display = 'none';
        }
    });
    targets = [];
    
    // Crosshair'i gizle
    crosshair.style.display = 'none';
    
    // Modal istatistiklerini güncelle
    document.getElementById('modal-score').textContent = score;
    const accuracy = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 100;
    document.getElementById('modal-accuracy').textContent = `${accuracy}%`;
    document.getElementById('modal-hits').textContent = hits;
    
    // Oyuncu adı alanını temizle
    playerNameInput.value = '';
    
    // Modalı göster
    gameOverModal.style.display = 'flex';
    
    // Buton durumlarını ayarla
    startButton.disabled = false;
    resetButton.disabled = false;
}

// Skoru kaydet
function saveScore() {
    const playerName = playerNameInput.value.trim() || 'Misafir';
    const accuracy = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 0;
    
    // Yeni skor objesi oluştur
    const newScore = {
        name: playerName,
        score: score,
        accuracy: accuracy,
        hits: hits,
        date: new Date().toLocaleDateString('tr-TR')
    };
    
    // Leaderboard'a ekle
    addToLeaderboard(newScore);
    
    // Modalı kapat
    gameOverModal.style.display = 'none';
}

// Leaderboard'a ekle
function addToLeaderboard(newScore) {
    // LocalStorage'dan mevcut leaderboard'u al
    const storedLeaderboard = localStorage.getItem('aimTrainerLeaderboard');
    if (storedLeaderboard) {
        leaderboard = JSON.parse(storedLeaderboard);
    }
    
    // Yeni skoru ekle
    leaderboard.push(newScore);
    
    // Skorlara göre sırala (yüksekten düşüğe)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Sadece ilk 10 kaydı tut
    leaderboard = leaderboard.slice(0, 10);
    
    // LocalStorage'a kaydet
    localStorage.setItem('aimTrainerLeaderboard', JSON.stringify(leaderboard));
}

// Leaderboard'u göster
function showLeaderboard() {
    // LocalStorage'dan leaderboard'u al
    const storedLeaderboard = localStorage.getItem('aimTrainerLeaderboard');
    if (storedLeaderboard) {
        leaderboard = JSON.parse(storedLeaderboard);
    }
    
    // Leaderboard tablosunu güncelle
    leaderboardBody.innerHTML = '';
    
    if (leaderboard.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="5">Henüz skor yok</td></tr>';
    } else {
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
                <td>${entry.accuracy}%</td>
                <td>${entry.hits}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    }
    
    // Leaderboard modalını göster
    leaderboardModal.style.display = 'flex';
}

// Leaderboard'u gizle
function hideLeaderboard() {
    leaderboardModal.style.display = 'none';
}

// Sayfa yüklendiğinde çalışacak kod
document.addEventListener('DOMContentLoaded', () => {
    // Başlangıçta buton durumlarını ayarla
    resetButton.disabled = true;
    
    // Crosshair'i gizle
    crosshair.style.display = 'none';
    
    // Enter tuşuyla skoru kaydet
    playerNameInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            saveScore();
        }
    });
});