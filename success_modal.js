// Enhanced Success Modal with ORT Score Display

function showSuccessModalWithScore(scaledScore, correct, total, topicAnalysis) {
    const modal = document.getElementById('success-modal');
    const content = modal.querySelector('.modal-content');

    // Build topic analysis HTML
    let topicHTML = '';
    if (topicAnalysis && topicAnalysis.length > 0) {
        topicHTML = '<div class="topic-analysis" style="margin-top: 20px; text-align: left;">';
        topicHTML += '<h3 style="margin-bottom: 12px; font-size: 18px;">Анализ по темам:</h3>';

        topicAnalysis.forEach(topic => {
            const colorClass = topic.percentage >= 70 ? 'high' : (topic.percentage >= 50 ? 'medium' : 'low');
            const color = topic.percentage >= 70 ? '#10b981' : (topic.percentage >= 50 ? '#f59e0b' : '#E31E24');

            topicHTML += `
                <div class="topic-item" style="margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-weight: 600;">${topic.topic}</span>
                        <span style="font-weight: 700; color: ${color};">${topic.percentage}%</span>
                    </div>
                    <div style="font-size: 12px; color: #666;">${topic.correct} из ${topic.total} правильных</div>
                    <div class="topic-progress" style="width: 100%; height: 6px; background: #e5e5e5; border-radius: 3px; overflow: hidden; margin-top: 4px;">
                        <div style="height: 100%; background: ${color}; width: ${topic.percentage}%; transition: width 0.5s ease;"></div>
                    </div>
                </div>
            `;
        });

        topicHTML += '</div>';
    }

    // Update modal content
    content.innerHTML = `
        <h2 style="font-size: 32px; margin-bottom: 16px;">✅ Тест завершен!</h2>
        
        <div style="background: linear-gradient(135deg, #E31E24 0%, #c41a1f 100%); color: white; padding: 24px; border-radius: 12px; margin: 20px 0;">
            <div style="font-size: 16px; opacity: 0.9; margin-bottom: 8px;">Ваш балл ОРТ</div>
            <div style="font-size: 64px; font-weight: 800; line-height: 1;">${scaledScore}</div>
            <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">из 245 возможных</div>
        </div>
        
        <div style="display: flex; gap: 20px; justify-content: center; margin: 20px 0;">
            <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: 700; color: #10b981;">${correct}</div>
                <div style="font-size: 14px; color: #666;">Правильных</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: 700; color: #E31E24;">${total - correct}</div>
                <div style="font-size: 14px; color: #666;">Ошибок</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: 700; color: #3b82f6;">${Math.round((correct / total) * 100)}%</div>
                <div style="font-size: 14px; color: #666;">Процент</div>
            </div>
        </div>
        
        ${topicHTML}
        
        <p style="margin: 24px 0; font-size: 16px; color: #666;">
            Ваш результат передан эксперту Kerege.<br>
            Ожидайте сообщение в WhatsApp с детальным разбором.
        </p>
        
        <button class="btn btn-primary" onclick="closeSuccessModal()" style="background-color: #E31E24; padding: 16px 32px;">
            Вернуться на главную
        </button>
    `;

    modal.classList.add('active');
}

// Fallback to simple modal if needed
function showSuccessModal() {
    showSuccessModalWithScore(0, 0, 0, null);
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.remove('active');
    showHome();
}

// Export for global access
window.showSuccessModalWithScore = showSuccessModalWithScore;
window.showSuccessModal = showSuccessModal;
window.closeSuccessModal = closeSuccessModal;
