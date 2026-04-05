// Admin Authentication
const ADMIN_PASSWORD = 'Kerege2026';
let isAdminAuthenticated = false;

// Kyrgyzstan Regions
const REGIONS = [
    'Бишкек',
    'Ош',
    'Чуйская область',
    'Ошская область',
    'Джалал-Абадская область',
    'Баткенская область',
    'Нарынская область',
    'Иссык-Кульская область',
    'Таласская область'
];

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

    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput ? passwordInput.value : '';

    if (password === ADMIN_PASSWORD) {
        isAdminAuthenticated = true;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        loadAdminTests();
        loadAdminVideos();
        loadAdminContentBlocks(); // Load CMS content
        if (window.loadStudentResults) {
            window.loadStudentResults();
        }
    } else {
        alert('Неверный пароль');
        // Redirect on failed authentication
        redirectToLanding();
    }
}

// Toggle Password Visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('admin-password');
    const toggleIcon = document.getElementById('password-toggle-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = '🙈'; // Закрытый глаз
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = '👁️'; // Открытый глаз
    }
}

// Expose functions globally for HTML onclick/onsubmit
window.adminLogin = adminLogin;
window.togglePasswordVisibility = togglePasswordVisibility;
window.redirectToLanding = redirectToLanding;

// Initialize admin form when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Admin.js loaded');

    // Find the admin login form
    const adminForm = document.querySelector('#admin-login form');
    if (adminForm) {
        console.log('✅ Admin form found, attaching event listener');
        adminForm.addEventListener('submit', adminLogin);
    } else {
        console.log('⚠️ Admin form not found yet');
    }
});

// Load Tests for Admin
async function loadAdminTests() {
    if (!window.supabaseClient) {
        // Fallback or error
        document.getElementById('admin-tests-list').innerHTML = '<p>Supabase client not initialized</p>';
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('tests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            displayAdminTests(data);
        } else {
            document.getElementById('admin-tests-list').innerHTML = '<p>Нет загруженных тестов (Supabase)</p>';
        }

    } catch (error) {
        console.warn('Error loading admin tests (check if "tests" table exists):', error);
        document.getElementById('admin-tests-list').innerHTML =
            `<p style="color: orange;">Таблица 'tests' не найдена или пуста. <br> <small>${error.message}</small></p>`;
    }
}

function displayAdminTests(tests) {
    const container = document.getElementById('admin-tests-list');

    if (!tests || tests.length === 0) {
        container.innerHTML = '<p>Тесты еще не загружены</p>';
        return;
    }

    container.innerHTML = tests.map(test => {
        const isLinkOnly = test.is_link_only;
        const testLink = `${location.origin}${location.pathname}#test-${test.id}`;

        // Format access window
        let accessInfo = '';
        if (isLinkOnly) {
            let windowText = 'Всегда доступен';
            if (test.access_start || test.access_end) {
                const start = test.access_start ? new Date(test.access_start).toLocaleString('ru-RU') : '—';
                const end = test.access_end ? new Date(test.access_end).toLocaleString('ru-RU') : '—';
                windowText = `с ${start} по ${end}`;
            }
            accessInfo = `
                <div style="background:#fff0f0;border:1px solid #fcc;border-radius:6px;padding:10px;margin:8px 0;">
                    <p style="margin:0 0 6px;font-size:13px;color:#c01a1f;"><strong>🔗 Только по ссылке</strong> &bull; Время: ${windowText}</p>
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <input type="text" value="${testLink}" readonly id="link-${test.id}"
                            style="flex:1;font-size:12px;padding:5px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;min-width:0;">
                        <button onclick="copyTestLink('${test.id}')" 
                            style="background:#e31e24;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;white-space:nowrap;">
                            📋 Скопировать
                        </button>
                    </div>
                </div>`;
        }

        return `
        <div class="admin-test-item" style="border-left: 4px solid ${isLinkOnly ? '#e31e24' : '#ddd'};">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                <div>
                    <h4>${test.name} ${isLinkOnly ? '<span style="font-size:12px;background:#e31e24;color:white;padding:2px 8px;border-radius:4px;">🔗 По ссылке</span>' : ''}</h4>
                    <p><strong>Язык:</strong> ${test.language === 'RU' ? 'Русский' : 'Кыргызский'} &bull;
                       <strong>Длительность:</strong> ${test.duration} мин &bull;
                       <strong>Вопросов:</strong> ${test.answer_key ? test.answer_key.length : 0}
                    </p>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn" onclick="openLinkModal('${test.id}', '${escAdminStr(test.name)}')" 
                        style="padding:6px 14px;font-size:13px;background:#e31e24;color:white;border:none;border-radius:6px;cursor:pointer;">🔗 Ссылка</button>
                    <button class="btn btn-danger" onclick="deleteTest('${test.id}')" style="padding:6px 14px;font-size:13px;">Удалить</button>
                </div>
            </div>
            ${accessInfo}
        </div>`;
    }).join('');
}

// Escape helper for test names inside onclick attributes
function escAdminStr(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Delete Test
async function deleteTest(testId) {
    if (!confirm('Вы уверены, что хотите удалить этот тест? Это действие нельзя отменить.')) return;

    try {
        // First try to delete related records manually (in case CASCADE not set up)
        if (window.supabaseClient) {
            // Delete access links
            await window.supabaseClient.from('test_access_links').delete().eq('test_id', testId);
            // Delete results (cascade should handle this, but be explicit)
            await window.supabaseClient.from('test_results').delete().eq('test_id', testId).maybeSingle();
        }

        const { error } = await window.supabaseClient
            .from('tests')
            .delete()
            .eq('id', testId);

        if (error) throw error;
        showAdminToast('✅ Тест успешно удалён!', 'success');
        // Invalidate public test list cache so changes are visible immediately
        if (typeof invalidateTestsCache === 'function') invalidateTestsCache();
        loadAdminTests();
    } catch (error) {
        console.error('Error deleting test:', error);
        showAdminToast('❌ Ошибка: ' + error.message, 'error');
    }
}

// ── ACCESS LINK MODAL ──────────────────────────────────────────

function ensureLinkModalExists() {
    if (document.getElementById('admin-link-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'admin-link-modal';
    modal.style.cssText = `
        display:none; position:fixed; inset:0; background:rgba(0,0,0,.55);
        z-index:9999; align-items:center; justify-content:center;
    `;
    modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:32px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative;">
            <button onclick="closeLinkModal()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;color:#666;">✕</button>
            <h3 style="margin:0 0 6px;font-size:20px;">🔗 Генератор ссылки</h3>
            <p id="admin-link-test-name" style="color:#888;font-size:14px;margin:0 0 24px;"></p>

            <p style="font-size:14px;font-weight:600;margin:0 0 12px;color:#333;">Срок действия:</p>
            <div style="display:flex;gap:10px;margin-bottom:24px;">
                <button class="lm-dur-btn" onclick="setLinkDuration(this,1)" data-hours="1"
                    style="flex:1;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:15px;cursor:pointer;background:#f9fafb;font-weight:600;">1 час</button>
                <button class="lm-dur-btn" onclick="setLinkDuration(this,24)" data-hours="24"
                    style="flex:1;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:15px;cursor:pointer;background:#f9fafb;font-weight:600;">24 часа</button>
                <button class="lm-dur-btn" onclick="setLinkDuration(this,48)" data-hours="48"
                    style="flex:1;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-size:15px;cursor:pointer;background:#f9fafb;font-weight:600;">2 дня</button>
            </div>

            <button id="admin-link-gen-btn" onclick="generateAccessLink()" 
                style="width:100%;padding:14px;background:#e31e24;color:white;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:16px;"
                disabled>
                Выбрать срок и сгенерировать
            </button>

            <div id="admin-link-result" style="display:none;">
                <p style="font-size:13px;font-weight:600;color:#333;margin:0 0 8px;">Ваша ссылка:</p>
                <div style="display:flex;gap:8px;align-items:center;">
                    <input id="admin-link-url" readonly
                        style="flex:1;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;color:#333;background:#f9fafb;">
                    <button onclick="copyAccessLink()" 
                        style="padding:10px 16px;background:#e31e24;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;white-space:nowrap;">
                        📋 Скопировать
                    </button>
                </div>
                <p id="admin-link-expiry" style="font-size:12px;color:#888;margin:8px 0 0;"></p>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

let _linkModalTestId = null;
let _linkModalHours  = null;

function openLinkModal(testId, testName) {
    ensureLinkModalExists();
    _linkModalTestId = testId;
    _linkModalHours  = null;
    const modal = document.getElementById('admin-link-modal');
    modal.style.display = 'flex';
    document.getElementById('admin-link-test-name').textContent = testName;
    document.getElementById('admin-link-result').style.display = 'none';
    document.getElementById('admin-link-gen-btn').disabled = true;
    document.getElementById('admin-link-gen-btn').textContent = 'Выбрать срок и сгенерировать';
    // Reset duration buttons
    document.querySelectorAll('.lm-dur-btn').forEach(b => {
        b.style.borderColor = '#e5e7eb';
        b.style.background = '#f9fafb';
        b.style.color = '#333';
    });
}
window.openLinkModal = openLinkModal;

function closeLinkModal() {
    const modal = document.getElementById('admin-link-modal');
    if (modal) modal.style.display = 'none';
}
window.closeLinkModal = closeLinkModal;

function setLinkDuration(btn, hours) {
    _linkModalHours = hours;
    document.querySelectorAll('.lm-dur-btn').forEach(b => {
        b.style.borderColor = '#e5e7eb';
        b.style.background = '#f9fafb';
        b.style.color = '#333';
    });
    btn.style.borderColor = '#e31e24';
    btn.style.background = '#e31e24';
    btn.style.color = 'white';
    const genBtn = document.getElementById('admin-link-gen-btn');
    genBtn.disabled = false;
    genBtn.textContent = `Сгенерировать ссылку на ${hours === 1 ? '1 час' : hours === 24 ? '24 часа' : '2 дня'}`;
}
window.setLinkDuration = setLinkDuration;

async function generateAccessLink() {
    if (!_linkModalTestId || !_linkModalHours) return;
    const btn = document.getElementById('admin-link-gen-btn');
    btn.textContent = '⏳ Создаём...';
    btn.disabled = true;

    const expiresAt = new Date(Date.now() + _linkModalHours * 3600 * 1000).toISOString();

    try {
        const { data, error } = await window.supabaseClient
            .from('test_access_links')
            .insert([{ test_id: _linkModalTestId, expires_at: expiresAt }])
            .select('access_code, expires_at')
            .single();

        if (error) throw error;

        const origin = location.origin + location.pathname;
        const url = `${origin}?code=${data.access_code}`;
        document.getElementById('admin-link-url').value = url;
        document.getElementById('admin-link-expiry').textContent =
            `Действительна до: ${new Date(data.expires_at).toLocaleString('ru-RU')}`;
        document.getElementById('admin-link-result').style.display = 'block';

        btn.textContent = '✅ Ссылка создана';
        showAdminToast('🔗 Ссылка создана!', 'success');
    } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Повторить';
        showAdminToast('❌ Ошибка: ' + err.message, 'error');
    }
}
window.generateAccessLink = generateAccessLink;

function copyAccessLink() {
    const input = document.getElementById('admin-link-url');
    if (!input) return;
    input.select();
    input.setSelectionRange(0, 99999);
    try {
        navigator.clipboard.writeText(input.value);
    } catch (_) {
        document.execCommand('copy');
    }
    showAdminToast('📋 Ссылка скопирована!', 'success');
}
window.copyAccessLink = copyAccessLink;

// Admin toast notification (small, non-blocking)
function showAdminToast(message, type = 'success') {
    const old = document.getElementById('admin-toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:99999;
        background:${type === 'success' ? '#16a34a' : '#dc2626'};
        color:white;padding:12px 20px;border-radius:10px;
        font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.25);
        animation:fadeInUp .25s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
window.showAdminToast = showAdminToast;

// Upload Test with Multiple Photos and ORT Support
async function uploadTest(event) {
    event.preventDefault();

    if (!isAdminAuthenticated) {
        alert('Необходима авторизация');
        return;
    }

    const testName = document.getElementById('test-name').value;
    const testLanguage = document.getElementById('test-language').value;
    const testDuration = parseInt(document.getElementById('test-duration').value);
    const testPhotos = document.getElementById('test-photo').files;
    const answerKeyInput = document.getElementById('answer-key').value;

    // ORT-specific fields
    const testType = document.getElementById('test-type')?.value || 'standard';
    const questionTopicsInput = document.getElementById('question-topics')?.value || '';
    const questionWeightsInput = document.getElementById('question-weights')?.value || '';

    // Link-only + time window fields
    const isLinkOnly = document.getElementById('is-link-only')?.checked || false;
    const accessStartRaw = document.getElementById('access-start')?.value || '';
    const accessEndRaw = document.getElementById('access-end')?.value || '';
    const accessStart = accessStartRaw ? new Date(accessStartRaw).toISOString() : null;
    const accessEnd = accessEndRaw ? new Date(accessEndRaw).toISOString() : null;

    // Validate time window
    if (isLinkOnly && accessStart && accessEnd && new Date(accessStart) >= new Date(accessEnd)) {
        alert('Ошибка: дата окончания должна быть позже даты начала.');
        return;
    }

    // Validate inputs
    if (!testPhotos || testPhotos.length === 0) {
        alert('Пожалуйста, выберите хотя бы одно фото теста');
        return;
    }

    if (testPhotos.length > 40) {
        alert('Максимум 40 фотографий');
        return;
    }

    // Parse answer key - only A, B, C, D allowed
    const answerKey = answerKeyInput
        .split(',')
        .map(a => a.trim().toUpperCase())
        .filter(a => ['A', 'B', 'C', 'D'].includes(a));

    if (answerKey.length === 0) {
        alert('Пожалуйста, введите корректный ключ ответов');
        return;
    }

    // Parse ORT fields
    let questionTopics = null;
    let questionWeights = null;

    if (questionTopicsInput.trim()) {
        // Парсим как простой текст через запятую
        questionTopics = questionTopicsInput
            .split(',')
            .map(topic => topic.trim())
            .filter(topic => topic.length > 0);

        if (questionTopics.length !== answerKey.length) {
            alert(`Количество тем (${questionTopics.length}) должно совпадать с количеством вопросов (${answerKey.length})`);
            return;
        }
    }

    if (questionWeightsInput.trim()) {
        // Парсим как числа через запятую
        questionWeights = questionWeightsInput
            .split(',')
            .map(w => {
                const weight = parseFloat(w.trim());
                return isNaN(weight) ? 1 : weight;
            })
            .filter(w => w > 0);

        if (questionWeights.length !== answerKey.length) {
            alert(`Количество весов (${questionWeights.length}) должно совпадать с количеством вопросов (${answerKey.length})`);
            return;
        }
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = `Загрузка ${testPhotos.length} фото...`;
    submitBtn.disabled = true;

    try {
        // Convert all images to base64
        const photoUrls = [];
        for (let i = 0; i < testPhotos.length; i++) {
            const base64 = await fileToBase64(testPhotos[i]);
            photoUrls.push(base64);

            // Update progress
            submitBtn.textContent = `Обработка ${i + 1}/${testPhotos.length}...`;
        }

        submitBtn.textContent = 'Сохранение в Supabase...';

        // Prepare test data for Supabase
        const testData = {
            name: testName,
            language: testLanguage,
            duration: testDuration,
            answer_key: answerKey,
            photo_urls: photoUrls,
            test_type: testType,
            topics: questionTopics,
            weights: questionWeights,
            is_link_only: isLinkOnly,
            access_start: accessStart,
            access_end: accessEnd,
            created_at: new Date().toISOString()
        };

        // Save to Supabase
        if (window.supabaseClient) {
            const { data, error } = await window.supabaseClient
                .from('tests')
                .insert([testData])
                .select();

            if (error) {
                throw new Error(error.message);
            }

            const linkInfo = isLinkOnly
                ? `\n\n🔗 Ссылка для доступа:\n${location.origin}${location.pathname}#test-${data[0].id}`
                : '';
            alert(`✅ Тест успешно загружен!\n\nЗагружено ${testPhotos.length} фото.\nТип: ${testType}\nВопросов: ${answerKey.length}${linkInfo}`);
            document.getElementById('upload-test-form').reset();
            document.getElementById('access-window').style.display = 'none';
            loadAdminTests();
        } else {
            throw new Error('Supabase client not initialized');
        }
    } catch (error) {
        console.error('Error uploading test:', error);
        alert('Ошибка загрузки теста: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Video Management
// Load Videos
async function loadAdminVideos() {
    const container = document.getElementById('admin-videos-list');
    if (!container) return; // Fix "Cannot set properties of null"

    if (!window.supabaseClient) {
        container.innerHTML = '<p>Supabase client not initialized</p>';
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            displayAdminVideos(data);
        } else {
            container.innerHTML = '<p>Список видео пуст</p>';
        }

    } catch (error) {
        console.warn('Error loading videos:', error);
        container.innerHTML = `<p style="color: orange;">Таблица 'videos' не найдена. <br><small>${error.message}</small></p>`;
    }
}

function displayAdminVideos(videos) {
    const container = document.getElementById('admin-videos-list');

    if (!videos || videos.length === 0) {
        container.innerHTML = '<p>Видео еще не добавлены</p>';
        return;
    }

    container.innerHTML = videos.map(video => `
        <div class="admin-video-item">
            <h4>${video.title}</h4>
            <p><strong>Язык:</strong> ${video.language === 'RU' ? 'Русский' : 'Кыргызский'}</p>
            <p><strong>URL:</strong> <a href="${video.url}" target="_blank">${video.url}</a></p>
            <button class="btn btn-danger" onclick="deleteVideo('${video.id}')">Удалить</button>
        </div>
    `).join('');
}

async function addVideo(event) {
    event.preventDefault();

    const title = document.getElementById('video-title').value;
    const url = document.getElementById('video-url').value;
    const language = document.getElementById('video-language').value;

    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'addVideo',
                data: { title, url, language }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            alert('Видео успешно добавлено!');
            document.getElementById('add-video-form').reset();
            loadAdminVideos();
        } else {
            alert('Ошибка добавления видео: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error adding video:', error);
        alert('Ошибка добавления видео');
    }
}

async function deleteVideo(videoId) {
    if (!confirm('Удалить это видео?')) {
        return;
    }

    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'deleteVideo',
                data: { videoId }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            alert('Видео удалено!');
            loadAdminVideos();
        } else {
            alert('Ошибка удаления видео: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error deleting video:', error);
        alert('Ошибка удаления видео');
    }
}

// Certificate Generator (Manual)
async function manualGenerateCertificate(event) {
    event.preventDefault();

    const fullName = document.getElementById('cert-name').value;
    const score = document.getElementById('cert-score').value;
    const testName = document.getElementById('cert-test').value;

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Генерация...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'generateCertificate',
                data: { fullName, score, testName }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            alert('Сертификат создан!');
            window.open(data.pdfUrl, '_blank');
            document.getElementById('certificate-form').reset();
        } else {
            alert('Ошибка создания сертификата: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error generating certificate:', error);
        alert('Ошибка создания сертификата');
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
            // Keep data URL prefix (e.g., "data:image/png;base64,...")
            // const base64 = reader.result.split(',')[1];
            resolve(reader.result);
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


// Video Management Functions - Added
async function saveVideo() {
    const title = document.getElementById('video-title').value;
    const url = document.getElementById('video-url').value;
    const lang = document.getElementById('video-language').value;

    if (!title || !url) {
        alert('Заполните все поля');
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from('marketing_videos')
            .insert([{ title, youtube_url: url, language: lang }]);

        if (error) throw error;

        alert('Видео добавлено успешно!');
        document.getElementById('video-form').reset();
        loadAdminVideos();

    } catch (e) {
        console.error('Error saving video:', e);
        alert('Ошибка сохранения: ' + e.message);
    }
}

async function deleteVideo(id) {
    if (!confirm('Вы уверены, что хотите удалить это видео?')) return;

    try {
        const { error } = await window.supabaseClient
            .from('marketing_videos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        loadAdminVideos();

    } catch (e) {
        console.error('Error deleting video:', e);
        alert('Ошибка удаления: ' + e.message);
    }
}

// Delete Student from CRM
async function deleteStudent(studentId) {
    if (!window.supabaseClient) {
        alert('Supabase не подключен');
        return;
    }

    // Get student name for confirmation
    const row = document.querySelector(`button[onclick="deleteStudent('${studentId}')"]`)?.closest('tr');
    const studentName = row?.querySelector('td:nth-child(2)')?.textContent.split('\n')[0] || 'этого студента';

    if (!confirm(`Удалить студента "${studentName}"?\n\nЭто действие нельзя отменить!`)) {
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from('test_results') // Changed to correct table
            .delete()
            .eq('id', studentId);

        if (error) throw error;

        alert('Студент успешно удален');

        // Reload student results
        if (typeof loadStudentResults === 'function') {
            loadStudentResults();
        }

    } catch (e) {
        console.error('Error deleting student:', e);
        alert('Ошибка удаления студента: ' + e.message);
    }
}

// Make deleteStudent globally accessible
window.deleteStudent = deleteStudent;

// Make loadAdminVideos global so app.js can call it
window.loadAdminVideos = async function () {
    const container = document.getElementById('admin-videos-list');
    if (!container) return;

    if (!window.supabaseClient) {
        container.innerHTML = '<p>Supabase client not initialized</p>';
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('marketing_videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p>Нет загруженных видео</p>';
            return;
        }

        container.innerHTML = data.map(video => `
            <div class="admin-test-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${video.title}</strong> (${video.language === 'RU' ? 'RU' : 'KG'})<br>
                    <small><a href="${video.youtube_url}" target="_blank">${video.youtube_url}</a></small>
                </div>
                <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;" onclick="deleteVideo('${video.id}')">Удалить</button>
            </div>
        `).join('');
    } catch (error) {
        console.warn('Error loading videos:', error);
        container.innerHTML = `<p style="color: orange;">Ошибка загрузки видео: ${error.message}</p>`;
    }
}

// CMS Management
async function loadAdminContentBlocks() {
    const container = document.getElementById('admin-cms-list');
    if (!container || !window.supabaseClient) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('content_blocks')
            .select('*')
            .order('key');

        if (error) throw error;

        if (data && data.length > 0) {
            renderAdminCMS(data);
        } else {
            container.innerHTML = '<p>Контент не найден. Запустите миграцию CMS.</p>';
        }
    } catch (e) {
        console.error('CMS Load Error:', e);
        container.innerHTML = `<p style="color: red">Ошибка: ${e.message}</p>`;
    }
}

function renderAdminCMS(blocks) {
    const container = document.getElementById('admin-cms-list');
    container.innerHTML = blocks.map(block => `
        <div class="cms-card" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fff;">
            <div style="margin-bottom: 10px;">
                <label style="display:block; font-size: 12px; color: #666;">Иконка (эмодзи)</label>
                <input type="text" id="cms-icon-${block.key}" value="${block.icon}" style="width: 50px; text-align: center; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display:block; font-size: 12px; color: #666;">Заголовок</label>
                <input type="text" id="cms-title-${block.key}" value="${block.title}" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display:block; font-size: 12px; color: #666;">Описание</label>
                <textarea id="cms-desc-${block.key}" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;" rows="3">${block.description}</textarea>
            </div>
            <button class="btn btn-primary" style="width: 100%; font-size: 14px; padding: 8px;" onclick="saveContentBlock('${block.key}')">Сохранить</button>
        </div>
    `).join('');
}

async function saveContentBlock(key) {
    const icon = document.getElementById(`cms-icon-${key}`).value;
    const title = document.getElementById(`cms-title-${key}`).value;
    const description = document.getElementById(`cms-desc-${key}`).value;

    try {
        const { error } = await window.supabaseClient
            .from('content_blocks')
            .update({ icon, title, description, updated_at: new Date() })
            .eq('key', key);

        if (error) throw error;
        alert('Сохранено!');
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
}

// Export specific functions
window.loadAdminContentBlocks = loadAdminContentBlocks;
window.saveContentBlock = saveContentBlock;

// Admin Navigation Logic
function toggleAdminMenu() {
    const menu = document.getElementById('admin-menu');
    menu.classList.toggle('active');
}

function switchAdminSection(sectionId, title) {
    // 1. Hide all tabs
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // 2. Show selected tab
    const selectedTab = document.getElementById(`section-${sectionId}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // 3. Update Title
    const titleEl = document.getElementById('current-section-title');
    if (titleEl && title) {
        titleEl.textContent = title;
    }

    // 4. Update Menu Active State
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        if (item.getAttribute('onclick').includes(sectionId)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 5. Close Menu
    document.getElementById('admin-menu').classList.remove('active');
}

window.toggleAdminMenu = toggleAdminMenu;
window.switchAdminSection = switchAdminSection;

// =====================================================
// Link-Only Helpers
// =====================================================

// Toggle access window date fields visibility
function toggleAccessWindow(show) {
    const panel = document.getElementById('access-window');
    if (panel) {
        panel.style.display = show ? 'block' : 'none';
        if (!show) {
            // Clear values when hidden
            const startEl = document.getElementById('access-start');
            const endEl = document.getElementById('access-end');
            if (startEl) startEl.value = '';
            if (endEl) endEl.value = '';
        }
    }
}

// Copy test link to clipboard
async function copyTestLink(testId) {
    const linkEl = document.getElementById(`link-${testId}`);
    if (!linkEl) return;

    const url = linkEl.value;
    try {
        await navigator.clipboard.writeText(url);

        // Visual feedback
        const btn = linkEl.nextElementSibling;
        const original = btn.innerHTML;
        btn.innerHTML = '✅ Скопировано!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.background = '#e31e24';
        }, 2000);
    } catch (e) {
        // Fallback for older browsers
        linkEl.select();
        document.execCommand('copy');
        alert('Ссылка скопирована: ' + url);
    }
}

window.toggleAccessWindow = toggleAccessWindow;
window.copyTestLink = copyTestLink;

// =====================================================
// Admin Test Tabs (Constructor vs PDF)
// =====================================================
function switchTestAdminTab(tab) {
    document.querySelectorAll('.admin-test-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-test-tab-panel').forEach(p => p.classList.remove('active'));

    const activePanelId = 'admin-test-tab-' + tab;
    const activePanel = document.getElementById(activePanelId);
    if (activePanel) activePanel.classList.add('active');

    document.querySelectorAll('.admin-test-tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tab}'`)) {
            btn.classList.add('active');
        }
    });
}
window.switchTestAdminTab = switchTestAdminTab;

// =====================================================
// SECTIONED TEST BUILDER (NEW)
// =====================================================
let _testSections = [];

function addTestSection() {
    const id = Date.now();
    const section = { 
        id, 
        type: 'test', 
        title: '', 
        timer: 30, 
        file: null, 
        videoUrl: '',
        questions_count: 0,
        questions_config: [] // Array of { correct_answer, options_count }
    };
    _testSections.push(section);
    renderSections();
}
window.addTestSection = addTestSection;

function removeSection(id) {
    _testSections = _testSections.filter(s => s.id !== id);
    renderSections();
}
window.removeSection = removeSection;

function renderSections() {
    const container = document.getElementById('sections-list');
    if (!container) return;

    container.innerHTML = _testSections.map((s, index) => `
        <div class="test-section-card" data-id="${s.id}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h5 style="margin:0;">Раздел #${index + 1}</h5>
                <button type="button" class="btn btn-danger btn-sm" onclick="removeSection(${s.id})">✕ Удалить</button>
            </div>
            
            <div class="form-group">
                <label>Тип раздела</label>
                <select onchange="updateSectionField(${s.id}, 'type', this.value)">
                    <option value="test" ${s.type === 'test' ? 'selected' : ''}>📄 Тест (PDF)</option>
                    <option value="break" ${s.type === 'break' ? 'selected' : ''}>☕ Перерыв (Видео)</option>
                </select>
            </div>

            <div class="form-group">
                <label>Заголовок раздела</label>
                <input type="text" value="${s.title}" placeholder="Мисалы: Математика 1-бөлүк" 
                       oninput="updateSectionField(${s.id}, 'title', this.value)">
            </div>

            <div class="form-group">
                <label>Время (в минутах)</label>
                <input type="number" value="${s.timer}" min="1" 
                       oninput="updateSectionField(${s.id}, 'timer', this.value)">
            </div>

            ${s.type === 'test' ? `
                <div class="form-group">
                    <label>PDF Файл</label>
                    <div class="pdf-drop-zone ${s.file ? 'has-file' : ''}" onclick="document.getElementById('file-input-${s.id}').click()">
                        ${s.file ? `✅ ${s.file.name}` : '📄 Выбрать PDF'}
                    </div>
                    <input type="file" id="file-input-${s.id}" accept=".pdf" style="display:none;" 
                           onchange="handleSectionFileSelect(${s.id}, event)">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:10px;">
                    <div class="form-group">
                        <label>Кол-во вопросов</label>
                        <input type="number" value="${s.questions_count || ''}" placeholder="Напр: 30" 
                               oninput="updateSectionField(${s.id}, 'questions_count', parseInt(this.value) || 0)">
                    </div>
                    <div class="form-group" style="display:flex; align-items:flex-end;">
                        <button type="button" class="btn btn-secondary" style="width:100%; height:40px;" 
                                onclick="openAnswerKeyEditor(${s.id})">
                             🔑 Ключи ответов (${(s.questions_config || []).filter(q => q.correct_answer).length}/${s.questions_count || 0})
                        </button>
                    </div>
                </div>
            ` : `
                <div class="form-group">
                    <label>Ссылка на видео (YouTube/MP4)</label>
                    <input type="text" value="${s.videoUrl}" placeholder="https://..." 
                           oninput="updateSectionField(${s.id}, 'videoUrl', this.value)">
                </div>
            `}
        </div>
    `).join('');
}

function updateSectionField(id, field, value) {
    const section = _testSections.find(s => s.id === id);
    if (section) {
        section[field] = value;
        if (field === 'type') renderSections(); // Re-render for conditional fields
    }
}
window.updateSectionField = updateSectionField;

function handleSectionFileSelect(id, event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert('Пожалуйста, выберите PDF файл.');
        event.target.value = '';
        return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20 MB limit
        alert('Файл слишком большой. Максимальный размер: 20 МБ.');
        event.target.value = '';
        return;
    }

    updateSectionField(id, 'file', file);
    renderSections();
}
window.handleSectionFileSelect = handleSectionFileSelect;

async function saveSectionedTest() {
    const name = document.getElementById('sec-test-name')?.value?.trim();
    const language = document.getElementById('sec-test-language')?.value || 'KG';
    const isLinkOnly = document.getElementById('sec-test-is-link')?.checked || false;

    if (!name) { alert('Введите название теста'); return; }
    if (_testSections.length === 0) { alert('Добавьте хотя бы один раздел'); return; }

    // Validation: All test sections must have PDF and all keys set
    for (const s of _testSections) {
        if (s.type === 'test') {
            if (!s.file) { alert(`Загрузите PDF для раздела "${s.title || 'без названия'}"`); return; }
            if (!s.questions_count || s.questions_count <= 0) { alert(`Укажите кол-во вопросов для раздела "${s.title}"`); return; }
            
            const answered = (s.questions_config || []).filter(q => q.correct_answer).length;
            if (answered < s.questions_count) {
                if (!confirm(`В разделе "${s.title}" указаны не все ключи (${answered}/${s.questions_count}). Продолжить сохранение?`)) return;
            }
        }
    }
    
    const submitBtn = document.getElementById('save-sec-test-btn');
    const origText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Сохранение разделов...';

    try {
        const sectionsData = [];
        
        for (let i = 0; i < _testSections.length; i++) {
            const s = _testSections[i];
            const sectionItem = {
                type: s.type,
                title: s.title || `Раздел ${i + 1}`,
                timer_seconds: (parseInt(s.timer) || 30) * 60
            };

            if (s.type === 'test') {
                if (!s.file) throw new Error(`Выберите PDF для раздела "${sectionItem.title}"`);
                
                submitBtn.textContent = `⏳ Загрузка PDF (${i + 1}/${_testSections.length})...`;
                
                // Upload to Supabase Storage
                const fileName = `${Date.now()}_${s.file.name.replace(/\s+/g, '_')}`;
                const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                    .from('tests')
                    .upload(`${fileName}`, s.file);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: urlData } = window.supabaseClient.storage
                    .from('tests')
                    .getPublicUrl(fileName);

                sectionItem.pdf_url = urlData.publicUrl;
                sectionItem.questions_count = s.questions_count;
                sectionItem.questions_config = s.questions_config;
            } else {
                sectionItem.video_url = s.videoUrl;
            }
            
            sectionsData.push(sectionItem);
        }

        submitBtn.textContent = '⏳ Сохранение в базу...';

        // Flatten answer_key for compatibility with old grading logic if needed
        const flatAnswerKey = [];
        sectionsData.forEach(s => {
            if (s.type === 'test' && s.questions_config) {
                s.questions_config.forEach(q => flatAnswerKey.push(q.correct_answer || ''));
            }
        });

        const testData = {
            name,
            language,
            is_link_only: isLinkOnly,
            answer_key: flatAnswerKey,
            sections: sectionsData,
            is_pdf: true, 
            duration: sectionsData.reduce((acc, s) => acc + (s.timer_seconds / 60), 0),
            created_at: new Date().toISOString()
        };

        const { error: dbError } = await window.supabaseClient
            .from('tests')
            .insert([testData]);

        if (dbError) throw dbError;

        showAdminToast('✅ Тест успешно создан!', 'success');
        
        // Reset form
        _testSections = [];
        const form = document.getElementById('sectioned-test-form');
        if (form) form.reset();
        renderSections();
        loadAdminTests();

    } catch (err) {
        console.error('Save error:', err);
        showAdminToast('❌ Ошибка: ' + err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
    }
}
window.saveSectionedTest = saveSectionedTest;

// ── Answer Key Editor State & Logic ──
let _akState = {
    sectionId: null,
    pdfUrl: null
};

async function openAnswerKeyEditor(sectionId) {
    const section = _testSections.find(s => s.id === sectionId);
    if (!section) return;

    _akState.sectionId = sectionId;
    
    // Set PDF Preview
    const iframe = document.getElementById('ak-pdf-iframe');
    const placeholder = document.getElementById('ak-pdf-placeholder');
    
    if (section.file) {
        const fileUrl = URL.createObjectURL(section.file);
        iframe.src = fileUrl;
        iframe.style.display = 'block';
        placeholder.style.display = 'none';
        _akState.pdfUrl = fileUrl;
    } else {
        iframe.src = '';
        iframe.style.display = 'none';
        placeholder.style.display = 'flex';
    }

    document.getElementById('ak-editor-section-name').textContent = section.title || `Раздел #${_testSections.indexOf(section) + 1}`;
    document.getElementById('ak-editor-overlay').classList.add('active');
    
    // Ensure questions_config matches questions_count
    syncQuestionsConfig(section);
    renderAnswerKeyList();
}
window.openAnswerKeyEditor = openAnswerKeyEditor;

function syncQuestionsConfig(section) {
    const count = section.questions_count || 0;
    if (!section.questions_config) section.questions_config = [];
    
    if (section.questions_config.length < count) {
        for (let i = section.questions_config.length; i < count; i++) {
            section.questions_config.push({ correct_answer: '', options_count: 4 });
        }
    } else if (section.questions_config.length > count) {
        section.questions_config = section.questions_config.slice(0, count);
    }
}

function renderAnswerKeyList() {
    const section = _testSections.find(s => s.id === _akState.sectionId);
    if (!section) return;

    const container = document.getElementById('ak-keys-list');
    const config = section.questions_config || [];

    if (config.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Укажите количество вопросов в разделе, чтобы начать</div>';
        return;
    }

    container.innerHTML = config.map((q, i) => {
        const options = ['A', 'B', 'C', 'D'];
        if (q.options_count === 5) options.push('E');
        
        const displayOptions = { 'A': 'А', 'B': 'Б', 'C': 'В', 'D': 'Г', 'E': 'Д' };

        const buttons = options.map(opt => `
            <button class="ak-opt-btn ${q.correct_answer === opt ? 'selected' : ''}" 
                    onclick="selectKeyOption(${i}, '${opt}')">
                ${displayOptions[opt]}
            </button>
        `).join('');

        return `
            <div class="ak-key-row">
                <div class="ak-key-num">${i + 1}.</div>
                <div class="ak-options-row">
                    ${buttons}
                </div>
                ${q.options_count === 4 
                    ? `<button class="ak-add-d-btn" onclick="toggleOptionD(${i}, true)">+ Д</button>`
                    : `<button class="ak-remove-d-btn" onclick="toggleOptionD(${i}, false)">✕</button>`
                }
            </div>
        `;
    }).join('');
}

function selectKeyOption(qIdx, option) {
    const section = _testSections.find(s => s.id === _akState.sectionId);
    if (!section) return;

    section.questions_config[qIdx].correct_answer = option;
    renderAnswerKeyList();
    // Debounced UI update for the main section builder (counter update)
    renderSections();
}
window.selectKeyOption = selectKeyOption;

function toggleOptionD(qIdx, enable) {
    const section = _testSections.find(s => s.id === _akState.sectionId);
    if (!section) return;

    section.questions_config[qIdx].options_count = enable ? 5 : 4;
    if (!enable && section.questions_config[qIdx].correct_answer === 'E') {
        section.questions_config[qIdx].correct_answer = '';
    }
    renderAnswerKeyList();
}
window.toggleOptionD = toggleOptionD;

function toggleBulkOptionD(enable) {
    const section = _testSections.find(s => s.id === _akState.sectionId);
    if (!section) return;

    section.questions_config.forEach(q => {
        q.options_count = enable ? 5 : 4;
        if (!enable && q.correct_answer === 'E') q.correct_answer = '';
    });
    renderAnswerKeyList();
}
window.toggleBulkOptionD = toggleBulkOptionD;

function closeAnswerKeyEditor() {
    document.getElementById('ak-editor-overlay').classList.remove('active');
    if (_akState.pdfUrl) {
        URL.revokeObjectURL(_akState.pdfUrl);
        _akState.pdfUrl = null;
    }
}
window.closeAnswerKeyEditor = closeAnswerKeyEditor;

// =====================================================
// CMS Settings — Individual key save/load
// =====================================================
async function loadCMSSettings() {
    if (!window.supabaseClient) return;
    try {
        const { data } = await window.supabaseClient
            .from('content_blocks')
            .select('key,value,video_url')
            .in('key', ['whatsapp_number', 'landing_hero_title', 'landing_hero_subtitle', 'company_description', 'congrats_text']);

        if (!data) return;
        const map = {};
        data.forEach(r => { map[r.key] = { value: r.value, video: r.video_url }; });

        const fields = {
            'whatsapp_number': { text: 'cms-whatsapp' },
            'landing_hero_title': { text: 'cms-landing-title', video: 'cms-landing-title-video' },
            'landing_hero_subtitle': { text: 'cms-landing-subtitle', video: 'cms-landing-subtitle-video' },
            'company_description': { text: 'cms-company-desc', video: 'cms-company-video' },
            'congrats_text': { text: 'cms-congrats-text', video: 'cms-congrats-video' }
        };

        Object.entries(fields).forEach(([key, cfg]) => {
            if (!map[key]) return;
            const textEl = document.getElementById(cfg.text);
            if (textEl) textEl.value = map[key].value || '';
            
            if (cfg.video) {
                const videoEl = document.getElementById(cfg.video);
                if (videoEl) videoEl.value = map[key].video || '';
            }
        });
    } catch (e) { console.warn('CMS load error:', e); }
}
window.loadCMSSettings = loadCMSSettings;

async function saveCMSSetting(key, inputId, videoInputId = null) {
    const el = document.getElementById(inputId);
    if (!el) return;
    const value = el.value.trim();
    
    let video_url = null;
    if (videoInputId) {
        const videoEl = document.getElementById(videoInputId);
        if (videoEl) video_url = videoEl.value.trim();
    }

    try {
        // Fix for NOT NULL constraint: provide defaults for icon, title, description if not present
        // We use upsert to create or update. 
        const { error } = await window.supabaseClient
            .from('content_blocks')
            .upsert([{ 
                key, 
                value, 
                video_url,
                label: key, 
                icon: '⚙️', 
                title: key, 
                description: 'CMS Settings',
                updated_at: new Date().toISOString() 
            }], { onConflict: 'key' });

        if (error) throw error;
        showAdminToast('✅ Сохранено!', 'success');

        // Live-update WhatsApp links if applicable
        if (key === 'whatsapp_number') {
            const num = value.replace(/\D/g, '');
            document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a => {
                const msg = a.href.split('?')[1] || '';
                a.href = `https://wa.me/${num}${msg ? '?' + msg : ''}`;
            });
        }
    } catch (err) {
        showAdminToast('❌ Ошибка: ' + err.message, 'error');
    }
}
window.saveCMSSetting = saveCMSSetting;

// Load CMS settings when admin content is shown
const _origAdminLogin = window.adminLogin;
window.adminLogin = function(event) {
    if (_origAdminLogin) _origAdminLogin(event);
    // After login, load CMS settings
    setTimeout(loadCMSSettings, 500);
};
