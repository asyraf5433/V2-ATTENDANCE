const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const app = express();
const PORT = process.env.PORT || 3000;

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const SHEET_ID = '1YY-y_KVsCG-PaJQ3otnPKMo8JjtmOLSy4TITPudPVq0'; // your actual Sheet ID

async function appendToSheet(data) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A:E',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [data],
    },
  });
}

app.use(express.static(__dirname));
app.use(express.json());

// Users
const users = {
  "Imaan Hasbullah": "ImaanHas_Nuhsark93",
  "Fatin": "FatiN_Nuhsark93",
  "Aisyah": "AisyaH_Nuhsark93",
  "Diyanah": "DiyanaH_Nuhsark93",
  "Aini": "AinI_Nuhsark93",
  "admin": "admin123"
};

let attendanceLogs = [];
let failedLoginAttempts = [];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    res.json({ success: true, isAdmin: username === 'admin' });
  } else {
    if (username !== 'admin') {
      failedLoginAttempts.push({ username, time: new Date().toISOString() });
    }
    res.json({ success: false });
  }
});

app.post('/log', async (req, res) => {
  const { username, action, latitude, longitude } = req.body;
  const timestamp = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });

  const logEntry = { username, action, timestamp, latitude, longitude };
  attendanceLogs.push(logEntry);

  try {
    await appendToSheet([
      timestamp,
      username,
      action,
      latitude || 'N/A',
      longitude || 'N/A'
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Google Sheets error:', error.message);
    res.json({ success: false, error: 'Google Sheets update failed.' });
  }
});

app.get('/admin/logs', (req, res) => {
  res.json({ logs: attendanceLogs, failed: failedLoginAttempts });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
