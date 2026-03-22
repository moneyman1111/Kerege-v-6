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
    loadVideos();
    setupWhatsAppMask();
    loadFrontendCMS();
    checkRoute();
});

// Load CMS content for landing and about pages
async function loadFrontendCMS() {
    if (!window.supabaseApp) return;
    try {
        const { data } = await window.supabaseApp
            .from('content_blocks')
            .select('key,value,video_url')
            .in('key', ['landing_hero_title', 'landing_hero_subtitle', 'company_description', 'congrats_text', 'whatsapp_number']);

        if (!data) return;
        const map = {};
        data.forEach(r => { map[r.key] = { value: r.value, video: r.video_url }; });

        // Update Hero Title
        if (map.landing_hero_title) {
            const el = document.querySelector('.hero-title');
            if (el) el.textContent = map.landing_hero_title.value;
            renderCMSVideo('hero-video-container', map.landing_hero_title.video);
        }
        
        // Update Hero Subtitle
        if (map.landing_hero_subtitle) {
            const el = document.querySelector('.hero-subtitle');
            if (el) el.textContent = map.landing_hero_subtitle.value;
        }

        // Update WhatsApp links globally
        if (map.whatsapp_number) {
             const num = map.whatsapp_number.value.replace(/\D/g, '');
             document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a => {
                const msg = a.href.split('?')[1] || '';
                a.href = `https://wa.me/${num}${msg ? '?' + msg : ''}`;
            });
        }

        // Update About Us Description
        if (map.company_description) {
            const el = document.querySelector('.about-description');
            if (el) el.textContent = map.company_description.value;
            renderCMSVideo('about-video-container', map.company_description.video);
        }
    } catch (e) { console.warn('Frontend CMS load error:', e); }
}

function renderCMSVideo(containerId, url) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!url) {
        container.style.display = 'none';
        return;
    }

    const embedUrl = convertToEmbedUrl(url, false);
    if (embedUrl) {
        container.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:12px;box-shadow: 0 10px 30px rgba(0,0,0,0.15);"></iframe>`;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// Navigation
function showLanding() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('landing-page').classList.add('active');
    document.body.classList.remove('test-active');
    // Hide break screen if active
    const bs = document.getElementById('break-screen');
    if (bs) bs.classList.remove('active');
    clearTimer();
}

function showTestPage() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('test-page').classList.add('active');
    document.body.classList.add('test-active');
}

function showAdminPage() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('admin-page').classList.add('active');
    document.body.classList.remove('test-active');
}

function showHome() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    // Also remove dynamic linked-test-status screen if present
    const statusScreen = document.getElementById('linked-test-status');
    if (statusScreen) statusScreen.remove();
    document.getElementById('landing-page').classList.add('active');
    document.body.classList.remove('test-active');
    // Hide break/congrats overlays
    const bs = document.getElementById('break-screen');
    if (bs) bs.classList.remove('active');
    const cm = document.getElementById('congrats-modal');
    if (cm) cm.classList.remove('active');
    updateNavLinks('home');
    window.scrollTo(0, 0);
}

function showAbout() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('about-page').classList.add('active');
    document.body.classList.remove('test-active');
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
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const accessCode = params.get('code');

    // Access-link route: ?code=XXXX
    if (accessCode) {
        validateAccessCode(accessCode);
        return;
    }

    // Hidden admin route
    if (hash === '#keregemanager') {
        showAdminPage();
    }
    // Direct test link: #test-{id}
    else if (hash.startsWith('#test-')) {
        const testId = hash.replace('#test-', '');
        if (testId) {
            loadLinkedTest(testId);
        }
    }
    // Default landing
    else if (!hash || hash === '#') {
        showLanding();
    }
}

// Validate a ?code= access link and load the test if valid
async function validateAccessCode(code) {
    showLinkedTestStatus('⏳', 'Жүктөлүүдө...', '', false);

    if (!supabaseApp) {
        showLinkedTestStatus('❌', 'База данных недоступна', 'Попробуйте позже.', true);
        return;
    }

    try {
        const { data, error } = await supabaseApp
            .from('test_access_links')
            .select('test_id, expires_at')
            .eq('access_code', code)
            .single();

        if (error || !data) {
            showLinkedTestStatus(
                '🔒',
                'Ссылка недействительна',
                'Эта ссылка не существует или была удалена. Обратитесь к преподавателю.',
                true
            );
            return;
        }

        // Check is_used (one-time link)
        if (data.is_used) {
            showLinkedTestStatus(
                '🔒',
                'Ссылка уже использована',
                'Эта ссылка была использована ранее и больше не действительна. Обратитесь к преподавателю за новой.',
                true
            );
            return;
        }

        // Check expiry
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            const expired = new Date(data.expires_at).toLocaleString('ru-RU');
            showLinkedTestStatus(
                '⏰',
                'Срок ссылки истёк',
                `Доступ по этой ссылке закрыт <strong>${expired}</strong>. Запросите новую ссылку у преподавателя.`,
                true
            );
            return;
        }

        // Mark as used (one-time link)
        try {
            await supabaseApp
                .from('test_access_links')
                .update({ is_used: true, used_at: new Date().toISOString() })
                .eq('access_code', code);
        } catch (e) { console.warn('Could not mark link as used:', e); }

        // Valid — clean up URL and load test
        history.replaceState(null, '', location.pathname);
        loadLinkedTest(data.test_id);

    } catch (err) {
        console.error('Access code validation error:', err);
        showLinkedTestStatus('❌', 'Ошибка проверки', err.message, true);
    }
}


// Load a specific test via direct link (link-only tests)
async function loadLinkedTest(testId) {
    if (!supabaseApp) {
        alert('Ошибка: база данных не доступна');
        return;
    }

    // Show loading screen
    showLinkedTestStatus('⏳', 'Загрузка теста...', '', false);

    try {
        const { data, error } = await supabaseApp
            .from('tests')
            // Select only what is needed — avoids transferring photo_urls blobs
            .select('id, name, language, duration, answer_key, test_type, topics, weights, is_link_only, access_start, access_end')
            .eq('id', testId)
            .single();

        if (error || !data) {
            showLinkedTestStatus('❌', 'Тест не найден', 'Проверьте правильность ссылки.', true);
            return;
        }

        const now = new Date();

        // Check access_start
        if (data.access_start && now < new Date(data.access_start)) {
            const startDate = new Date(data.access_start).toLocaleString('ru-RU');
            showLinkedTestStatus('⏰', 'Тест ещё не начался', `Доступ откроется в: <strong>${startDate}</strong>`, true);
            return;
        }

        // Check access_end
        if (data.access_end && now > new Date(data.access_end)) {
            const endDate = new Date(data.access_end).toLocaleString('ru-RU');
            showLinkedTestStatus('🔒', 'Срок доступа истёк', `Доступ к тесту закрыт <strong>${endDate}</strong>. Обратитесь к преподавателю.`, true);
            return;
        }

        // All good — load the test
        currentTest = data;
        // Remove the hash so going back works cleanly
        history.replaceState(null, '', location.pathname);
        openLeadForm();

    } catch (err) {
        console.error('Error loading linked test:', err);
        showLinkedTestStatus('❌', 'Ошибка загрузки', err.message, true);
    }
}

// Show a full-screen status page for linked test entry
function showLinkedTestStatus(icon, title, message, showHomeBtn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Remove any existing status screen
    const old = document.getElementById('linked-test-status');
    if (old) old.remove();

    const screen = document.createElement('div');
    screen.id = 'linked-test-status';
    screen.className = 'page active';
    screen.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(160deg,#e31e24,#9b1018);';
    screen.innerHTML = `
        <div style="text-align:center;color:white;padding:40px 24px;max-width:480px;">
            <div style="font-size:72px;margin-bottom:16px;">${icon}</div>
            <h1 style="font-size:32px;font-weight:800;margin-bottom:12px;">${title}</h1>
            <p style="font-size:17px;opacity:.9;line-height:1.6;margin-bottom:32px;">${message}</p>
            ${showHomeBtn ? `<button onclick="showHome()" style="background:white;color:#e31e24;border:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;">На главную</button>` : ''}
        </div>`;
    document.body.appendChild(screen);
}

// Lead Form Functions — single canonical versions below (lines 287+)


// Load Tests (public list — excludes link-only tests)
// 🚀 Cached for 2 minutes to reduce Supabase load under high concurrency
const TESTS_CACHE_KEY = 'kerege_tests_cache';
const TESTS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
let _testsLoading = false; // Prevent duplicate in-flight requests

async function loadTests() {
    // 1. Serve from cache if fresh
    try {
        const cached = JSON.parse(localStorage.getItem(TESTS_CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.ts < TESTS_CACHE_TTL) {
            displayTests(cached.data);
            return;
        }
    } catch (_) {}

    // 2. Guard against duplicate simultaneous calls
    if (_testsLoading) return;
    _testsLoading = true;

    if (!supabaseApp) {
        _testsLoading = false;
        displayTests([]);
        return;
    }
    try {
        // Select only necessary columns (reduces data transfer)
        const { data, error } = await supabaseApp
            .from('tests')
            .select('id, name, language, duration')
            .or('is_link_only.is.null,is_link_only.eq.false')
            .order('created_at', { ascending: false })
            .limit(50); // Safety cap

        if (!error && data) {
            // Save to cache
            try { localStorage.setItem(TESTS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
            displayTests(data);
            _testsLoading = false;
            return;
        }

        // Fallback: if column doesn't exist yet, load all tests
        console.warn('is_link_only filter failed (migration not run?), loading all tests:', error?.message);
        const { data: allData, error: allError } = await supabaseApp
            .from('tests')
            .select('id, name, language, duration')
            .order('created_at', { ascending: false })
            .limit(50);

        displayTests(allError ? [] : (allData || []));

    } catch (err) {
        console.warn('Supabase connection error:', err);
        displayTests([]);
    } finally {
        _testsLoading = false;
    }
}

// Invalidate test list cache (call after admin uploads/deletes a test)
function invalidateTestsCache() {
    try { localStorage.removeItem(TESTS_CACHE_KEY); } catch (_) {}
}

function displayTests(tests) {
    const testsContainer = document.getElementById('tests-list');

    if (!tests || tests.length === 0) {
        testsContainer.innerHTML = '<div class="test-card"><p>Тесты скоро появятся</p></div>';
        return;
    }

    // Cache basic test info for instant form opening
    window.testCache = {};
    tests.forEach(t => { window.testCache[t.id] = t; });

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


// Global promise for background full-test fetch
let _testLoadPromise = null;

// Test Selection — instant open + background load
function selectTest(testId) {
    if (!supabaseApp) {
        alert('Ошибка: Supabase не подключен');
        return;
    }

    // Set basic info immediately from cache so form opens instantly
    const cached = window.testCache && window.testCache[testId];
    currentTest = cached ? { ...cached } : { id: testId };

    // Start loading full test data (with photos) in the background
    _testLoadPromise = supabaseApp
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single()
        .then(({ data, error }) => {
            if (error) throw error;
            currentTest = data; // Update with full data when ready
            return data;
        });

    // Open lead form immediately — no waiting
    openLeadForm();
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


// Test Interface
async function startTest() {
    if (!studentData) {
        alert('Ошибка: данные студента не найдены');
        return;
    }

    // Wait for the background full-test fetch to complete if still loading
    if (_testLoadPromise) {
        const btn = document.querySelector('#lead-form button[type="submit"]');
        const origText = btn ? btn.textContent : '';
        if (btn) { btn.textContent = 'Загрузка теста...'; btn.disabled = true; }

        try {
            const fullData = await _testLoadPromise;
            currentTest = fullData;
        } catch (err) {
            console.error('Test data failed to load:', err);
            alert('Ошибка загрузки теста. Попробуйте ещё раз.');
            if (btn) { btn.textContent = origText; btn.disabled = false; }
            return;
        } finally {
            if (btn) { btn.textContent = origText; btn.disabled = false; }
            _testLoadPromise = null;
        }
    }

    if (!currentTest) {
        alert('Ошибка: данные теста не найдены');
        return;
    }

    // Reset state
    answers = {};
    answerHistory = {};
    testStartTime = Date.now();
    currentPhotoIndex = 0;

    // Detect test type and show appropriate layout
    const isPDFTest = !!(currentTest.is_pdf && currentTest.pdf_url);

    if (isPDFTest) {
        // PDF test layout
        document.getElementById('image-test-layout').style.display = 'none';
        document.getElementById('pdf-test-layout').style.display = 'block';

        // Load PDF into iframe via blob URL
        const pdfData = currentTest.pdf_url;
        let pdfSrc = pdfData;
        if (pdfData && pdfData.startsWith('data:')) {
            // Convert base64 data URL to blob URL for iframe
            try {
                const byteStr = atob(pdfData.split(',')[1]);
                const arr = new Uint8Array(byteStr.length);
                for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
                const blob = new Blob([arr], { type: 'application/pdf' });
                pdfSrc = URL.createObjectURL(blob);
            } catch (e) { pdfSrc = pdfData; }
        }
        const pdfIframe = document.getElementById('pdf-iframe');
        if (pdfIframe) pdfIframe.src = pdfSrc;

        // Generate answer grid in right panel
        generateAnswerGrid(currentTest.answer_key.length, 'pdf-answer-grid');

        // Set up block structure for PDF tests
        setupPDFTestBlocks();
    } else {
        // Image-based test layout
        document.getElementById('image-test-layout').style.display = 'block';
        document.getElementById('pdf-test-layout').style.display = 'none';

        // Initialize Image
        updateTestImage();

        // Generate answer grid in standard panel
        generateAnswerGrid(currentTest.answer_key.length, 'answer-grid');
    }

    document.getElementById('test-title').textContent = currentTest.name;

    // Start timer
    startTimer(currentTest.duration);

    // Show test page
    showTestPage();
}

// ── PDF Block Structure Setup ──────────────────────────────
function setupPDFTestBlocks() {
    const testType = currentTest.test_type || currentTest.type || 'standard';
    const qCount = currentTest.answer_key ? currentTest.answer_key.length : (currentTest.question_count || 30);

    if (testType === 'math') {
        // Математика: часть 1 (30 мин, вопр 1-30) → ПАУЗА 5 мин → часть 2 (60 мин, вопр 31-60)
        testStructure = {
            sections: [
                { name: 'I бөлүк', duration: 30, start: 1, end: Math.min(30, qCount), isBreak: false },
                { isBreak: true, duration: 5, name: 'Үзгүлтүк' },
                { name: 'II бөлүк', duration: 60, start: 31, end: qCount, isBreak: false }
            ]
        };
        currentSection = 0;
        startPDFSection(0);
    } else if (testType === 'kyrgyz') {
        // Кыргызский: Аналогии (30 мин) → Чтение (60 мин) → Грамматика (35 мин)
        testStructure = {
            sections: [
                { name: 'Аналогиялар', duration: 30, start: 1, end: Math.min(30, qCount), isBreak: false },
                { name: 'Окуп түшүнүү', duration: 60, start: 31, end: Math.min(60, qCount), isBreak: false },
                { name: 'Грамматика', duration: 35, start: 61, end: qCount, isBreak: false }
            ]
        };
        currentSection = 0;
        startPDFSection(0);
    } else {
        // Standard: single timer
        testStructure = null;
        document.getElementById('section-label').textContent = '';
    }
}

function startPDFSection(sectionIndex) {
    if (!testStructure || sectionIndex >= testStructure.sections.length) {
        submitTest();
        return;
    }
    currentSection = sectionIndex;
    const section = testStructure.sections[sectionIndex];

    if (section.isBreak) {
        showBreakScreen(section.duration, sectionIndex);
    } else {
        // Update section badge
        const badge = document.getElementById('pdf-section-badge');
        if (badge) badge.textContent = section.name;
        const label = document.getElementById('section-label');
        if (label) label.textContent = section.name;
        clearTimer();
        startTimer(section.duration);
    }
}

// ── Break Screen ───────────────────────────────────────────
let _breakInterval = null;

async function showBreakScreen(durationMinutes, nextSectionIndexAfterBreak) {
    clearTimer();
    const breakScreen = document.getElementById('break-screen');
    if (breakScreen) breakScreen.classList.add('active');

    // Try to load a marketing video for break
    try {
        if (window.supabaseApp || window.supabaseClient) {
            const sb = window.supabaseApp || window.supabaseClient;
            const { data } = await sb.from('marketing_videos').select('youtube_url,title').limit(1).single();
            if (data && data.youtube_url) {
                const embedUrl = convertToEmbedUrl(data.youtube_url, true);
                const iframe = document.getElementById('break-video-iframe');
                const container = document.getElementById('break-video-container');
                if (iframe && embedUrl) {
                    iframe.src = embedUrl;
                    if (container) container.style.display = 'block';
                }
            }
        }
    } catch (e) { /* No video — just show timer */ }

    let remaining = durationMinutes * 60;
    const timerEl = document.getElementById('break-timer');

    function tick() {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        if (timerEl) timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        if (remaining <= 0) {
            clearInterval(_breakInterval);
            _breakInterval = null;
            if (breakScreen) breakScreen.classList.remove('active');
            // Clear break video
            const iframe = document.getElementById('break-video-iframe');
            if (iframe) iframe.src = '';
            const container = document.getElementById('break-video-container');
            if (container) container.style.display = 'none';
            // Start next section
            startPDFSection(nextSectionIndexAfterBreak + 1);
        }
        remaining--;
    }
    tick();
    _breakInterval = setInterval(tick, 1000);
}

function convertToEmbedUrl(url, autoplay) {
    if (!url) return '';
    let videoId = '';
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com')) videoId = u.searchParams.get('v') || '';
        else if (u.hostname.includes('youtu.be')) videoId = u.pathname.slice(1);
    } catch (e) {
        const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
        if (m) videoId = m[1];
    }
    if (!videoId) return url;
    return `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1&mute=1' : ''}`;
}
window.convertToEmbedUrl = convertToEmbedUrl;

let currentPhotoIndex = 0;

function updateTestImage() {
    if (!currentTest || !currentTest.photo_urls || currentTest.photo_urls.length === 0) return;

    const photos = currentTest.photo_urls;
    let photoUrl = photos[currentPhotoIndex];

    // Fix for base64
    if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
        photoUrl = `data:image/png;base64,${photoUrl}`;
    }

    // Update images
    document.getElementById('test-image').src = photoUrl;
    document.getElementById('zoomed-image').src = photoUrl;

    // Update Controls
    const controls = document.getElementById('image-controls');
    const counter = document.getElementById('page-counter');

    if (photos.length > 1) {
        controls.style.display = 'flex';
        counter.textContent = `Стр. ${currentPhotoIndex + 1} / ${photos.length}`;
    } else {
        controls.style.display = 'none';
    }
}

function prevImage() {
    if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
        updateTestImage();
    }
}

function nextImage() {
    if (currentTest && currentTest.photo_urls && currentPhotoIndex < currentTest.photo_urls.length - 1) {
        currentPhotoIndex++;
        updateTestImage();
    }
}

// Ensure these are global
window.prevImage = prevImage;
window.nextImage = nextImage;

function generateAnswerGrid(questionCount, targetGridId) {
    const gridId = targetGridId || 'answer-grid';
    const grid = document.getElementById(gridId);
    if (!grid) return;
    // А,Б,В,Г,Д — ORT Kyrgyz 5-option format
    const options = ['А', 'Б', 'В', 'Г', 'Д'];

    grid.innerHTML = '';

    for (let i = 1; i <= questionCount; i++) {
        const row = document.createElement('div');
        row.className = 'answer-row';

        const questionNum = document.createElement('div');
        questionNum.className = 'question-number';
        questionNum.textContent = i + '.';

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'answer-options answer-options-5';

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

    // ORT 2-Attempt Logic (KEREGE format)
    if (history.length === 0) {
        // First choice: Filled circle
        history.push(option);
        answers[questionNum] = option;
    } else if (history.length === 1) {
        // Second choice: First stays as empty square, new becomes filled circle
        history.push(option);
        answers[questionNum] = option;
    } else {
        // BLOCKED — 2 attempts already used
        showAnswerBlockedToast();
        return;
    }

    // Update visual state in both grids if PDF test
    updateAnswerButtons(questionNum);
}

function showAnswerBlockedToast() {
    const old = document.getElementById('answer-blocked-toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.id = 'answer-blocked-toast';
    toast.style.cssText = `
        position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;
        background:#e31e24;color:white;padding:10px 20px;border-radius:30px;
        font-size:14px;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,0.3);
        animation:slideUp .2s ease;
    `;
    toast.textContent = '❌ 2 жолудан ашык өзгөртүүгө болбойт!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
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


function closeZoom(event) {
    if (!event || event.target.id === 'image-modal' || event.target.classList.contains('close-zoom')) {
        document.getElementById('image-modal').classList.remove('active');
    }
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
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        whatsapp: studentData.whatsapp,
        region: studentData.region,
        oblast: studentData.oblast, // Restored
        parent_phone: studentData.parentPhone,
        parent_name: studentData.parentName, // Restored
        test_name: currentTest.name,
        ort_score: results.score,  // Changed from scaled_score to ort_score
        raw_score: results.correct,
        correct_count: results.correct,  // Added for compatibility
        total_questions: currentTest.answer_key.length,
        duration_seconds: getTestDuration(),
        topic_analysis: topicAnalysis,
        test_language: 'RU',  // Added required field
        test_type: 'standard'  // Added required field
        // created_at will be set automatically by database
    };

    try {
        // Save to Supabase
        if (supabaseApp) {
            const { data, error } = await supabaseApp
                .from('test_results') // Changed back to table, not view
                .insert([submission]);

            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message);
            }

            console.log('Test result saved:', data);
        }

        // Show congratulations modal
        showCongratsModal();

    } catch (error) {
        console.error('Error submitting test:', error);
        alert('Ошибка отправки результатов: ' + error.message);
    }
}


// Show Congratulations Modal (replaces old success modal)
async function showCongratsModal() {
    const overlay = document.getElementById('congrats-modal');
    if (!overlay) { showLeadGenerationMessage(); return; }

    // Load CMS congrats text + WhatsApp if available
    try {
        if (window.supabaseApp || window.supabaseClient) {
            const sb = window.supabaseApp || window.supabaseClient;
            const { data: rows } = await sb.from('content_blocks')
                .select('key,value,video_url')
                .in('key', ['congrats_text', 'whatsapp_number']);
            
            if (rows) {
                const map = {};
                rows.forEach(r => { map[r.key] = { value: r.value, video: r.video_url }; });

                if (map.congrats_text) {
                    const msgEl = document.getElementById('congrats-message');
                    if (msgEl) msgEl.textContent = map.congrats_text.value;
                    
                    if (map.congrats_text.video) {
                        const embedUrl = convertToEmbedUrl(map.congrats_text.video, true);
                        const iframe = document.getElementById('congrats-video-iframe');
                        const wrap = document.getElementById('congrats-video-wrap');
                        if (iframe && embedUrl) {
                            iframe.src = embedUrl;
                            if (wrap) wrap.style.display = 'block';
                        }
                    }
                }
                
                if (map.whatsapp_number) {
                    const waBtn = document.getElementById('congrats-whatsapp-btn');
                    if (waBtn) {
                        const num = map.whatsapp_number.value.replace(/\D/g, '');
                        waBtn.href = `https://wa.me/${num}?text=Мен тесттин баарын тапшырдым!`;
                    }
                }
            }
        }
    } catch (e) { console.warn('Congrats modal CMS error:', e); }

    overlay.classList.add('active');
}

function showLeadGenerationMessage() {
    const modal = document.getElementById('success-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.success-modal-content, .modal-content, .success-content');
    if (modalContent) {
        modalContent.innerHTML = `
        <span class="close" onclick="closeSuccessModal()">×</span>
        <div class="success-icon">🎉</div>
        <h2 class="modal-title" style="margin-bottom: 16px;">Тест ийгиликтүү аяктады!</h2>
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: var(--gray-700); text-align: center; line-height: 1.6; margin: 0;">
                Натыйжалар <strong>жөнөтүлдү</strong>.
            </p>
        </div>
        <button class="btn btn-secondary" onclick="closeSuccessModal()" style="width: 100%;">Башкы бетке</button>
        `;
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
}

function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Navigate to landing page
    showLanding();
}


// Calculate topic analysis
function calculateTopicAnalysis() {
    if (!currentTest.topics || currentTest.topics.length === 0) {
        return null;
    }

    const topicStats = {};
    const answerKey = currentTest.answer_key;

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
    const answerKey = currentTest.answer_key;
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

// Load Videos for Landing Page
async function loadVideos() {
    // Try Loading from Supabase
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

    // Fallback / Empty
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



    // ==========================================
    // CRM & ADMIN FUNCTIONS
    // ==========================================

    // Load Student Results from Supabase
    async function loadStudentResults() {
        const tbody = document.getElementById('results-body');
        if (!tbody) return;

        if (!supabaseApp) {
            console.error('Supabase client not initialized');
            tbody.innerHTML = '<tr><td colspan="8" style="color: red; text-align: center; padding: 20px;">Ошибка: Supabase клиент не инициализирован. Проверьте подключение к интернету.</td></tr>';
            return;
        }

        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Загрузка данных...</td></tr>';

        try {
            console.log('Fetching CRM data from crm_student_results...');
            const { data, error } = await supabaseApp
                .from('crm_student_results')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase fetch error:', error);
                throw error;
            }

            console.log('CRM Data fetched:', data);
            window.allResults = data; // Store for filtering
            renderResults(data);

        } catch (error) {
            console.error('Error loading results:', error);
            tbody.innerHTML = `<tr><td colspan="8" style="color: red; text-align: center; padding: 20px;">Ошибка загрузки: ${error.message}</td></tr>`;
        }
    }

    // Make loadStudentResults globally accessible
    window.loadStudentResults = loadStudentResults;

    // Render Results Table
    function renderResults(data) {
        const tbody = document.getElementById('results-body');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Нет результатов</td></tr>';
            return;
        }

        data.forEach(row => {
            const date = new Date(row.created_at).toLocaleDateString('ru-RU');
            const studentName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
            const studentPhone = row.whatsapp || '-';
            const parentName = row.parent_name || '-';
            const parentPhone = row.parent_phone || '-';
            const region = row.region || '-';
            const oblast = row.oblast || '-';
            const testName = row.test_name || '-';
            const ortScore = row.scaled_score || row.ort_score || '-';

            // Правильные ответы в формате correct/total
            const totalQuestions = row.total_questions || 0;
            const correctAnswers = row.raw_score || 0;
            const scoreDisplay = `${correctAnswers}/${totalQuestions}`;

            // Format Phones
            const cleanStudent = studentPhone.replace(/\D/g, '');
            const cleanParent = parentPhone.replace(/\D/g, '');

            // Build topic analysis "weak topics" cell
            let weakTopicsHtml = '<span style="color:#999;font-size:12px;">—</span>';
            if (row.topic_analysis && Array.isArray(row.topic_analysis) && row.topic_analysis.length > 0) {
                const weak = row.topic_analysis.filter(t => t.percentage < 60);
                const topicId = `topic-${row.id}`;
                if (weak.length > 0) {
                    const tags = weak.map(t =>
                        `<span style="display:inline-block;background:#fff0f0;color:#e31e24;border:1px solid #fcc;border-radius:4px;padding:2px 6px;font-size:11px;margin:2px;">${t.topic}: ${t.percentage}%</span>`
                    ).join('');
                    weakTopicsHtml = `
                    <div>${tags}</div>
                    <button onclick="document.getElementById('${topicId}').style.display=document.getElementById('${topicId}').style.display==='none'?'block':'none'" 
                        style="font-size:11px;background:none;border:1px solid #ddd;border-radius:4px;padding:2px 8px;cursor:pointer;margin-top:4px;">Подробнее ▾</button>
                    <div id="${topicId}" style="display:none;margin-top:6px;">
                        ${row.topic_analysis.map(t => {
                        const c = t.percentage >= 70 ? '#10b981' : t.percentage >= 50 ? '#f59e0b' : '#e31e24';
                        return `<div style="font-size:11px;margin-bottom:4px;">
                                <span>${t.topic}: <b style="color:${c};">${t.percentage}%</b> (${t.correct}/${t.total})</span>
                                <div style="background:#eee;border-radius:3px;height:5px;margin-top:2px;">
                                    <div style="background:${c};width:${t.percentage}%;height:5px;border-radius:3px;"></div>
                                </div>
                            </div>`;
                    }).join('')}
                    </div>`;
                } else {
                    weakTopicsHtml = '<span style="color:#10b981;font-size:12px;">✅ Кайталоо жок</span>';
                }
            }

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';

            tr.innerHTML = `
            <td style="padding: 12px;">${date}</td>
            <td style="padding: 12px;">
                <strong>${studentName}</strong><br>
                <a href="tel:+${cleanStudent}" style="color: #666; text-decoration: none; font-size: 13px;">📞 ${studentPhone}</a>
            </td>
            <td style="padding: 12px;">
                <strong>${parentName}</strong><br>
                <a href="tel:+${cleanParent}" style="color: #666; text-decoration: none; margin-right: 8px; font-size: 13px;">📞 ${parentPhone}</a>
                ${cleanParent && cleanParent.length > 5 ? `<a href="https://wa.me/${cleanParent}" target="_blank" style="color: #25D366; text-decoration: none; font-size: 13px;">💬 WhatsApp</a>` : ''}
            </td>
            <td style="padding: 12px;">
                <strong>${region}</strong><br>
                <small style="color: #666;">${oblast}</small>
            </td>
            <td style="padding: 12px;">${testName}</td>
            <td style="padding: 12px;">
                <span style="font-weight: bold; color: #E31E24; font-size: 16px;">${ortScore}</span><br>
                <small style="color: #666;">${scoreDisplay}</small>
            </td>
            <td style="padding: 12px; min-width: 180px;">${weakTopicsHtml}</td>
            <td style="padding: 12px;">
                <button onclick="deleteStudent('${row.id}')" class="btn-delete" style="background: #e31e24; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background 0.3s;" onmouseover="this.style.background='#c01a1f'" onmouseout="this.style.background='#e31e24'" title="Удалить студента">
                    🗑️ Удалить
                </button>
            </td>
            <td style="padding: 12px;">
                <button class="btn-sm" onclick='generateCertificate(${JSON.stringify(row)})' style="padding: 6px 12px; background: #E31E24; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    📄 PDF
                </button>
            </td>
        `;
            tbody.appendChild(tr);
        });
    }

    // Filter Results — guard against allResults not loaded yet
    function filterResults() {
        if (!window.allResults) return;
        const query = document.getElementById('crm-search').value.toLowerCase();
        const filtered = window.allResults.filter(row => {
            const name = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
            const phone = (row.whatsapp || '').toLowerCase();
            return name.includes(query) || phone.includes(query);
        });
        renderResults(filtered);
    }

    // Make filterResults globally accessible
    window.filterResults = filterResults;


    // ==========================================
    // CRM & ADMIN FUNCTIONS — END
    // ==========================================

}); // end outer DOMContentLoaded

// showAdminPanel MUST be global — called from admin.js login handler
window.showAdminPanel = function () {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    if (typeof window.loadStudentResults === 'function') window.loadStudentResults();
    if (typeof loadAdminVideos === 'function') loadAdminVideos();
    if (typeof loadAdminContentBlocks === 'function') loadAdminContentBlocks();
};


// =====================================================
// GLOBAL LEAD FORM FUNCTIONS
// Must be at global scope so HTML onsubmit can call them
// =====================================================
window.submitLeadForm = function (event) {
    event.preventDefault();

    const firstName = (document.getElementById('firstName')?.value || '').trim();
    const lastName = (document.getElementById('lastName')?.value || '').trim();
    const whatsapp = (document.getElementById('whatsapp')?.value || '').trim();
    const region = (document.getElementById('region')?.value || '');
    const oblast = (document.getElementById('oblast')?.value || '').trim();
    const parentPhone = (document.getElementById('parentPhone')?.value || '').trim();
    const parentName = (document.getElementById('parentName')?.value || '').trim();

    if (!firstName || !lastName || !whatsapp || !region) {
        alert('\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0437\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0432\u0441\u0435 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u043f\u043e\u043b\u044f');
        return;
    }

    studentData = { firstName, lastName, whatsapp, region, oblast, parentPhone, parentName };

    // Close modal
    const modal = document.getElementById('lead-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }

    // Start test (async — awaits background photo fetch if still loading)
    startTest();
};

window.closeLeadForm = function () {
    const modal = document.getElementById('lead-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = '';
    }
    currentTest = null;
    _testLoadPromise = null;
};

