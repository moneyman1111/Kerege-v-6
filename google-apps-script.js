// Google Apps Script Backend for Kerege Synak - Enhanced Version
// Deploy this as a Web App with "Anyone" access

// Configuration - Update these after creating your sheets
const SPREADSHEET_ID = '19haGRsvsWDXdVtdMSS6mB1IFgbCcsLbaN1_Ru1Oh7z0';
const TESTS_SHEET_NAME = 'Tests';
const RESULTS_SHEET_NAME = 'Results';
const VIDEOS_SHEET_NAME = 'Videos';
const DRIVE_FOLDER_NAME = 'Kerege Tests';

// Main GET handler
function doGet(e) {
    const action = e.parameter.action;

    try {
        if (action === 'getTests') {
            return getTests();
        } else if (action === 'getTest') {
            return getTest(e.parameter.id);
        } else if (action === 'getVideos') {
            return getVideos();
        }

        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: 'Invalid action'
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Main POST handler
function doPost(e) {
    try {
        const requestData = JSON.parse(e.postData.contents);
        const action = requestData.action;

        if (action === 'uploadTest') {
            return uploadTest(requestData.data);
        } else if (action === 'submitResult') {
            return submitResult(requestData.data);
        } else if (action === 'deleteTest') {
            return deleteTest(requestData.data);
        } else if (action === 'addVideo') {
            return addVideo(requestData.data);
        } else if (action === 'deleteVideo') {
            return deleteVideo(requestData.data);
        } else if (action === 'generateCertificate') {
            return generateCertificate(requestData.data);
        }

        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: 'Invalid action'
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Get all tests
function getTests() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(TESTS_SHEET_NAME);

    if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: 'Tests sheet not found'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const tests = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) { // Check if ID exists
            tests.push({
                id: row[0],
                name: row[1],
                language: row[2],
                duration: row[3],
                answerKey: JSON.parse(row[4]),
                photoUrls: JSON.parse(row[5] || '[]'), // Now array of URLs
                createdAt: row[6]
            });
        }
    }

    return ContentService.createTextOutput(JSON.stringify({
        success: true,
        tests: tests
    })).setMimeType(ContentService.MimeType.JSON);
}

// Get single test
function getTest(testId) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(TESTS_SHEET_NAME);

    if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: 'Tests sheet not found'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] === testId) {
            const test = {
                id: row[0],
                name: row[1],
                language: row[2],
                duration: row[3],
                answerKey: JSON.parse(row[4]),
                photoUrls: JSON.parse(row[5] || '[]'),
                createdAt: row[6]
            };

            return ContentService.createTextOutput(JSON.stringify({
                success: true,
                test: test
            })).setMimeType(ContentService.MimeType.JSON);
        }
    }

    return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Test not found'
    })).setMimeType(ContentService.MimeType.JSON);
}

// Upload new test with multiple photos
function uploadTest(testData) {
    try {
        // Get or create Drive folder
        const mainFolder = getOrCreateFolder(DRIVE_FOLDER_NAME);

        // Create subfolder for this test
        const testFolder = mainFolder.createFolder(testData.name + '_' + new Date().getTime());

        // Upload photos to Drive
        const photoUrls = [];
        const photos = testData.photos || []; // Array of base64 images

        for (let i = 0; i < photos.length; i++) {
            const photoBlob = Utilities.newBlob(
                Utilities.base64Decode(photos[i].data),
                'image/jpeg',
                `photo_${i + 1}.jpg`
            );
            const file = testFolder.createFile(photoBlob);

            // Make file publicly accessible
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

            // Get public URL
            const photoUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
            photoUrls.push(photoUrl);
        }

        // Generate unique ID
        const testId = Utilities.getUuid();

        // Save to spreadsheet
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = ss.getSheetByName(TESTS_SHEET_NAME);

        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = ss.insertSheet(TESTS_SHEET_NAME);
            sheet.appendRow(['ID', 'Name', 'Language', 'Duration', 'AnswerKey', 'PhotoURLs', 'CreatedAt', 'FolderId']);
        }

        sheet.appendRow([
            testId,
            testData.name,
            testData.language,
            testData.duration,
            JSON.stringify(testData.answerKey),
            JSON.stringify(photoUrls),
            new Date().toISOString(),
            testFolder.getId()
        ]);

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            testId: testId,
            photoCount: photoUrls.length
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Delete test and associated files
function deleteTest(data) {
    try {
        const testId = data.testId;
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName(TESTS_SHEET_NAME);

        if (!sheet) {
            throw new Error('Tests sheet not found');
        }

        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();

        // Find and delete the row
        for (let i = 1; i < values.length; i++) {
            if (values[i][0] === testId) {
                // Get folder ID if exists
                const folderId = values[i][7];

                // Delete folder from Drive
                if (folderId) {
                    try {
                        const folder = DriveApp.getFolderById(folderId);
                        folder.setTrashed(true);
                    } catch (e) {
                        Logger.log('Could not delete folder: ' + e);
                    }
                }

                // Delete row from sheet
                sheet.deleteRow(i + 1);

                return ContentService.createTextOutput(JSON.stringify({
                    success: true
                })).setMimeType(ContentService.MimeType.JSON);
            }
        }

        throw new Error('Test not found');

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Submit test result with ORT scoring and answer history
function submitResult(resultData) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = ss.getSheetByName(RESULTS_SHEET_NAME);

        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = ss.insertSheet(RESULTS_SHEET_NAME);
            sheet.appendRow([
                'Timestamp',
                'FirstName',
                'LastName',
                'WhatsApp',
                'Region',
                'ParentPhone',
                'TestName',
                'Score',          // ORT scaled score (55-245)
                'Correct',        // Format: "25 / 30"
                'Duration',       // Test duration in seconds
                'FullHistory',    // Answer change history
                'Answers'         // Final answers JSON
            ]);
        }

        sheet.appendRow([
            new Date(),
            resultData.firstName,
            resultData.lastName,
            resultData.whatsapp,
            resultData.region || '',
            resultData.parentPhone || '',
            resultData.testName,
            resultData.score,           // ORT score (55-245)
            resultData.correct,         // "25 / 30" format
            resultData.duration,        // Seconds
            resultData.fullHistory,     // "1:A->C, 2:B, 3:D->A"
            resultData.answers          // JSON string
        ]);

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            score: resultData.score,
            correct: resultData.correct
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Get all videos
function getVideos() {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = ss.getSheetByName(VIDEOS_SHEET_NAME);

        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = ss.insertSheet(VIDEOS_SHEET_NAME);
            sheet.appendRow(['ID', 'Title', 'URL', 'Language', 'CreatedAt']);

            return ContentService.createTextOutput(JSON.stringify({
                success: true,
                videos: []
            })).setMimeType(ContentService.MimeType.JSON);
        }

        const data = sheet.getDataRange().getValues();
        const videos = [];

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[0]) {
                videos.push({
                    id: row[0],
                    title: row[1],
                    url: row[2],
                    language: row[3],
                    createdAt: row[4]
                });
            }
        }

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            videos: videos
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Add video
function addVideo(videoData) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = ss.getSheetByName(VIDEOS_SHEET_NAME);

        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = ss.insertSheet(VIDEOS_SHEET_NAME);
            sheet.appendRow(['ID', 'Title', 'URL', 'Language', 'CreatedAt']);
        }

        const videoId = Utilities.getUuid();

        sheet.appendRow([
            videoId,
            videoData.title,
            videoData.url,
            videoData.language,
            new Date().toISOString()
        ]);

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            videoId: videoId
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Delete video
function deleteVideo(data) {
    try {
        const videoId = data.videoId;
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName(VIDEOS_SHEET_NAME);

        if (!sheet) {
            throw new Error('Videos sheet not found');
        }

        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();

        for (let i = 1; i < values.length; i++) {
            if (values[i][0] === videoId) {
                sheet.deleteRow(i + 1);

                return ContentService.createTextOutput(JSON.stringify({
                    success: true
                })).setMimeType(ContentService.MimeType.JSON);
            }
        }

        throw new Error('Video not found');

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Generate certificate PDF
function generateCertificate(data) {
    try {
        // Create HTML template for certificate
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Georgia', serif;
              text-align: center;
              padding: 50px;
              background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
            }
            .certificate {
              border: 10px solid #E31E24;
              padding: 40px;
              background: white;
              max-width: 800px;
              margin: 0 auto;
            }
            .logo {
              font-size: 48px;
              font-weight: bold;
              color: #E31E24;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 36px;
              margin: 20px 0;
              color: #333;
            }
            .recipient {
              font-size: 32px;
              font-weight: bold;
              color: #E31E24;
              margin: 30px 0;
            }
            .details {
              font-size: 20px;
              margin: 20px 0;
              color: #666;
            }
            .score {
              font-size: 48px;
              font-weight: bold;
              color: #E31E24;
              margin: 30px 0;
            }
            .footer {
              margin-top: 50px;
              font-size: 16px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="logo">Kerege</div>
            <h1>Сертификат</h1>
            <p class="details">Настоящим подтверждается, что</p>
            <div class="recipient">${data.fullName}</div>
            <p class="details">успешно прошел(а) тестирование</p>
            <p class="details"><strong>${data.testName}</strong></p>
            <p class="details">и показал(а) следующий результат:</p>
            <div class="score">${data.score} баллов</div>
            <div class="footer">
              <p>Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
              <p>Kerege Synak - Подготовка к ОРТ</p>
            </div>
          </div>
        </body>
      </html>
    `;

        // Create PDF from HTML
        const blob = Utilities.newBlob(html, 'text/html', 'certificate.html');
        const pdf = blob.getAs('application/pdf');
        pdf.setName(`Certificate_${data.fullName.replace(/\s/g, '_')}.pdf`);

        // Save to Drive
        const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
        const certificatesFolder = getOrCreateSubfolder(folder, 'Certificates');
        const file = certificatesFolder.createFile(pdf);

        // Make publicly accessible
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const pdfUrl = `https://drive.google.com/file/d/${file.getId()}/view`;

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            pdfUrl: pdfUrl,
            fileId: file.getId()
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Helper: Get or create Drive folder
function getOrCreateFolder(folderName) {
    const folders = DriveApp.getFoldersByName(folderName);

    if (folders.hasNext()) {
        return folders.next();
    } else {
        return DriveApp.createFolder(folderName);
    }
}

// Helper: Get or create subfolder
function getOrCreateSubfolder(parentFolder, subfolderName) {
    const folders = parentFolder.getFoldersByName(subfolderName);

    if (folders.hasNext()) {
        return folders.next();
    } else {
        return parentFolder.createFolder(subfolderName);
    }
}
