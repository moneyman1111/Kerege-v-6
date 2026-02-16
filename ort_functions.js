// ORT Scoring and Analytics Functions

/**
 * Calculate ORT scaled score (55-245) from raw score
 */
function calculateScaledScore(rawScore, totalQuestions) {
    if (totalQuestions === 0) return 55;

    // ORT scaling formula: 55 + (percentage * 190)
    const percentage = rawScore / totalQuestions;
    const scaled = 55 + (percentage * 190);

    return Math.round(scaled);
}

/**
 * Analyze performance by topic
 */
function analyzeTopics(answers, questions) {
    const topicStats = {};

    questions.forEach((q, idx) => {
        const topic = q.topic || 'Общие';

        if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, total: 0 };
        }

        topicStats[topic].total++;

        // Check if answer is correct
        if (answers[idx + 1] === q.correct_answer) {
            topicStats[topic].correct++;
        }
    });

    // Convert to percentage array
    return Object.entries(topicStats).map(([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100)
    }));
}

/**
 * Display topic analysis in UI
 */
function displayTopicAnalysis(topicData) {
    const container = document.createElement('div');
    container.className = 'topic-analysis';
    container.innerHTML = '<h3>Анализ по темам</h3>';

    topicData.forEach(topic => {
        const item = document.createElement('div');
        item.className = 'topic-item';

        const percentage = topic.percentage;
        let colorClass = 'low';
        if (percentage >= 70) colorClass = 'high';
        else if (percentage >= 50) colorClass = 'medium';

        item.innerHTML = `
            <div class="topic-name">${topic.topic}</div>
            <div class="topic-stats">
                <span class="topic-percentage ${colorClass}">${percentage}%</span>
                <span class="topic-count">(${topic.correct}/${topic.total})</span>
            </div>
            <div class="topic-progress">
                <div class="topic-progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;

        container.appendChild(item);
    });

    return container;
}

/**
 * Show break screen between sections with advertisements
 */
function showBreakScreen(duration) {
    const breakScreen = document.createElement('div');
    breakScreen.className = 'break-screen';
    breakScreen.id = 'break-screen';

    let timeLeft = duration * 60; // Convert to seconds
    let adSkippable = false;

    breakScreen.innerHTML = `
        <!-- Top Banner Ad (Always visible) -->
        <div class="break-ad-banner" id="break-ad-banner">
            <div class="ad-label">Реклама</div>
            <div class="ad-content">
                <img src="https://via.placeholder.com/728x90/E31E24/FFFFFF?text=Ваша+реклама+здесь" 
                     alt="Advertisement" 
                     style="width: 100%; height: auto; border-radius: 4px;">
            </div>
        </div>
        
        <!-- Center Content -->
        <div class="break-content">
            <h1>⏸️ Перерыв</h1>
            <div class="break-timer" id="break-timer">${duration}:00</div>
            <div class="break-message">
                Отдохните и подготовьтесь к следующему разделу.<br>
                Перерыв закончится автоматически.
            </div>
        </div>
        
        <!-- Center Video Ad (Skippable after 15 sec) -->
        <div class="break-center-ad" id="break-center-ad">
            <div class="ad-video-container">
                <div class="ad-label">Реклама • Можно пропустить через <span id="ad-skip-countdown">15</span> сек</div>
                <div class="ad-video-placeholder">
                    <iframe 
                        width="560" 
                        height="315" 
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1" 
                        frameborder="0" 
                        allow="autoplay; encrypted-media" 
                        allowfullscreen>
                    </iframe>
                </div>
                <button class="ad-skip-button" id="ad-skip-button" style="display: none;" onclick="skipAd()">
                    Пропустить рекламу ⏭️
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(breakScreen);
    isOnBreak = true;

    // Ad skip countdown (15 seconds)
    let adSkipCountdown = 15;
    const adSkipInterval = setInterval(() => {
        adSkipCountdown--;
        const countdownEl = document.getElementById('ad-skip-countdown');
        if (countdownEl) {
            countdownEl.textContent = adSkipCountdown;
        }

        if (adSkipCountdown <= 0) {
            clearInterval(adSkipInterval);
            adSkippable = true;
            const skipBtn = document.getElementById('ad-skip-button');
            if (skipBtn) {
                skipBtn.style.display = 'block';
                const labelEl = skipBtn.previousElementSibling;
                if (labelEl) {
                    labelEl.innerHTML = 'Реклама • <span style="color: #10b981;">Можно пропустить</span>';
                }
            }
        }
    }, 1000);

    // Break timer countdown
    const breakInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const timerEl = document.getElementById('break-timer');
        if (timerEl) {
            timerEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
        }

        if (timeLeft <= 0) {
            clearInterval(breakInterval);
            clearInterval(adSkipInterval);
            const screenEl = document.getElementById('break-screen');
            if (screenEl) {
                document.body.removeChild(screenEl);
            }
            isOnBreak = false;
            currentSection++;
            startSection(currentSection);
        }
    }, 1000);

    // Global skip ad function
    window.skipAd = function () {
        const centerAd = document.getElementById('break-center-ad');
        if (centerAd && adSkippable) {
            centerAd.style.display = 'none';
        }
    };
}

/**
 * Start a specific section of the test
 */
function startSection(sectionIndex) {
    if (!testStructure || sectionIndex >= testStructure.sections.length) {
        // Test complete
        submitTest();
        return;
    }

    const section = testStructure.sections[sectionIndex];

    if (section.isBreak) {
        showBreakScreen(section.duration);
    } else {
        // Update UI for new section
        document.getElementById('test-title').textContent =
            `${currentTest.name} - ${section.name}`;

        // Start timer for this section
        startTimer(section.duration);
        sectionStartTime = Date.now();
    }
}

// Export functions for use in other modules
window.ORTFunctions = {
    calculateScaledScore,
    analyzeTopics,
    displayTopicAnalysis,
    showBreakScreen,
    startSection
};
