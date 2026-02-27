// Game Variables
let globalTimerInterval;

const gameState = {
    studentName: "",
    totalQuestions: 30,
    score: 0,
    currentIndex: 1,
    correctCount: 0,
    wrongCount: 0,
    correctStreak: 0,
    wrongStreak: 0,
    bestCorrectStreak: 0,
    bestWrongStreak: 0,
    questionsLog: [],
    questionTimes: [],
    correctByNumber: Array(10).fill(0),
    wrongByNumber: Array(10).fill(0),
    quizStartTimestamp: 0,
    quizEndTimestamp: 0,
    timeExpired: false,
    globalTimeLeft: 240, // 4 minutes

    // Active Question State
    currentEquation: {},
    previousEquation: { a: 0, b: 0 },
    isAnswering: false,
    questionStartTime: 0
};

// DOM Elements
const screenWelcome = document.getElementById('welcome-screen');
const screenQuiz = document.getElementById('quiz-screen');
const screenResult = document.getElementById('result-screen');

const studentNameInput = document.getElementById('student-name');
const nameErrorEl = document.getElementById('name-error');

const studentDisplayEl = document.getElementById('student-display');
const globalTimerDisplayEl = document.getElementById('global-timer-display');
const qCounterEl = document.getElementById('q-counter');
const scoreDisplayEl = document.getElementById('score-display');
const multiplierDisplayEl = document.getElementById('multiplier-display');
const streakBannerEl = document.getElementById('streak-banner');
const equationEl = document.getElementById('equation');
const optionsGridEl = document.getElementById('options-grid');
const shortAnswerContainer = document.getElementById('short-answer-container');
const shortAnswerInput = document.getElementById('short-answer-input');
const btnSubmitAnswer = document.getElementById('btn-submit-answer');
const feedbackMsgEl = document.getElementById('feedback-msg');

const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');

btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', restartToWelcome);
btnSubmitAnswer.addEventListener('click', handleShortAnswerSubmit);
shortAnswerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleShortAnswerSubmit();
});

function switchScreen(screenToShow) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screenToShow.classList.add('active');
}

function restartToWelcome() {
    studentNameInput.value = '';
    gameState.studentName = '';

    // Reset Game State for new run
    gameState.score = 0;
    gameState.currentIndex = 1;
    gameState.correctCount = 0;
    gameState.wrongCount = 0;
    gameState.correctStreak = 0;
    gameState.wrongStreak = 0;
    gameState.bestCorrectStreak = 0;
    gameState.bestWrongStreak = 0;
    gameState.questionsLog = [];
    gameState.questionTimes = [];
    gameState.correctByNumber = Array(10).fill(0);
    gameState.wrongByNumber = Array(10).fill(0);
    gameState.timeExpired = false;
    gameState.globalTimeLeft = 240;
    gameState.previousEquation = { a: 0, b: 0 };

    switchScreen(screenWelcome);
}

function startGame(e) {
    if (e && e.target.id === 'btn-start') {
        const nameVal = studentNameInput.value.trim();
        if (!nameVal) {
            nameErrorEl.innerText = 'Lütfen adını yaz.';
            nameErrorEl.classList.add('show');
            studentNameInput.focus();
            return;
        }
        gameState.studentName = nameVal;
        nameErrorEl.classList.remove('show');
    }

    clearInterval(globalTimerInterval);
    updateGlobalTimerUI();

    studentDisplayEl.innerText = gameState.studentName;
    updateScoreUI();

    gameState.quizStartTimestamp = Date.now();
    switchScreen(screenQuiz);

    globalTimerInterval = setInterval(handleGlobalTimer, 1000);
    nextQuestion();
}

function handleGlobalTimer() {
    gameState.globalTimeLeft--;
    updateGlobalTimerUI();

    if (gameState.globalTimeLeft <= 0) {
        clearInterval(globalTimerInterval);
        gameState.timeExpired = true;
        endGame();
    }
}

function updateGlobalTimerUI() {
    const minutes = Math.floor(gameState.globalTimeLeft / 60);
    const seconds = gameState.globalTimeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    globalTimerDisplayEl.innerText = formattedTime;

    if (gameState.globalTimeLeft < 60) {
        globalTimerDisplayEl.classList.add('warning');
    } else {
        globalTimerDisplayEl.classList.remove('warning');
    }
}

function nextQuestion() {
    if (gameState.currentIndex > gameState.totalQuestions) {
        endGame();
        return;
    }

    gameState.isAnswering = false;

    qCounterEl.innerText = `${gameState.currentIndex}/${gameState.totalQuestions}`;
    feedbackMsgEl.className = 'feedback-msg';
    feedbackMsgEl.innerText = '';

    screenQuiz.classList.remove('flash-green-bg', 'flash-red-bg');

    generateEquation();

    if (gameState.currentIndex % 3 === 0) {
        optionsGridEl.style.display = 'none';
        shortAnswerContainer.style.display = 'flex';
        shortAnswerInput.value = '';
        setTimeout(() => shortAnswerInput.focus(), 100);
    } else {
        optionsGridEl.style.display = 'grid';
        shortAnswerContainer.style.display = 'none';
        renderOptions();
    }

    gameState.questionStartTime = Date.now();
}

function generateEquation() {
    let a, b;
    do {
        a = Math.floor(Math.random() * 9) + 1; // 1 to 9
        b = Math.floor(Math.random() * 9) + 1; // 1 to 9
    } while (a === gameState.previousEquation.a && b === gameState.previousEquation.b);

    gameState.previousEquation = { a, b };
    const answer = a * b;
    gameState.currentEquation = { a, b, answer };
    equationEl.innerText = `${a} × ${b} = ?`;
}

function renderOptions() {
    optionsGridEl.innerHTML = '';
    const { a, b, answer } = gameState.currentEquation;

    let options = [answer];
    while (options.length < 4) {
        let distractor;
        const strategy = Math.floor(Math.random() * 3);
        if (strategy === 0) {
            const offset = Math.random() > 0.5 ? 1 : -1;
            distractor = (a + offset) * b;
        } else if (strategy === 1) {
            const offset = Math.random() > 0.5 ? 1 : -1;
            distractor = a * (b + offset);
        } else {
            const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
            distractor = answer + offset;
        }

        if (distractor > 0 && !options.includes(distractor)) {
            options.push(distractor);
        }
    }

    options = options.sort(() => Math.random() - 0.5);

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.dataset.answer = opt;
        btn.addEventListener('click', () => processAnswer(opt, btn));
        optionsGridEl.appendChild(btn);
    });
}

function handleShortAnswerSubmit() {
    if (gameState.isAnswering) return;
    const val = parseInt(shortAnswerInput.value);
    if (isNaN(val)) return;
    processAnswer(val, null);
}

function processAnswer(userAnswer, btnElement) {
    if (gameState.isAnswering) return;
    gameState.isAnswering = true;

    const timeSpent = (Date.now() - gameState.questionStartTime) / 1000;
    const { a, b, answer } = gameState.currentEquation;
    const isCorrect = userAnswer === answer;

    // Log analytics
    gameState.questionsLog.push({
        index: gameState.currentIndex,
        a, b,
        type: btnElement ? 'multiple' : 'short',
        correctAnswer: answer,
        studentAnswer: userAnswer,
        isCorrect,
        timeSpentSeconds: timeSpent
    });
    gameState.questionTimes.push(timeSpent);

    let feedbackText = '';
    screenQuiz.classList.remove('flash-green-bg', 'flash-red-bg');
    void screenQuiz.offsetWidth;

    if (isCorrect) {
        gameState.correctCount++;
        gameState.correctStreak++;
        gameState.wrongStreak = 0;
        if (gameState.correctStreak > gameState.bestCorrectStreak) gameState.bestCorrectStreak = gameState.correctStreak;

        gameState.correctByNumber[a]++;
        gameState.correctByNumber[b]++;

        if (btnElement) btnElement.classList.add('correct');
        else shortAnswerInput.style.borderColor = 'var(--correct-color)';

        screenQuiz.classList.add('flash-green-bg');

        gameState.score += 10;
        feedbackText = 'Doğru! +10';

        if (gameState.correctStreak === 12) {
            gameState.score += 40;
            triggerBonusAnim(`${gameState.studentName}, muazzamsın! +40 Bonus!`);
        } else if (gameState.correctStreak === 4) {
            gameState.score += 15;
            triggerBonusAnim(`${gameState.studentName}, seri gidiyorsun! +15 Bonus!`);
        } else {
            showFeedback(feedbackText, true);
        }
    } else {
        gameState.wrongCount++;
        gameState.correctStreak = 0;
        gameState.wrongStreak++;
        if (gameState.wrongStreak > gameState.bestWrongStreak) gameState.bestWrongStreak = gameState.wrongStreak;

        gameState.wrongByNumber[a]++;
        gameState.wrongByNumber[b]++;

        if (btnElement) btnElement.classList.add('wrong');
        else shortAnswerInput.style.borderColor = 'var(--wrong-color)';

        screenQuiz.classList.add('flash-red-bg');

        if (gameState.wrongStreak >= 4) {
            gameState.score = 0;
            gameState.wrongStreak = 0;
            showFeedback('4 Yanlış! Puan Sıfırlandı.', false);
        } else {
            gameState.score -= 3;
            if (gameState.score < 0) gameState.score = 0;

            if (btnElement) {
                const buttons = optionsGridEl.querySelectorAll('.option-btn');
                buttons.forEach(btn => {
                    if (parseInt(btn.dataset.answer) === answer) {
                        btn.classList.add('correct');
                    }
                });
            } else {
                shortAnswerInput.value = answer;
                shortAnswerInput.style.color = 'var(--correct-color)';
            }
            showFeedback('Yanlış! -3 Puan.', false);
        }
    }

    updateScoreUI();

    setTimeout(() => {
        if (!btnElement) {
            shortAnswerInput.style.borderColor = '';
            shortAnswerInput.style.color = '';
        }
        gameState.currentIndex++;
        nextQuestion();
    }, 1500);
}

function showFeedback(text, isGood) {
    feedbackMsgEl.innerText = text;
    feedbackMsgEl.className = `feedback-msg show ${isGood ? 'good' : 'bad'}`;
}

function triggerBonusAnim(text) {
    showFeedback(text, true);
    streakBannerEl.classList.add('visible');
    multiplierDisplayEl.innerText = text;
    multiplierDisplayEl.classList.remove('bonus-anim-text');
    void multiplierDisplayEl.offsetWidth;
    multiplierDisplayEl.classList.add('bonus-anim-text');

    setTimeout(() => {
        streakBannerEl.classList.remove('visible');
    }, 2000);
}

function updateScoreUI() {
    scoreDisplayEl.innerText = gameState.score;
}

function endGame() {
    clearInterval(globalTimerInterval);
    gameState.quizEndTimestamp = Date.now();
    switchScreen(screenResult);

    console.log("RESULT STATE", {
        score: gameState.score,
        correct: gameState.correctCount,
        wrong: gameState.wrongCount,
        totalAnswered: gameState.questionsLog.length
    });

    // Query on-demand
    const finalStudentNameEl = document.getElementById('final-student-name');
    const timeExpiredNoteEl = document.getElementById('time-expired-note');
    const finalScoreEl = document.getElementById('final-score');
    const finalCorrectEl = document.getElementById('final-correct');
    const finalStreakEl = document.getElementById('final-streak');
    const finalTimeEl = document.getElementById('final-time');
    const finalAvgTimeEl = document.getElementById('final-avg-time');
    const speedLabelEl = document.getElementById('speed-label');

    // Defensive check
    if (!finalScoreEl || !finalCorrectEl || !finalStreakEl || !finalTimeEl || !finalAvgTimeEl) {
        console.error("EndGame Missing DOM Elements:", {
            finalScoreEl, finalCorrectEl, finalStreakEl, finalTimeEl, finalAvgTimeEl
        });
        return; // Halt if page structure is broken
    }

    if (finalStudentNameEl) finalStudentNameEl.innerText = gameState.studentName;
    if (timeExpiredNoteEl) timeExpiredNoteEl.style.display = gameState.timeExpired ? 'block' : 'none';

    const tMins = Math.floor(gameState.globalTimeLeft / 60);
    const tSecs = gameState.globalTimeLeft % 60;

    // total time used
    const totalTimeUsedSeconds = Math.round((gameState.quizEndTimestamp - gameState.quizStartTimestamp) / 1000) || 0;

    const totalAnswered = gameState.questionsLog.length;
    const avgTime = totalAnswered > 0 ? totalTimeUsedSeconds / totalAnswered : 0;
    const accuracy = totalAnswered > 0 ? Math.round((gameState.correctCount / totalAnswered) * 100) : 0;

    let speedText = "Sakin ve dikkatli";
    if (totalAnswered > 0) {
        if (avgTime <= 4) speedText = "Çok Hızlı";
        else if (avgTime <= 7) speedText = "İyi Tempo";
        else if (avgTime <= 10) speedText = "Dengeli";
    }

    // Identify weak/strong multipliers (index 1 to 9)
    let wrongIndices = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let correctIndices = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    wrongIndices.sort((a, b) => gameState.wrongByNumber[b] - gameState.wrongByNumber[a]);
    let topWrong = wrongIndices.filter(k => gameState.wrongByNumber[k] > 0).slice(0, 2);

    correctIndices.sort((a, b) => gameState.correctByNumber[b] - gameState.correctByNumber[a]);
    let topCorrect = correctIndices.filter(k => gameState.correctByNumber[k] > 0).slice(0, 2);

    let strengthMsg = "Elinden geleni en iyi şekilde yapmaya çalışıyorsun.";
    if (accuracy >= 80 && totalAnswered > 5) strengthMsg = "Doğruluk oranın gerçekten muazzam.";
    else if (gameState.bestCorrectStreak >= 6) strengthMsg = "Seri yakalama konusunda harikasın.";
    else if (avgTime < 6 && totalAnswered > 5) strengthMsg = "Cevaplama hızın inanılmaz derecede iyi.";

    let growthMsg = "";
    let nextStepMsg = "Yarın 5 dakika genel pratik + 10 soru!";

    if (topWrong.length > 0) {
        growthMsg = ` Sadece ${topWrong.join(' ve ')}ler çarpımında biraz daha pratiğe ihtiyacın var gibi duruyor.`;
        nextStepMsg = `Yarın 5 dakika: ${topWrong.join(' ve ')}ler çarpım tablosu + 10 soru!`;
    }

    const motivationalBoxEl = document.getElementById('motivational-message');
    if (motivationalBoxEl) {
        motivationalBoxEl.innerText = `${gameState.studentName}, ${strengthMsg}${growthMsg}\n\n${nextStepMsg}`;
    }

    // Final UI Binds
    finalScoreEl.innerText = gameState.score;
    finalCorrectEl.innerText = `${gameState.correctCount}/${gameState.totalQuestions}`;
    finalStreakEl.innerText = gameState.bestCorrectStreak;

    const tUsedMins = Math.floor(totalTimeUsedSeconds / 60);
    const tUsedSecs = totalTimeUsedSeconds % 60;
    finalTimeEl.innerText = `${String(tUsedMins).padStart(2, '0')}:${String(tUsedSecs).padStart(2, '0')}`;
    finalAvgTimeEl.innerText = `${avgTime.toFixed(1)}s`;
    speedLabelEl.innerText = speedText;

    if (window.confetti && accuracy >= 50) {
        triggerConfettiRain();
    }
}

function triggerConfettiRain() {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
        if (!document.getElementById('result-screen').classList.contains('active')) return;
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#2563eb', '#f97316', '#22c55e'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#2563eb', '#f97316', '#22c55e'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}
