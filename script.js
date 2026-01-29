// タイマーの状態管理
let totalSeconds = 300; // デフォルト5分（秒単位）
let remainingSeconds = totalSeconds;
let timerInterval = null;
let isRunning = false;
let isPaused = false;
let nextTimerCallback = null; // タイマー終了後の次のタイマーを開始するコールバック

// DOM要素の取得
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const resetBtn = document.getElementById('resetBtn');
const presetButtons = document.querySelectorAll('.preset-btn');
const sandTop = document.getElementById('sandTop');
const sandBottom = document.getElementById('sandBottom');
const addMinutesInput = document.getElementById('addMinutesInput');
const addSecondsInput = document.getElementById('addSecondsInput');
const addTimeBtn = document.getElementById('addTimeBtn');

// 時間表示の更新
function updateDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    minutesDisplay.textContent = String(minutes).padStart(2, '0');
    secondsDisplay.textContent = String(seconds).padStart(2, '0');
}

// 砂時計のアニメーション更新
function updateHourglass() {
    if (totalSeconds <= 0) return;
    const percentage = (remainingSeconds / totalSeconds) * 100;
    const topPercentage = Math.max(0, Math.min(100, percentage));
    const bottomPercentage = 100 - topPercentage;
    
    // 上部の砂：上から下に向かって減る（表面が下がる）
    // 上部の三角形の頂点から下に向かって切り取る
    // topPercentageが100%の時は完全に満たされ、0%の時は完全に空
    const topHeight = topPercentage / 100;
    if (topHeight > 0) {
        // 上部の三角形の頂点から下に向かって切り取る
        const clipTop = (1 - topHeight) * 100;
        sandTop.style.clipPath = `polygon(0 ${clipTop}%, 100% ${clipTop}%, 50% 100%)`;
        sandTop.style.opacity = '1';
    } else {
        sandTop.style.opacity = '0';
    }
    
    // 下部の砂：下から上に向かって積もる（円錐状の山が成長）
    // 下部の三角形の底辺から上に向かって増やす
    sandBottom.style.height = `${bottomPercentage}%`;
    
    // 下部の砂のclip-pathを調整して円錐状の山を作る
    if (bottomPercentage > 0) {
        // 下部の三角形の底辺から上に向かって増やす
        // 三角形の頂点（50% 0）から底辺（0 100%, 100% 100%）に向かって
        const bottomHeight = bottomPercentage / 100;
        const clipBottom = 100 - (bottomHeight * 100);
        sandBottom.style.clipPath = `polygon(50% ${clipBottom}%, 0 100%, 100% 100%)`;
        sandBottom.style.opacity = '1';
    } else {
        sandBottom.style.opacity = '0';
    }
    
    // 下部の砂が一定量以上溜まったら円錐状の山の表面を表示
    if (bottomPercentage > 15) {
        sandBottom.style.setProperty('--show-surface', '1');
    } else {
        sandBottom.style.setProperty('--show-surface', '0');
    }
}

function syncBaseInputsToTotalSeconds() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    minutesInput.value = String(minutes);
    secondsInput.value = String(seconds);
}

function addTime(secondsToAdd) {
    if (!isRunning) {
        alert('タイマー実行中のみ追加できます');
        return;
    }

    if (!Number.isFinite(secondsToAdd) || secondsToAdd <= 0) return;

    totalSeconds += secondsToAdd;
    remainingSeconds += secondsToAdd;

    // 追加後の「設定時間」も追従（リセット時に反映される）
    syncBaseInputsToTotalSeconds();

    updateDisplay();
    updateHourglass();
}

// タイマーの開始
function startTimer() {
    if (isRunning) return;
    
    // 入力値から時間を取得
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    totalSeconds = minutes * 60 + seconds;
    
    if (totalSeconds <= 0) {
        alert('時間を設定してください');
        return;
    }
    
    remainingSeconds = totalSeconds;
    isRunning = true;
    isPaused = false;
    
    updateDisplay();
    updateHourglass();
    
    // ボタンの状態を更新
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
    minutesInput.disabled = true;
    secondsInput.disabled = true;
    addTimeBtn.disabled = false;
    
    // タイマーの実行
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
        updateHourglass();
        
        if (remainingSeconds <= 0) {
            stopTimer();
            triggerAlarm();
            
            // 次のタイマーがある場合は自動的に開始
            if (nextTimerCallback) {
                const callback = nextTimerCallback;
                nextTimerCallback = null; // コールバックをクリア
                setTimeout(() => {
                    callback();
                }, 1000); // アラーム後に1秒待ってから次のタイマーを開始
            }
        }
    }, 1000);
}

// タイマーの一時停止
function pauseTimer() {
    if (!isRunning || isPaused) return;
    
    clearInterval(timerInterval);
    isPaused = true;
    
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
}

// タイマーの再開
function resumeTimer() {
    if (!isRunning || !isPaused) return;
    
    isPaused = false;
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
        updateHourglass();
        
        if (remainingSeconds <= 0) {
            stopTimer();
            triggerAlarm();
            
            // 次のタイマーがある場合は自動的に開始
            if (nextTimerCallback) {
                const callback = nextTimerCallback;
                nextTimerCallback = null; // コールバックをクリア
                setTimeout(() => {
                    callback();
                }, 1000); // アラーム後に1秒待ってから次のタイマーを開始
            }
        }
    }, 1000);
}

// タイマーの停止
function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    isPaused = false;
    
    // 次のタイマーが予定されていない場合のみボタン状態を更新
    if (!nextTimerCallback) {
        // ボタンの状態を更新
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        minutesInput.disabled = false;
        secondsInput.disabled = false;
        addTimeBtn.disabled = true;
    }
}

// タイマーのリセット
function resetTimer() {
    stopTimer();
    
    // 連続タイマーのコールバックをクリア
    nextTimerCallback = null;
    
    // 初期値に戻す
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    totalSeconds = minutes * 60 + seconds;
    remainingSeconds = totalSeconds;
    
    updateDisplay();
    updateHourglass();
}

// プリセット時間の設定
function setPresetTime(minutes) {
    if (isRunning) {
        alert('タイマーが実行中です。リセットしてから設定してください。');
        return;
    }
    
    // 通常のプリセットの場合は、連続タイマーのコールバックをクリア
    nextTimerCallback = null;
    
    minutesInput.value = minutes;
    secondsInput.value = 0;
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;
    
    updateDisplay();
    updateHourglass();
}

// 共有会プリセット（4分→2分の連続タイマー）
function setSharingMeetingPreset() {
    if (isRunning) {
        alert('タイマーが実行中です。リセットしてから設定してください。');
        return;
    }
    
    // 最初の4分タイマーを設定
    minutesInput.value = 4;
    secondsInput.value = 0;
    totalSeconds = 4 * 60;
    remainingSeconds = totalSeconds;
    
    // 4分終了後に2分のタイマーを自動開始するコールバックを設定
    nextTimerCallback = () => {
        // 2分のタイマーを設定して開始
        minutesInput.value = 2;
        secondsInput.value = 0;
        totalSeconds = 2 * 60;
        remainingSeconds = totalSeconds;
        
        updateDisplay();
        updateHourglass();
        
        // 自動的に2分のタイマーを開始
        isRunning = true;
        isPaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resumeBtn.disabled = true;
        minutesInput.disabled = true;
        secondsInput.disabled = true;
        addTimeBtn.disabled = false;
        
        timerInterval = setInterval(() => {
            remainingSeconds--;
            updateDisplay();
            updateHourglass();
            
            if (remainingSeconds <= 0) {
                stopTimer();
                triggerAlarm();
            }
        }, 1000);
    };
    
    updateDisplay();
    updateHourglass();
}

// アラーム機能
function triggerAlarm() {
    // ブラウザ通知
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('タイマー終了', {
            body: '設定した時間が経過しました！',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23f5576c"/></svg>'
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('タイマー終了', {
                    body: '設定した時間が経過しました！',
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23f5576c"/></svg>'
                });
            }
        });
    }
    
    // 音声アラーム（Web Audio API）
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // 3回繰り返し
        setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.frequency.value = 800;
            oscillator2.type = 'sine';
            gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.5);
        }, 600);
        
        setTimeout(() => {
            const oscillator3 = audioContext.createOscillator();
            const gainNode3 = audioContext.createGain();
            oscillator3.connect(gainNode3);
            gainNode3.connect(audioContext.destination);
            oscillator3.frequency.value = 800;
            oscillator3.type = 'sine';
            gainNode3.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator3.start(audioContext.currentTime);
            oscillator3.stop(audioContext.currentTime + 0.5);
        }, 1200);
    } catch (error) {
        console.error('音声アラームの再生に失敗しました:', error);
    }
    
    // 視覚的なフィードバック（画面を点滅）
    document.body.style.animation = 'flash 0.5s ease-in-out 3';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 1500);
}

// イベントリスナーの設定
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resumeBtn.addEventListener('click', resumeTimer);
resetBtn.addEventListener('click', resetTimer);
addTimeBtn.addEventListener('click', () => {
    const addMinutes = parseInt(addMinutesInput.value) || 0;
    const addSeconds = parseInt(addSecondsInput.value) || 0;
    const secondsToAdd = addMinutes * 60 + addSeconds;
    if (secondsToAdd <= 0) return;
    addTime(secondsToAdd);
});

// プリセットボタンのイベント
presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const minutes = parseInt(btn.getAttribute('data-minutes'));
        if (minutes !== null && !isNaN(minutes)) {
            setPresetTime(minutes);
        }
    });
});

// 共有会ボタンのイベント
const sharingMeetingBtn = document.getElementById('sharingMeetingBtn');
if (sharingMeetingBtn) {
    sharingMeetingBtn.addEventListener('click', () => {
        setSharingMeetingPreset();
    });
}

// 入力値の変更時に表示を更新
minutesInput.addEventListener('input', () => {
    if (!isRunning) {
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        totalSeconds = minutes * 60 + seconds;
        remainingSeconds = totalSeconds;
        updateDisplay();
        updateHourglass();
    }
});

secondsInput.addEventListener('input', () => {
    if (!isRunning) {
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        totalSeconds = minutes * 60 + seconds;
        remainingSeconds = totalSeconds;
        updateDisplay();
        updateHourglass();
    }
});

// 通知の許可をリクエスト（ページ読み込み時）
if ('Notification' in window && Notification.permission === 'default') {
    // ユーザーがボタンをクリックしたときに許可をリクエストする方が良いが、
    // ここでは自動的にリクエストしない（ユーザー体験のため）
}

// 初期表示
updateDisplay();
updateHourglass();

// 点滅アニメーション用のCSS（動的に追加）
const style = document.createElement('style');
style.textContent = `
    @keyframes flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;
document.head.appendChild(style);
