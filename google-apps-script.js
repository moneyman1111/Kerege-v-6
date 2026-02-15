// Google Apps Script Backend for Kerege Synak
// Deploy this as a Web App with "Anyone" access

// Configuration - Update these after creating your sheets
const SPREADSHEET_ID = '19haGRsvsWDXdVtdMSS6mB1IFgbCcsLbaN1_Ru1Oh7z0';
const TESTS_SHEET_NAME = 'Tests';
const RESULTS_SHEET_NAME = 'Results';
const DRIVE_FOLDER_NAME = 'Kerege Tests';

// Main GET handler
function doGet(e) {
    const action = e.parameter.action;

    try {
        if (action === 'getTests') {
            return getTests();
        } else if (action === 'getTest') {
            return getTest(e.parameter.id);
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
                photoUrl: row[5],
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
                photoUrl: row[5],
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

// Upload new test
function uploadTest(testData) {
    try {
        // Get or create Drive folder
        const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);

        // Upload photo to Drive
        const photoBlob = Utilities.newBlob(
            Utilities.base64Decode(testData.photo),
            'image/jpeg',
            testData.photoName
        );
        const file = folder.createFile(photoBlob);

        // Make file publicly accessible
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        // Get public URL
        const photoUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;

        // Generate unique ID
        const testId = Utilities.getUuid();

        // Save to spreadsheet
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = ss.getSheetByName(TESTS_SHEET_NAME);

        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = ss.insertSheet(TESTS_SHEET_NAME);
            sheet.appendRow(['ID', 'Name', 'Language', 'Duration', 'AnswerKey', 'PhotoURL', 'CreatedAt']);
        }

        sheet.appendRow([
            testId,
            testData.name,
            testData.language,
            testData.duration,
            JSON.stringify(testData.answerKey),
            photoUrl,
            new Date().toISOString()
        ]);

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            testId: testId,
            photoUrl: photoUrl
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Submit test result
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
                'TestName',
                'TestID',
                'Score',
                'CorrectAnswers',
                'TotalQuestions',
                'Answers'
            ]);
        }

        sheet.appendRow([
            resultData.timestamp,
            resultData.firstName,
            resultData.lastName,
            resultData.whatsapp,
            resultData.testName,
            resultData.testId,
            resultData.score,
            resultData.correctAnswers,
            resultData.totalQuestions,
            JSON.stringify(resultData.answers)
        ]);

        return ContentService.createTextOutput(JSON.stringify({
            success: true
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
