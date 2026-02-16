// Kerege Synak - ORT Testing Platform
// Main Application Logic

// Global State Variables
let currentTest = null;
let answers = {};
let answerHistory = {}; // Track all answer changes for ORT Circle-to-Square
let testStartTime = null;
let sectionStartTime = null;
let timerInterval = null;
let timeRemaining = 0;

// ORT Multi-Section Variables
let testStructure = null;
let currentSection = 0;
let isOnBreak = false;

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

function showHome() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('landing-page').classList.add('active');
    updateNavLinks('home');
    window.scrollTo(0, 0);
}

function showAbout() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('about-page').classList.add('active');
    updateNavLinks('about');
    window.scrollTo(0, 0);
}

function updateNavLinks(activePage) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to current page links
    if (activePage === 'home') {
        document.querySelectorAll('.nav-link[onclick*="showHome"]').forEach(link => {
            link.classList.add('active');
        });
    } else if (activePage === 'about') {
        document.querySelectorAll('.nav-link[onclick*="showAbout"]').forEach(link => {
            link.classList.add('active');
        });
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const burgerMenu = document.querySelector('.burger-menu');

    navMenu.classList.toggle('active');
    burgerMenu.classList.toggle('active');
}

// Close mobile menu when clicking on a link
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) {
        const navMenu = document.querySelector('.nav-menu');
        const burgerMenu = document.querySelector('.burger-menu');
        navMenu.classList.remove('active');
        burgerMenu.classList.remove('active');
    }
});

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
    // 1. Try Loading from Supabase
    if (supabaseApp) {
        try {
            const { data, error } = await supabaseApp
                .from('tests')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                // Map Supabase fields to App fields if needed
                // Assuming DB has: name, language, duration, id
                displayTests(data);
                return;
            }

            if (error) {
                console.warn('Supabase load error (using mocks):', error.message);
            }
        } catch (err) {
            console.warn('Supabase connection error (using mocks):', err);
        }
    }

    // 2. Fallback to MOCK_TESTS (if DB empty or error)
    // This ensures the app works immediately without backend setup
    console.log('Using MOCK_TESTS');
    displayTests(MOCK_TESTS);
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

function displayTestsError(message) {
    const testsContainer = document.getElementById('tests-list');
    testsContainer.innerHTML = `
        <div class="test-card">
            <p style="color: #E31E24;">${message}</p>
            <p style="font-size: 14px; margin-top: 8px;">См. TROUBLESHOOTING.md для решения проблемы</p>
        </div>
    `;
}


// Test Selection
async function selectTest(testId) {
    // Mock mode
    if (MOCK_MODE) {
        currentTest = MOCK_TESTS.find(t => t.id === testId);
        if (currentTest) {
            openLeadForm();
        }
        return;
    }

    try {
        const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getTest&id=${testId}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            currentTest = data.test;
            openLeadForm();
        } else {
            alert('Ошибка загрузки теста: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error selecting test:', error);
        alert('Ошибка загрузки теста. Проверьте подключение к серверу.');
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
    answerHistory = {}; // Reset answer history
    testStartTime = Date.now(); // Start timing

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
    const options = ['A', 'B', 'C', 'D']; // Only 4 options, removed E

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
    // Initialize history for this question if not exists
    if (!answerHistory[questionNum]) {
        answerHistory[questionNum] = [];
    }

    const history = answerHistory[questionNum];

    // Check if this is already selected (clicking same answer)
    if (answers[questionNum] === option) {
        return; // Do nothing if clicking the same answer
    }

    // ORT Circle-to-Square Logic
    if (history.length === 0) {
        // First choice: Filled circle
        history.push(option);
        answers[questionNum] = option;
    } else if (history.length === 1) {
        // Second choice: Old becomes empty square, new becomes filled circle
        history.push(option);
        answers[questionNum] = option;
    } else if (history.length === 2) {
        // Third choice: Show warning and make it final square
        if (!confirm('⚠️ Внимание!\n\nЭто ваш последний выбор для этого вопроса.\nВы уверены, что хотите изменить ответ?')) {
            return; // Cancel if user doesn't confirm
        }
        history.push(option);
        answers[questionNum] = option;
    } else {
        // Block further changes
        alert('❌ Вы уже использовали все 3 попытки изменения ответа для этого вопроса!');
        return;
    }

    // Update visual state
    updateAnswerButtons(questionNum);
}

function updateAnswerButtons(questionNum) {
    // Get all buttons for this question
    const buttons = document.querySelectorAll(`[data-question="${questionNum}"]`);
    const history = answerHistory[questionNum] || [];
    const currentAnswer = answers[questionNum];

    buttons.forEach(btn => {
        const btnOption = btn.dataset.option;

        // Remove all state classes
        btn.classList.remove('answer-bubble', 'first-choice', 'second-choice-old',
            'second-choice-new', 'third-choice', 'unselected');

        // Add base class
        btn.classList.add('answer-bubble');

        if (btnOption === currentAnswer) {
            // Current answer
            if (history.length === 1) {
                btn.classList.add('first-choice'); // Filled circle
            } else if (history.length === 2) {
                btn.classList.add('second-choice-new'); // Filled circle
            } else if (history.length === 3) {
                btn.classList.add('third-choice'); // Final square
            }
        } else if (history.includes(btnOption)) {
            // Previously selected but not current
            btn.classList.add('second-choice-old'); // Empty square
        } else {
            // Never selected
            btn.classList.add('unselected');
        }
    });
}

// Timer
// Updated timer function
function startTimer(minutes) {
    clearTimer(); // Clear any existing timer

    timeRemaining = minutes * 60;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        // Warning at 5 minutes
        if (timeRemaining === 300) {
            showTimerWarning('⚠️ Осталось 5 минут!');
        }

        // Warning at 1 minute
        if (timeRemaining === 60) {
            showTimerWarning('⚠️ Осталась 1 минута!');
        }

        if (timeRemaining <= 0) {
            clearTimer();

            // Check if this is a multi-section test
            if (testStructure && currentSection < testStructure.sections.length - 1) {
                // Move to next section (might be a break)
                currentSection++;
                startSection(currentSection);
            } else {
                // Test complete
                submitTest();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timerEl = document.getElementById('timer');

    if (timerEl) {
        timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Add warning class when time is low
        if (timeRemaining <= 60) {
            timerEl.classList.add('timer-critical');
        } else if (timeRemaining <= 300) {
            timerEl.classList.add('timer-warning');
        } else {
            timerEl.classList.remove('timer-warning', 'timer-critical');
        }
    }
}

function showTimerWarning(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'timer-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function clearTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Start a specific section of ORT test
function startSection(sectionIndex) {
    if (!testStructure || sectionIndex >= testStructure.sections.length) {
        // Test complete
        submitTest();
        return;
    }

    const section = testStructure.sections[sectionIndex];

    if (section.isBreak) {
        // Show break screen with ads
        if (typeof showBreakScreen === 'function') {
            showBreakScreen(section.duration);
        } else {
            // Fallback: auto-advance after break
            setTimeout(() => {
                currentSection++;
                startSection(currentSection);
            }, section.duration * 60 * 1000);
        }
    } else {
        // Update UI for new section
        const sectionTitle = `${currentTest.name} - ${section.name}`;
        const titleEl = document.getElementById('test-title');
        if (titleEl) {
            titleEl.textContent = sectionTitle;
        }

        // Start timer for this section
        startTimer(section.duration);
        sectionStartTime = Date.now();
    }
}

// Image Zoom
function zoomImage() {
    document.getElementById('image-modal').classList.add('active');
}

function closeZoom() {
    document.getElementById('image-modal').classList.remove('active');
}

// Submit Test with ORT Analytics
async function submitTest() {
    clearTimer();

    // Calculate score
    const results = calculateScore();

    // Calculate topic analysis if test has topic data
    let topicAnalysis = null;
    if (currentTest.topics && currentTest.topics.length > 0) {
        topicAnalysis = calculateTopicAnalysis();
    }

    // Prepare submission data for Supabase
    const submission = {
        student_name: `${studentData.firstName} ${studentData.lastName}`,
        parent_phone: studentData.whatsapp,
        test_name: currentTest.name,
        test_id: currentTest.id,
        raw_score: results.correct,
        scaled_score: results.score,
        total_questions: currentTest.answerKey.length,
        topic_analysis: topicAnalysis,
        answers_json: JSON.stringify(answers),
        answer_history: JSON.stringify(answerHistory),
        duration_seconds: getTestDuration(),
        created_at: new Date().toISOString()
    };

    try {
        // Save to Supabase
        if (supabaseApp) {
            const { data, error } = await supabaseApp
                .from('test_results')
                .insert([submission]);

            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message);
            }

            console.log('Test result saved:', data);
        }

        // Show success with ORT score
        showSuccessModalWithScore(results.score, results.correct, currentTest.answerKey.length, topicAnalysis);

    } catch (error) {
        console.error('Error submitting test:', error);
        alert('Ошибка отправки результатов: ' + error.message);
    }
}

// Calculate topic analysis
function calculateTopicAnalysis() {
    if (!currentTest.topics || currentTest.topics.length === 0) {
        return null;
    }

    const topicStats = {};
    const answerKey = currentTest.answerKey;

    // Analyze each question
    for (let i = 1; i <= answerKey.length; i++) {
        const topic = currentTest.topics[i - 1] || 'Общие';
        const isCorrect = answers[i] === answerKey[i - 1];

        if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, total: 0 };
        }

        topicStats[topic].total++;
        if (isCorrect) {
            topicStats[topic].correct++;
        }
    }

    // Convert to array format
    return Object.entries(topicStats).map(([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100)
    }));
}

// Auto-Grading System
function calculateScore() {
    const answerKey = currentTest.answerKey;
    let correct = 0;
    const total = answerKey.length;

    // Count correct answers
    for (let i = 1; i <= total; i++) {
        const finalAnswer = answers[i];
        if (finalAnswer === answerKey[i - 1]) {
            correct++;
        }
    }

    // Calculate ORT scaled score
    const ortScore = calculateORTScore(correct, total);

    return {
        score: ortScore,
        correct,
        total
    };
}

function calculateORTScore(correct, total) {
    // Calculate percentage
    const percent = (correct / total) * 100;

    // ORT formula: ScaledScore = (Percent / 100) * 190 + 55
    let scaledScore = Math.round((percent / 100) * 190 + 55);

    // Cap at 245 (maximum ORT score)
    if (scaledScore > 245) {
        scaledScore = 245;
    }

    return scaledScore;
}

function getTestDuration() {
    if (!testStartTime) return 0;
    const duration = Date.now() - testStartTime;
    return Math.floor(duration / 1000); // Return seconds
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatAnswerHistory() {
    // Format: "1:A->C, 2:B, 3:D->A->C"
    const formatted = [];

    for (let questionNum in answerHistory) {
        const history = answerHistory[questionNum];
        if (history.length > 0) {
            const historyStr = history.join('->');
            formatted.push(`${questionNum}:${historyStr}`);
        }
    }

    return formatted.join(', ');
}

// Mock Data (for demo purposes)
const MOCK_TESTS = [
    {
        id: 'math-2024',
        name: 'Математика ОРТ 2024',
        language: 'RU',
        duration: 65, // Total with break
        photoUrl: 'https://via.placeholder.com/800x1200?text=Math+Test',
        answerKey: ['A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E']
    }
];

// ORT Test Structures
const ORT_STRUCTURES = {
    'math': {
        sections: [
            { name: 'Математика Часть 1', questions: 30, duration: 30, topics: ['Алгебра', 'Геометрия', 'Дроби'] },
            { name: 'Перерыв', duration: 5, isBreak: true },
            { name: 'Математика Часть 2', questions: 30, duration: 30, topics: ['Алгебра', 'Геометрия', 'Дроби'] }
        ]
    },
    'kyrgyz': {
        sections: [
            { name: 'Аналогии', questions: 30, duration: 30, topics: ['Аналогии'] },
            { name: 'Перерыв', duration: 5, isBreak: true },
            { name: 'Чтение', questions: 30, duration: 60, topics: ['Понимание текста'] },
            { name: 'Перерыв', duration: 5, isBreak: true },
            { name: 'Грамматика', questions: 30, duration: 35, topics: ['Синтаксис', 'Морфология'] }
        ]
    }
};

// Initialize Supabase Client
const SUPABASE_URL = 'https://ourguzxerqecmyyoodgl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91cmd1enhlcnFlY215eW9vZGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjA4NTYsImV4cCI6MjA4NjY5Njg1Nn0.p1kyHqwHZphZmYeZ_Ymp6L72KKvD8TP3UJCdcv75xLo';
const supabaseApp = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
// Expose for Admin script (compatibility)
window.supabaseClient = supabaseApp;

// Additional state
let studentData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // CONFIGURATION
    // REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS
    // The previous SUPABASE_URL and SUPABASE_KEY declarations are removed as they are now part of the new global block.

    // Initialize Supabase Client
    // The previous supabaseApp and window.supabaseClient declarations are removed as they are now part of the new global block.

    // Submit Test Results
    async function submitTestResults() {
        clearTimer();

        // Check credentials
        if (!supabaseApp || SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
            alert('Ошибка: Supabase не настроен в app.js');
            // Show results anyway for demo
            showResultsModal(calculateScore(), getTestDuration());
            return;
        }

        // Calculate results
        const results = calculateScore();
        const duration = getTestDuration();
        const fullHistory = formatAnswerHistory();

        // Prepare data for submission
        const resultData = {
            first_name: studentData.firstName,
            last_name: studentData.lastName,
            whatsapp: studentData.whatsapp,
            region: studentData.region || '',
            parent_phone: studentData.parentPhone || '',
            test_name: currentTest.name,
            score: results.score,
            correct_count: `${results.correct} / ${results.total}`,
            duration: duration,
            full_history: fullHistory,
            answers: answers // send as JSONB
        };

        try {
            const { data, error } = await supabaseApp
                .from('test_results')
                .insert([resultData])
                .select();

            if (error) throw error;

            showResultsModal(results, duration);

        } catch (error) {
            console.error('Error submitting results:', error);
            alert('Ошибка отправки результатов: ' + error.message);
            // Show results anyway
            showResultsModal(results, duration);
        }
    }

    // Enhanced Results Modal
    function showResultsModal(results, duration) {
        const modal = document.getElementById('success-modal');
        const content = modal.querySelector('.success-content');

        const percentage = Math.round((results.correct / results.total) * 100);
        const durationFormatted = formatDuration(duration);

        content.innerHTML = `
        <h2>🎉 Тест завершен!</h2>
        <div style="margin: 32px 0;">
            <div style="background: linear-gradient(135deg, #E31E24 0%, #C01A1F 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
                <div style="font-size: 16px; opacity: 0.9; margin-bottom: 8px;">Твой ориентировочный балл ОРТ:</div>
                <div style="font-size: 56px; font-weight: 800; line-height: 1;">${results.score}</div>
                <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">из 245 возможных</div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
                <div style="background: #F5F5F5; padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 14px; color: #404040; margin-bottom: 8px;">Правильных ответов</div>
                    <div style="font-size: 32px; font-weight: 700; color: #E31E24;">${results.correct}/${results.total}</div>
                </div>
                <div style="background: #F5F5F5; padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 14px; color: #404040; margin-bottom: 8px;">Процент</div>
                    <div style="font-size: 32px; font-weight: 700; color: #E31E24;">${percentage}%</div>
                </div>
            </div>
            
            <div style="background: #F5F5F5; padding: 16px; border-radius: 10px; text-align: center;">
                <div style="font-size: 14px; color: #404040;">Время выполнения: <strong>${durationFormatted}</strong></div>
            </div>
        </div>
        
        <p style="font-size: 16px; color: #404040; margin-bottom: 24px;">
            Результаты отправлены в WhatsApp. Продолжай готовиться к ОРТ с Kerege Synak!
        </p>
        
        <button class="btn btn-primary" onclick="closeSuccessModal()">Вернуться на главную</button>
    `;

        modal.classList.add('active');
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
        answerHistory = {};

        // Reset form
        document.getElementById('lead-form').reset();
    }

    // Handle browser back button and route changes
    window.addEventListener('hashchange', checkRoute);

    // ==========================================
    // CRM & ADMIN FUNCTIONS
    // ==========================================

    // Load Student Results from Supabase
    async function loadStudentResults() {
        if (!supabaseApp) return;

        const tbody = document.getElementById('results-body');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Загрузка данных...</td></tr>';

        try {
            const { data, error } = await supabaseApp
                .from('test_results')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            window.allResults = data; // Store for filtering
            renderResults(data);

        } catch (error) {
            console.error('Error loading results:', error);
            tbody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center; padding: 20px;">Ошибка загрузки: ${error.message}</td></tr>`;
        }
    }

    // Render Results Table
    function renderResults(data) {
        const tbody = document.getElementById('results-body');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Нет результатов</td></tr>';
            return;
        }

        data.forEach(row => {
            const date = new Date(row.created_at).toLocaleDateString('ru-RU');
            const studentName = `${row.first_name || ''} ${row.last_name || ''}`;
            const studentPhone = row.whatsapp || '-';
            const region = row.region || '-';
            const parentPhone = row.parent_phone || '-';

            // Format Phones
            const cleanStudent = studentPhone.replace(/\D/g, '');
            const cleanParent = parentPhone.replace(/\D/g, '');

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';

            tr.innerHTML = `
            <td style="padding: 12px;">${date}</td>
            <td style="padding: 12px;">
                <strong>${studentName}</strong><br>
                <a href="tel:+${cleanStudent}" style="color: #666; text-decoration: none;">📞 ${studentPhone}</a>
            </td>
            <td style="padding: 12px;">
                <span style="color: #444;">Родитель</span><br>
                <a href="tel:+${cleanParent}" style="color: #666; text-decoration: none; margin-right: 8px;">📞 Позвонить</a>
                ${cleanParent ? `<a href="https://wa.me/${cleanParent}" target="_blank" style="color: #25D366; text-decoration: none;">💬 WhatsApp</a>` : ''}
            </td>
            <td style="padding: 12px;">${region}</td>
            <td style="padding: 12px;">${row.test_name || '-'}</td>
            <td style="padding: 12px;">
                <span style="font-weight: bold; color: #E31E24;">${row.scaled_score || row.score || '-'}</span>
                <br><small>Пр: ${row.correct_count}</small>
            </td>
            <td style="padding: 12px;">
                <button onclick="deleteStudent('${row.id}')" class="btn-delete" style="background: #e31e24; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background 0.3s;" onmouseover="this.style.background='#c01a1f'" onmouseout="this.style.background='#e31e24'" title="Удалить студента">
                    🗑️ Удалить
                </button>
            </td>
            <td style="padding: 12px;">
                <button class="btn-sm" onclick='generateCertificate(${JSON.stringify(row)})' style="padding: 6px 12px; background: #E31E24; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    PDF
                </button>
            </td>
        `;
            tbody.appendChild(tr);
        });
    }

    // Filter Results
    function filterResults() {
        const query = document.getElementById('crm-search').value.toLowerCase();
        const filtered = window.allResults.filter(row => {
            const name = `${row.first_name} ${row.last_name}`.toLowerCase();
            const phone = (row.whatsapp || '').toLowerCase();
            return name.includes(query) || phone.includes(query);
        });
        renderResults(filtered);
    }

    // Generate PDF Certificate
    async function generateCertificate(student) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Background (Simple Border)
        doc.setLineWidth(2);
        doc.setDrawColor(227, 30, 36); // Kerege Red
        doc.rect(10, 10, 277, 190);

        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.rect(15, 15, 267, 180);

        // Header
        doc.setTextColor(227, 30, 36);
        doc.setFontSize(40);
        doc.setFont("helvetica", "bold");
        doc.text("KEREGE SYNAK", 148.5, 40, { align: "center" });

        // Certificate Title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(60);
        doc.setFont("times", "normal"); // Use standard font to avoid cyrillic issues if not installed

        // NOTE: jsPDF default fonts lack Cyrillic support.
        // For production, we'd need to load a custom font via .addFileToVFS for Russian names.
        // For this prototype, I will transliterate or warn.

        doc.setFontSize(30);
        doc.text("CERTIFICATE", 148.5, 70, { align: "center" });

        doc.setFontSize(16);
        doc.text("OF COMPLETION", 148.5, 80, { align: "center" });

        // Student Name
        doc.setFontSize(40);
        doc.setTextColor(50, 50, 50);
        // Transliterate name for safety in standard fonts
        const transliteratedName = transliterate(student.first_name + " " + student.last_name);
        doc.text(transliteratedName, 148.5, 110, { align: "center" });

        // Details
        doc.setFontSize(18);
        doc.setTextColor(80, 80, 80);
        doc.text(`Successfully passed the practice test:`, 148.5, 130, { align: "center" });
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.text(transliterate(student.test_name), 148.5, 140, { align: "center" });

        // Score
        doc.setFontSize(20);
        doc.setTextColor(227, 30, 36);
        doc.text(`ORT SCORE: ${student.score} / 245`, 148.5, 160, { align: "center" });

        // Footer
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        const date = new Date(student.created_at).toLocaleDateString();
        doc.text(`Date: ${date}`, 30, 180);
        doc.text("Director: Kerege Synak Team", 220, 180);

        // Save
        doc.save(`Certificate_${transliteratedName}.pdf`);
    }

    // Simple Transliteration Helper (because jsPDF standard fonts don't support Cyrillic)
    function transliterate(word) {
        if (!word) return "";
        const a = { "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya", "А": "A", "Б": "B", "В": "V", "Г": "G", "Д": "D", "Е": "E", "Ё": "Yo", "Ж": "Zh", "З": "Z", "И": "I", "Й": "Y", "К": "K", "Л": "L", "М": "M", "Н": "N", "О": "O", "П": "P", "Р": "R", "С": "S", "Т": "T", "У": "U", "Ф": "F", "Х": "H", "Ц": "Ts", "Ч": "Ch", "Ш": "Sh", "Щ": "Sch", "Ъ": "", "Ы": "", "Ь": "", "Э": "E", "Ю": "Yu", "Я": "Ya" };
        return word.split('').map(char => a[char] || char).join("");
    }

    // Update Admin Login to load results
    function showAdminPanel() {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        loadStudentResults(); // Load CRM data
        if (typeof loadAdminVideos === 'function') loadAdminVideos(); // Load Videos
    }


    // Load Videos for Landing Page
    async function loadVideos() {
        // 1. Try Loading from Supabase
        if (supabaseApp) {
            try {
                const { data, error } = await supabaseApp
                    .from('marketing_videos')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data && data.length > 0) {
                    displayVideos(data);
                    return;
                }
            } catch (err) {
                console.warn('Supabase video load error:', err);
            }
        }

        // 2. Fallback / Empty
        const container = document.getElementById('videos-list');
        if (container) {
            container.innerHTML = '<div class="video-card"><p>Видео уроки скоро появятся</p></div>';
        }
    }

    function displayVideos(videos) {
        const container = document.getElementById('videos-list');
        if (!container) return;

        container.innerHTML = videos.map(video => {
            // Simple YouTube ID extraction
            let videoId = '';
            try {
                if (video.youtube_url.includes('v=')) {
                    videoId = video.youtube_url.split('v=')[1].split('&')[0];
                } else if (video.youtube_url.includes('youtu.be/')) {
                    videoId = video.youtube_url.split('youtu.be/')[1].split('?')[0];
                } else if (video.youtube_url.includes('embed/')) {
                    videoId = video.youtube_url.split('embed/')[1].split('?')[0];
                }
            } catch (e) { videoId = ''; }

            if (!videoId) {
                return `<div class="video-card"><p>Ошибка ссылки: ${video.title}</p></div>`;
            }

            const embedUrl = `https://www.youtube.com/embed/${videoId}`;

            return `
        <div class="video-card">
            <div class="video-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; margin-bottom: 12px;">
                <iframe src="${embedUrl}" title="${video.title}" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                    allowfullscreen>
                </iframe>
            </div>
            <h3>${video.title}</h3>
            <p style="color: #666; font-size: 14px;">${video.language === 'RU' ? 'Русский' : 'Кыргызча'}</p>
        </div>
        `;
        }).join('');
    }

    // Ensure loadVideos is called
    document.addEventListener('DOMContentLoaded', () => {
        // loadTests(); - already called in line 43
        loadVideos();
    });
});
