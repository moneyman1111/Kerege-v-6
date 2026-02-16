# HTML Updates for Kerege Synak Platform

## New Sections to Add to index.html

### 1. Video Section (Add after Solution Section, before Test Selection)

```html
<!-- Video Preparation Section -->
<section class="videos-section">
    <div class="container">
        <h2 class="section-title">Видео-подготовка</h2>
        <p class="section-subtitle">Смотри обучающие видео от наших экспертов</p>
        <div id="videos-list" class="videos-grid">
            <div class="video-card loading">
                <p>Загрузка видео...</p>
            </div>
        </div>
    </div>
</section>
```

### 2. About Company Section (Add after Test Selection, before closing landing-page div)

```html
<!-- About Company Section -->
<section class="about-section" id="about">
    <div class="container">
        <h2 class="section-title">О компании Kerege</h2>
        <div class="about-content">
            <div class="about-text">
                <p>Kerege Synak — это команда профессионалов, которая помогает абитуриентам Кыргызстана успешно сдать ОРТ и поступить в лучшие вузы страны.</p>
                <p>Мы используем реальные тесты прошлых лет и предоставляем детальный анализ результатов, чтобы каждый студент знал свои сильные и слабые стороны.</p>
            </div>
        </div>

        <!-- Team Section -->
        <h3 class="subsection-title">Наша команда</h3>
        <div class="team-grid">
            <div class="team-card">
                <div class="team-photo">👨‍🏫</div>
                <h4>Азамат Исаков</h4>
                <p>Эксперт по математике</p>
            </div>
            <div class="team-card">
                <div class="team-photo">👩‍🏫</div>
                <h4>Айгуль Токтогулова</h4>
                <p>Эксперт по логике</p>
            </div>
            <div class="team-card">
                <div class="team-photo">👨‍💼</div>
                <h4>Бекжан Осмонов</h4>
                <p>Методист</p>
            </div>
        </div>

        <!-- Social Media & CTA -->
        <div class="social-cta">
            <h3>Свяжитесь с нами</h3>
            <div class="social-links">
                <a href="https://instagram.com/kerege" target="_blank" class="social-btn">Instagram</a>
                <a href="https://t.me/kerege" target="_blank" class="social-btn">Telegram</a>
                <a href="https://wa.me/996XXXXXXXXX" target="_blank" class="social-btn">WhatsApp</a>
            </div>
            <a href="tel:+996XXXXXXXXX" class="btn btn-primary btn-large">Позвонить сейчас</a>
        </div>
    </div>
</section>
```

### 3. Updated Lead Form (Replace existing lead form modal)

```html
<!-- Lead Form Modal -->
<div id="lead-modal" class="modal">
    <div class="modal-content">
        <span class="close" onclick="closeLeadForm()">&times;</span>
        <h2 class="modal-title">Начни свой путь к успеху</h2>
        <p class="modal-subtitle">Чтобы начать, заполни данные. Мы отправим подробный анализ твоих результатов тебе в WhatsApp</p>
        <form id="lead-form" onsubmit="submitLeadForm(event)">
            <div class="form-group">
                <label for="firstName">Имя</label>
                <input type="text" id="firstName" name="firstName" required>
            </div>
            <div class="form-group">
                <label for="lastName">Фамилия</label>
                <input type="text" id="lastName" name="lastName" required>
            </div>
            <div class="form-group">
                <label for="region">Регион</label>
                <select id="region" name="region" required>
                    <option value="">Выберите регион</option>
                    <option value="Бишкек">Бишкек</option>
                    <option value="Ош">Ош</option>
                    <option value="Чуйская область">Чуйская область</option>
                    <option value="Ошская область">Ошская область</option>
                    <option value="Джалал-Абадская область">Джалал-Абадская область</option>
                    <option value="Баткенская область">Баткенская область</option>
                    <option value="Нарынская область">Нарынская область</option>
                    <option value="Иссык-Кульская область">Иссык-Кульская область</option>
                    <option value="Таласская область">Таласская область</option>
                </select>
            </div>
            <div class="form-group">
                <label for="whatsapp">Номер WhatsApp</label>
                <input type="tel" id="whatsapp" name="whatsapp" placeholder="+996 ___ __ __ __" required>
            </div>
            <div class="form-group">
                <label for="parentPhone">Номер родителя</label>
                <input type="tel" id="parentPhone" name="parentPhone" placeholder="+996 ___ __ __ __" required>
            </div>
            <button type="submit" class="btn btn-primary">Начать тест</button>
        </form>
    </div>
</div>
```

### 4. Updated Admin Panel (Replace admin-content section)

```html
<div id="admin-content" class="admin-content" style="display: none;">
    <!-- Test Upload Section -->
    <div class="admin-section">
        <h2>Загрузить новый тест</h2>
        <form id="upload-test-form" onsubmit="uploadTest(event)">
            <div class="form-group">
                <label for="test-name">Название теста</label>
                <input type="text" id="test-name" required placeholder="Например: Математика 2024">
            </div>
            <div class="form-group">
                <label for="test-language">Язык</label>
                <select id="test-language" required>
                    <option value="RU">Русский</option>
                    <option value="KG">Кыргызский</option>
                </select>
            </div>
            <div class="form-group">
                <label for="test-duration">Длительность (минуты)</label>
                <input type="number" id="test-duration" required value="45" min="1">
            </div>
            <div class="form-group">
                <label for="test-photo">Фото теста (до 40 фото)</label>
                <input type="file" id="test-photo" accept="image/*" multiple required>
                <small>Выберите от 1 до 40 фотографий</small>
            </div>
            <div class="form-group">
                <label for="answer-key">Ключ ответов (через запятую)</label>
                <textarea id="answer-key" required placeholder="A,B,C,D,E,A,B,C,D,E" rows="3"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Загрузить тест</button>
        </form>
    </div>

    <!-- Tests List -->
    <div class="admin-section">
        <h2>Загруженные тесты</h2>
        <div id="admin-tests-list">
            <p>Загрузка...</p>
        </div>
    </div>

    <!-- Video Management -->
    <div class="admin-section">
        <h2>Управление видео</h2>
        <form id="add-video-form" onsubmit="addVideo(event)">
            <div class="form-group">
                <label for="video-title">Название видео</label>
                <input type="text" id="video-title" required>
            </div>
            <div class="form-group">
                <label for="video-url">Ссылка (YouTube или Google Drive)</label>
                <input type="url" id="video-url" required placeholder="https://youtube.com/...">
            </div>
            <div class="form-group">
                <label for="video-language">Язык</label>
                <select id="video-language" required>
                    <option value="RU">Русский</option>
                    <option value="KG">Кыргызский</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary">Добавить видео</button>
        </form>

        <h3 style="margin-top: 32px;">Список видео</h3>
        <div id="admin-videos-list">
            <p>Загрузка...</p>
        </div>
    </div>

    <!-- Certificate Generator -->
    <div class="admin-section">
        <h2>Генератор сертификатов</h2>
        <form id="certificate-form" onsubmit="generateCertificate(event)">
            <div class="form-group">
                <label for="cert-name">ФИО студента</label>
                <input type="text" id="cert-name" required>
            </div>
            <div class="form-group">
                <label for="cert-score">Результат (баллы)</label>
                <input type="number" id="cert-score" required min="0" max="200">
            </div>
            <div class="form-group">
                <label for="cert-test">Название теста</label>
                <input type="text" id="cert-test" required>
            </div>
            <button type="submit" class="btn btn-primary">Сгенерировать сертификат</button>
        </form>
    </div>
</div>
```

## Implementation Instructions

1. Open `index.html`
2. Add Video Section after line 67 (after Solution Section)
3. Add About Company Section after line 78 (after Test Selection)
4. Replace Lead Form Modal (lines 77-99) with updated version
5. Replace Admin Content section (lines 148-185) with updated version
6. Save file

## Notes

- All new sections use existing CSS classes where possible
- New CSS classes needed are documented in `styles-updates.md`
- Social media links need to be updated with real URLs
- Phone numbers need to be updated with real numbers
