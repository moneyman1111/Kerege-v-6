// Admin Authentication
const ADMIN_PASSWORD = 'Kerege2026';
let isAdminAuthenticated = false;

// Security Gate: Redirect to landing if unauthorized
function redirectToLanding() {
    window.location.hash = '';
    isAdminAuthenticated = false;
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-content').style.display = 'none';
    // Force show landing page
    setTimeout(() => {
        if (typeof showLanding === 'function') {
            showLanding();
        }
    }, 100);
}

// Admin Login
function adminLogin(event) {
    event.preventDefault();

    const password = document.getElementById('admin-password').value;

    if (password === ADMIN_PASSWORD) {
        isAdminAuthenticated = true;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        loadAdminTests();
    } else {
        alert('Неверный пароль');
        // Redirect on failed authentication
        redirectToLanding();
    }
}

// Load Tests for Admin
async function loadAdminTests() {
    try {
        const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getTests`);
        const data = await response.json();

        if (data.success) {
            displayAdminTests(data.tests);
        } else {
            document.getElementById('admin-tests-list').innerHTML = '<p>Ошибка загрузки тестов</p>';
        }
    } catch (error) {
        console.error('Error loading admin tests:', error);
        document.getElementById('admin-tests-list').innerHTML = '<p>Ошибка загрузки тестов</p>';
    }
}

function displayAdminTests(tests) {
    const container = document.getElementById('admin-tests-list');

    if (!tests || tests.length === 0) {
        container.innerHTML = '<p>Тесты еще не загружены</p>';
        return;
    }

    container.innerHTML = tests.map(test => `
        <div class="admin-test-item">
            <h4>${test.name}</h4>
            <p><strong>Язык:</strong> ${test.language === 'RU' ? 'Русский' : 'Кыргызский'}</p>
            <p><strong>Длительность:</strong> ${test.duration} минут</p>
            <p><strong>Вопросов:</strong> ${test.answerKey.length}</p>
            <p><strong>ID:</strong> ${test.id}</p>
        </div>
    `).join('');
}

// Upload Test
async function uploadTest(event) {
    event.preventDefault();

    if (!isAdminAuthenticated) {
        alert('Необходима авторизация');
        return;
    }

    const testName = document.getElementById('test-name').value;
    const testLanguage = document.getElementById('test-language').value;
    const testDuration = parseInt(document.getElementById('test-duration').value);
    const testPhoto = document.getElementById('test-photo').files[0];
    const answerKeyInput = document.getElementById('answer-key').value;

    // Validate inputs
    if (!testPhoto) {
        alert('Пожалуйста, выберите фото теста');
        return;
    }

    // Parse answer key
    const answerKey = answerKeyInput
        .split(',')
        .map(a => a.trim().toUpperCase())
        .filter(a => ['A', 'B', 'C', 'D', 'E'].includes(a));

    if (answerKey.length === 0) {
        alert('Пожалуйста, введите корректный ключ ответов');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Загрузка...';
    submitBtn.disabled = true;

    try {
        // Convert image to base64
        const base64Image = await fileToBase64(testPhoto);

        // Prepare test data
        const testData = {
            name: testName,
            language: testLanguage,
            duration: testDuration,
            answerKey: answerKey,
            photo: base64Image,
            photoName: testPhoto.name
        };

        // Submit to Google Apps Script
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'uploadTest',
                data: testData
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Тест успешно загружен!');
            document.getElementById('upload-test-form').reset();
            loadAdminTests();
        } else {
            alert('Ошибка загрузки теста: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error uploading test:', error);
        alert('Ошибка загрузки теста. Пожалуйста, попробуйте снова.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Helper: Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Security: Monitor admin route and enforce authentication
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is trying to access admin panel
    if (window.location.hash === '#keregemanager') {
        // Show admin page with login gate
        if (typeof showAdminPage === 'function') {
            showAdminPage();
        }
    }
});

// Intercept attempts to close admin login without authentication
window.addEventListener('hashchange', () => {
    // If user navigates away from admin route, reset authentication
    if (window.location.hash !== '#keregemanager') {
        isAdminAuthenticated = false;
    }
});
