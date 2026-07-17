const mainTimer = document.getElementById('main-timer');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const btnFullscreen = document.getElementById('btn-fullscreen');
const presetButtons = document.querySelectorAll('.btn-preset');
const alarmSound = document.getElementById('alarm-sound');

// Modal & Settings Elements
const btnOpenSettings = document.getElementById('btn-open-settings');
const btnCloseModal = document.getElementById('btn-close-modal');
const settingsModal = document.getElementById('settings-modal');
const inputMin = document.getElementById('input-min');
const inputSec = document.getElementById('input-sec');
const btnSetManual = document.getElementById('btn-set-manual');

alarmSound.volume = 0.5;
function playAlarm() {
    alarmSound.currentTime = 0;
    alarmSound.play().catch(e => console.log(e));
}

let timerInterval;
let defaultTime = 10 * 60;
let timeLeft = defaultTime;
let isRunning = false;

function formatTime(totalSeconds) {
    if (totalSeconds < 0) totalSeconds = 0;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    mainTimer.textContent = formatTime(timeLeft);
    if (timeLeft <= 10 && timeLeft > 0) {
        mainTimer.classList.add('danger');
    } else {
        mainTimer.classList.remove('danger');
    }
}

function openModal() {
    settingsModal.style.display = 'flex';
}

function closeModal() {
    settingsModal.style.display = 'none';
}

function setTimer(totalSeconds) {
    clearInterval(timerInterval);
    isRunning = false;
    defaultTime = totalSeconds;
    timeLeft = defaultTime;
    updateDisplay();
    
    btnStart.style.display = 'flex';
    btnPause.style.display = 'none';
    closeModal(); // Auto-close modal after setting
}

// --- Main Controls ---

btnStart.addEventListener('click', () => {
    if (timeLeft <= 0) return;
    if (!isRunning) {
        isRunning = true;
        btnStart.style.display = 'none';
        btnPause.style.display = 'flex';
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                btnStart.style.display = 'flex';
                btnPause.style.display = 'none';
                playAlarm();
            }
        }, 1000);
    }
});

btnPause.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        btnStart.style.display = 'flex';
        btnPause.style.display = 'none';
    }
});

btnReset.addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = defaultTime;
    updateDisplay();
    btnStart.style.display = 'flex';
    btnPause.style.display = 'none';
});

// --- Modal Controls ---
btnOpenSettings.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal();
});

// --- Setting Time ---

presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const mins = parseInt(btn.getAttribute('data-time'));
        setTimer(mins * 60);
    });
});

btnSetManual.addEventListener('click', () => {
    let mins = parseInt(inputMin.value) || 0;
    let secs = parseInt(inputSec.value) || 0;
    
    if (mins < 0) mins = 0;
    if (secs < 0) secs = 0;
    if (secs > 59) {
        mins += Math.floor(secs / 60);
        secs = secs % 60;
    }
    
    if (mins === 0 && secs === 0) return; 
    
    setTimer((mins * 60) + secs);
    
    inputMin.value = '';
    inputSec.value = '';
});

// --- Fullscreen ---

btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
});

// --- PWA Install Logic ---
let deferredPrompt;
const btnInstall = document.getElementById('btn-install');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstall.style.display = 'flex';
});

btnInstall.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            btnInstall.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

// Hide install button if already in standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
    btnInstall.style.display = 'none';
}

// Init
updateDisplay();
