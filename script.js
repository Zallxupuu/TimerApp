const mainTimer = document.getElementById('main-timer');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const btnFullscreen = document.getElementById('btn-fullscreen');
const presetButtons = document.querySelectorAll('.btn-preset');
const alarmSound = document.getElementById('alarm-sound');

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

function saveState() {
    localStorage.setItem('timeKeeperState', JSON.stringify({
        timeLeft,
        defaultTime,
        isRunning,
        timestamp: Date.now()
    }));
}

function updateDisplay() {
    mainTimer.textContent = formatTime(timeLeft);
    if (timeLeft <= 10 && timeLeft > 0) {
        mainTimer.classList.add('danger');
    } else {
        mainTimer.classList.remove('danger');
    }
}

function tick() {
    timeLeft--;
    updateDisplay();
    saveState();
    
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        btnStart.style.display = 'flex';
        btnPause.style.display = 'none';
        saveState();
        playAlarm();
        document.body.classList.add('times-up');
    }
}

function startTimer() {
    if (timeLeft <= 0) return;
    document.body.classList.remove('times-up');
    if (!isRunning) {
        isRunning = true;
        btnStart.style.display = 'none';
        btnPause.style.display = 'flex';
        saveState();
        
        timerInterval = setInterval(tick, 1000);
    }
}

function pauseTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        btnStart.style.display = 'flex';
        btnPause.style.display = 'none';
        saveState();
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = defaultTime;
    updateDisplay();
    btnStart.style.display = 'flex';
    btnPause.style.display = 'none';
    saveState();
    document.body.classList.remove('times-up');
}

function setTimer(totalSeconds) {
    clearInterval(timerInterval);
    isRunning = false;
    defaultTime = totalSeconds;
    timeLeft = defaultTime;
    updateDisplay();
    
    btnStart.style.display = 'flex';
    btnPause.style.display = 'none';
    
    saveState();
    closeModal();
    document.body.classList.remove('times-up');
}

btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);

function openModal() {
    settingsModal.style.display = 'flex';
}

function closeModal() {
    settingsModal.style.display = 'none';
}

btnOpenSettings.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal();
});

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

if (window.matchMedia('(display-mode: standalone)').matches) {
    if(btnInstall) btnInstall.style.display = 'none';
}

// --- Restore State Logic ---
function loadState() {
    const saved = localStorage.getItem('timeKeeperState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            defaultTime = state.defaultTime || (10 * 60);
            
            if (state.isRunning) {
                const passedSeconds = Math.floor((Date.now() - state.timestamp) / 1000);
                timeLeft = state.timeLeft - passedSeconds;
                
                if (timeLeft > 0) {
                    updateDisplay();
                    startTimer(); // Resume automatically
                } else {
                    timeLeft = 0;
                    isRunning = false;
                    updateDisplay();
                }
            } else {
                timeLeft = state.timeLeft;
                isRunning = false;
                updateDisplay();
                btnStart.style.display = 'flex';
                btnPause.style.display = 'none';
            }
        } catch (e) {
            console.error("Failed to load state", e);
            updateDisplay();
        }
    } else {
        updateDisplay();
    }
}

// Init
loadState();
