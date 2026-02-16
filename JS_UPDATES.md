# Frontend JavaScript Updates (app.js)

## New Functions to Add

### 1. Video Loading (Add after loadTests function)

```javascript
// Load Videos
async function loadVideos() {
    // Mock mode for testing
    if (MOCK_MODE) {
        displayVideos([
            {
                id: '1',
                title: 'Как решать задачи по математике',
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                language: 'RU'
            },
            {
                id: '2',
                title: 'Логические аналогии - разбор',
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                language: 'RU'
            }
        ]);
        return;
    }

    try {
        const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getVideos`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success) {
            displayVideos(data.videos);
        } else {
            displayVideosError();
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        displayVideosError();
    }
}

function displayVideos(videos) {
    const videosContainer = document.getElementById('videos-list');

    if (!videos || videos.length === 0) {
        videosContainer.innerHTML = '<div class="video-card"><p>Видео скоро появятся</p></div>';
        return;
    }

    videosContainer.innerHTML = videos.map(video => {
        // Extract YouTube video ID or use iframe embed
        let embedUrl = video.url;
        
        // Convert YouTube watch URL to embed URL
        if (video.url.includes('youtube.com/watch')) {
            const videoId = new URL(video.url).searchParams.get('v');
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (video.url.includes('youtu.be/')) {
            const videoId = video.url.split('youtu.be/')[1].split('?')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }

        return `
            <div class="video-card">
                <div class="video-wrapper">
                    <iframe 
                        src="${embedUrl}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <h3>${video.title}</h3>
                <p class="video-language">${video.language === 'RU' ? 'Русский' : 'Кыргызский'}</p>
            </div>
        `;
    }).join('');
}

function displayVideosError() {
    const videosContainer = document.getElementById('videos-list');
    videosContainer.innerHTML = `
        <div class="video-card">
            <p style="color: #E31E24;">Ошибка загрузки видео</p>
        </div>
    `;
}
```

### 2. Update DOMContentLoaded (Replace existing)

```javascript
// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTests();
    loadVideos(); // Add this line
    setupWhatsAppMask();
    setupParentPhoneMask(); // Add this line
    checkRoute();
});
```

### 3. Parent Phone Mask (Add after setupWhatsAppMask)

```javascript
function setupParentPhoneMask() {
    const parentPhoneInput = document.getElementById('parentPhone');
    
    if (!parentPhoneInput) return; // Element might not exist yet

    parentPhoneInput.addEventListener('input', (e) => {
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
```

### 4. Update submitLeadForm (Replace existing)

```javascript
function submitLeadForm(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const region = document.getElementById('region').value;
    const whatsapp = document.getElementById('whatsapp').value.replace(/\D/g, '');
    const parentPhone = document.getElementById('parentPhone').value.replace(/\D/g, '');

    if (whatsapp.length !== 12) {
        alert('Пожалуйста, введите корректный номер WhatsApp');
        return;
    }

    if (parentPhone.length !== 12) {
        alert('Пожалуйста, введите корректный номер родителя');
        return;
    }

    if (!region) {
        alert('Пожалуйста, выберите регион');
        return;
    }

    studentData = {
        firstName,
        lastName,
        region,
        whatsapp: '+' + whatsapp,
        parentPhone: '+' + parentPhone
    };

    closeLeadForm();
    startTest();
}
```

### 5. Update submitTest to include new fields (Modify existing)

Find the `submitTest` function and update the submission object:

```javascript
// Prepare submission data
const submission = {
    ...studentData, // This now includes region and parentPhone
    testName: currentTest.name,
    testId: currentTest.id,
    score: results.score,
    correctAnswers: results.correct,
    totalQuestions: currentTest.answerKey.length,
    answers: answers,
    timestamp: new Date().toISOString()
};
```

### 6. Update startTest for Multiple Photos (Modify existing)

```javascript
function startTest() {
    if (!currentTest || !studentData) {
        alert('Ошибка: данные теста или студента не найдены');
        return;
    }

    // Reset state
    answers = {};

    // Set test images (now multiple)
    const photoUrls = currentTest.photoUrls || [];
    if (photoUrls.length > 0) {
        // Use first photo as main image
        document.getElementById('test-image').src = photoUrls[0];
        document.getElementById('zoomed-image').src = photoUrls[0];
        
        // If multiple photos, could add navigation here
        // For now, just use the first one
    }
    
    document.getElementById('test-title').textContent = currentTest.name;

    // Generate answer grid
    generateAnswerGrid(currentTest.answerKey.length);

    // Start timer
    startTimer(currentTest.duration);

    // Show test page
    showTestPage();
}
```

## Implementation Instructions

1. Open `app.js`
2. Add `loadVideos()` function after `loadTests()`
3. Add `displayVideos()` and `displayVideosError()` functions
4. Update `DOMContentLoaded` to call `loadVideos()`
5. Add `setupParentPhoneMask()` function
6. Update `submitLeadForm()` with new fields
7. Update `startTest()` to handle multiple photos
8. Save file

## Notes

- Video URLs are automatically converted to YouTube embed format
- Parent phone uses same mask as WhatsApp number
- Region is now required field
- Multiple photos supported but currently only first photo is displayed
- Future enhancement: Add photo carousel/slider for multiple test images
