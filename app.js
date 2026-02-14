// Configuration
const CONFIG = {
    // Replace this with your deployed Google Apps Script URL
    SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
};

// Global State
let currentTest = null;
let studentData = null;
let answers = {};
let timerInterval = null;
let timeRemaining = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTests();
    setupWhatsAppMask();
    checkRoute();
});

// Navigation
function showLanding() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('landing-page').classList.add('active');
    clearTimer();
}

function showTestPage() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('test-page').classList.add('active');
}

function showAdminPage() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('admin-page').classList.add('active');
}

function scrollToTests() {
    document.getElementById('test-selection').scrollIntoView({ behavior: 'smooth' });
}

function checkRoute() {
    // Hidden admin route - only accessible via #keregemanager
    if (window.location.hash === '#keregemanager') {
        showAdminPage();
    } else {
        // Ensure we're on landing page if not admin route
        if (!window.location.hash || window.location.hash === '#') {
            showLanding();
        }
    }
}

// Load Tests
async function loadTests() {
    try {
        const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getTests`);
        const data = await response.json();

        if (data.success) {
            displayTests(data.tests);
        } else {
            displayTestsError();
        }
    } catch (error) {
        console.error('Error loading tests:', error);
        displayTestsError();
    }
}

function displayTests(tests) {
    const testsContainer = document.getElementById('tests-list');

    if (!tests || tests.length === 0) {
        testsContainer.innerHTML = '<div class="test-card"><p>Тесты скоро появятся</p></div>';
        return;
    }

    testsContainer.innerHTML = tests.map(test => `
        <div class="test-card" onclick="selectTest('${test.id}')">
            <h3>${test.name}</h3>
            <p>${test.language === 'RU' ? 'Русский' : 'Кыргызский'}</p>
            <p>${test.duration} минут</p>
        </div>
    `).join('');
}

function displayTestsError() {
    const testsContainer = document.getElementById('tests-list');
    testsContainer.innerHTML = `
        <div class="test-card">
            <p>Ошибка загрузки тестов. Пожалуйста, обновите страницу.</p>
        </div>
    `;
}

// Test Selection
async function selectTest(testId) {
    try {
        const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getTest&id=${testId}`);
        const data = await response.json();

        if (data.success) {
            currentTest = data.test;
            openLeadForm();
        } else {
            alert('Ошибка загрузки теста');
        }
    } catch (error) {
        console.error('Error selecting test:', error);
        alert('Ошибка загрузки теста');
    }
}

// Lead Form
function openLeadForm() {
    document.getElementById('lead-modal').classList.add('active');
}

function closeLeadForm() {
    document.getElementById('lead-modal').classList.remove('active');
}

function setupWhatsAppMask() {
    const whatsappInput = document.getElementById('whatsapp');

    whatsappInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');

        if (!value.startsWith('996')) {
            value = '996' + value;
        }

        value = value.substring(0, 12);

        let formatted = '+996';
        if (value.length > 3) {
            formatted += ' ' + value.substring(3, 6);
        }
        if (value.length > 6) {
            formatted += ' ' + value.substring(6, 8);
        }
        if (value.length > 8) {
            formatted += ' ' + value.substring(8, 10);
        }
        if (value.length > 10) {
            formatted += ' ' + value.substring(10, 12);
        }

        e.target.value = formatted;
    });
}

function submitLeadForm(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const whatsapp = document.getElementById('whatsapp').value.replace(/\D/g, '');

    if (whatsapp.length !== 12) {
        alert('Пожалуйста, введите корректный номер WhatsApp');
        return;
    }

    studentData = {
        firstName,
        lastName,
        whatsapp: '+' + whatsapp
    };

    closeLeadForm();
    startTest();
}

// Test Interface
function startTest() {
    if (!currentTest || !studentData) {
        alert('Ошибка: данные теста или студента не найдены');
        return;
    }

    // Reset state
    answers = {};

    // Set test image
    document.getElementById('test-image').src = currentTest.photoUrl;
    document.getElementById('zoomed-image').src = currentTest.photoUrl;
    document.getElementById('test-title').textContent = currentTest.name;

    // Generate answer grid
    generateAnswerGrid(currentTest.answerKey.length);

    // Start timer
    startTimer(currentTest.duration);

    // Show test page
    showTestPage();
}

function generateAnswerGrid(questionCount) {
    const grid = document.getElementById('answer-grid');
    const options = ['A', 'B', 'C', 'D', 'E'];

    grid.innerHTML = '';

    for (let i = 1; i <= questionCount; i++) {
        const row = document.createElement('div');
        row.className = 'answer-row';

        const questionNum = document.createElement('div');
        questionNum.className = 'question-number';
        questionNum.textContent = i + '.';

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'answer-options';

        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = option;
            btn.onclick = () => selectAnswer(i, option);
            btn.dataset.question = i;
            btn.dataset.option = option;
            optionsDiv.appendChild(btn);
        });

        row.appendChild(questionNum);
        row.appendChild(optionsDiv);
        grid.appendChild(row);
    }
}

function selectAnswer(questionNum, option) {
    // Remove previous selection for this question
    const buttons = document.querySelectorAll(`[data-question="${questionNum}"]`);
    buttons.forEach(btn => btn.classList.remove('selected'));

    // Add selection to clicked button
    const selectedBtn = document.querySelector(`[data-question="${questionNum}"][data-option="${option}"]`);
    selectedBtn.classList.add('selected');

    // Store answer
    answers[questionNum] = option;
}

// Timer
function startTimer(minutes) {
    timeRemaining = minutes * 60;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearTimer();
            submitTest();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timer').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function clearTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Image Zoom
function zoomImage() {
    document.getElementById('image-modal').classList.add('active');
}

function closeZoom() {
    document.getElementById('image-modal').classList.remove('active');
}

// Submit Test
async function submitTest() {
    clearTimer();

    // Calculate score
    const results = calculateScore();

    // Prepare submission data
    const submission = {
        ...studentData,
        testName: currentTest.name,
        testId: currentTest.id,
        score: results.score,
        correctAnswers: results.correct,
        totalQuestions: currentTest.answerKey.length,
        answers: answers,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'submitResult',
                data: submission
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccessModal();
        } else {
            alert('Ошибка отправки результатов. Пожалуйста, свяжитесь с поддержкой.');
        }
    } catch (error) {
        console.error('Error submitting test:', error);
        alert('Ошибка отправки результатов. Пожалуйста, свяжитесь с поддержкой.');
    }
}

function calculateScore() {
    const answerKey = currentTest.answerKey;
    let correct = 0;

    for (let i = 1; i <= answerKey.length; i++) {
        if (answers[i] === answerKey[i - 1]) {
            correct++;
        }
    }

    // ORT scoring: typically 140 points base + (correct/total * 60)
    const score = Math.round(140 + (correct / answerKey.length) * 60);

    return {
        score,
        correct
    };
}

// Success Modal
function showSuccessModal() {
    document.getElementById('success-modal').classList.add('active');
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.remove('active');
    showLanding();

    // Reset state
    currentTest = null;
    studentData = null;
    answers = {};

    // Reset form
    document.getElementById('lead-form').reset();
}

// Handle browser back button and route changes
window.addEventListener('hashchange', checkRoute);
