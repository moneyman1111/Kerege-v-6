// Student Results Dashboard - Kerege Synak
// Displays ORT scores and topic analysis for students

// Supabase Configuration
const SUPABASE_URL = 'https://jxlpuqbmjvqrqsqxqvkl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHB1cWJtanZxcnFzcXhxdmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NTQzNTEsImV4cCI6MjA1NTAzMDM1MX0.Kw_yxLGqZOECZXvVIGWHUGNJWlbCJSjPBMxqaT8Ypzs';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const searchForm = document.getElementById('search-form');
const searchPhone = document.getElementById('search-phone');
const resultsContainer = document.getElementById('results-container');
const noResults = document.getElementById('no-results');

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

// Check URL parameters on load
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone');

    if (phone) {
        searchPhone.value = phone;
        loadResults(phone);
    }
});

/**
 * Handle search form submission
 */
async function handleSearch(event) {
    event.preventDefault();

    const phone = searchPhone.value.trim();
    if (!phone) {
        alert('Пожалуйста, введите номер телефона');
        return;
    }

    await loadResults(phone);
}

/**
 * Load student results from Supabase
 */
async function loadResults(phone) {
    try {
        // Show loading state
        resultsContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><p>Загрузка результатов...</p></div>';
        noResults.style.display = 'none';

        // Normalize phone number (remove spaces, dashes, etc.)
        const normalizedPhone = phone.replace(/\D/g, '');

        // Query Supabase
        const { data, error } = await supabase
            .from('test_results')
            .select('*')
            .or(`parent_phone.ilike.%${normalizedPhone}%,whatsapp.ilike.%${normalizedPhone}%`)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            // No results found
            resultsContainer.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        // Display results
        displayResults(data);

    } catch (error) {
        console.error('Error loading results:', error);
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #E31E24;">
                <p>❌ Ошибка загрузки результатов</p>
                <p style="font-size: 14px; color: #666;">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Display results in the UI
 */
function displayResults(results) {
    resultsContainer.innerHTML = '';
    noResults.style.display = 'none';

    results.forEach(result => {
        const card = createResultCard(result);
        resultsContainer.appendChild(card);
    });
}

/**
 * Create a result card element
 */
function createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';

    // Parse data
    const studentName = result.student_name || `${result.first_name || ''} ${result.last_name || ''}`.trim() || 'Студент';
    const testName = result.test_name || 'Тест';
    const createdAt = new Date(result.created_at).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Scores
    const rawScore = result.raw_score || result.correct_count || 0;
    const totalQuestions = result.total_questions || 60;
    const scaledScore = result.scaled_score || result.score || 0;
    const percentage = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 100) : 0;
    const incorrectCount = totalQuestions - rawScore;

    // Topic Analysis
    const topicAnalysis = result.topic_analysis || [];

    card.innerHTML = `
        <div class="result-header">
            <div class="result-title">
                <h3>${testName}</h3>
                <div class="result-date">📅 ${createdAt}</div>
                <div class="result-date" style="margin-top: 4px;">👤 ${studentName}</div>
            </div>
            ${scaledScore > 0 ? `
                <div class="ort-score-badge">
                    <div class="label">Балл ОРТ</div>
                    <div class="score">${scaledScore}</div>
                    <div class="max">из 245</div>
                </div>
            ` : ''}
        </div>
        
        <div class="result-stats">
            <div class="stat-item">
                <div class="stat-value correct">${rawScore}</div>
                <div class="stat-label">Правильных</div>
            </div>
            <div class="stat-item">
                <div class="stat-value incorrect">${incorrectCount}</div>
                <div class="stat-label">Ошибок</div>
            </div>
            <div class="stat-item">
                <div class="stat-value percentage">${percentage}%</div>
                <div class="stat-label">Процент</div>
            </div>
        </div>
        
        ${topicAnalysis && topicAnalysis.length > 0 ? `
            <div class="topic-analysis-section">
                <h4>📊 Анализ по темам</h4>
                ${topicAnalysis.map(topic => createTopicItem(topic)).join('')}
            </div>
        ` : ''}
    `;

    return card;
}

/**
 * Create topic analysis item HTML
 */
function createTopicItem(topic) {
    const percentage = topic.percentage || 0;
    const level = percentage >= 70 ? 'high' : (percentage >= 50 ? 'medium' : 'low');

    return `
        <div class="topic-item ${level}">
            <div class="topic-header">
                <div class="topic-name">${topic.topic || 'Неизвестная тема'}</div>
                <div class="topic-score">
                    <div class="topic-percentage ${level}">${percentage}%</div>
                    <div class="topic-count">${topic.correct || 0}/${topic.total || 0}</div>
                </div>
            </div>
            <div class="topic-progress">
                <div class="topic-progress-bar ${level}" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}

/**
 * Format phone number for display
 */
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
}
