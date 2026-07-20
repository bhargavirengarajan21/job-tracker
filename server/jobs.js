const express = require('express');
const axios = require('axios');
const { runQuery, getOne, getAll } = require('./db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Pull the spreadsheet id and gid out of any Google Sheets URL (edit link, /d/<id>/..., etc.)
function parseSheetUrl(input) {
  if (!input) return null;
  const idMatch = String(input).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) ||
                  String(input).match(/^([a-zA-Z0-9-_]{30,})$/); // bare id
  if (!idMatch) return null;
  const gidMatch = String(input).match(/[?&#]gid=(\d+)/);
  return { id: idMatch[1], gid: gidMatch ? gidMatch[1] : '0' };
}

// Minimal RFC-4180 CSV parser: handles quoted fields, embedded commas/newlines,
// and "" escaped quotes. The sheet stores lists and JSON arrays inside quoted cells.
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\r') {
      // ignore, handled by \n
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function csvToObjects(text) {
  const rows = parseCsv(text).filter(r => r.some(c => c && c.trim() !== ''));
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(cols => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = (cols[i] ?? '').trim(); });
    return obj;
  });
}

// GET /api/jobs/board?sheetUrl=... — fetch the sheet, merge in this user's decisions
router.get('/board', authenticateToken, async (req, res) => {
  const parsed = parseSheetUrl(req.query.sheetUrl);
  if (!parsed) return res.status(400).json({ error: 'Provide a valid Google Sheets URL' });

  const exportUrl = `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv&gid=${parsed.gid}`;

  try {
    const { data } = await axios.get(exportUrl, {
      timeout: 20000,
      responseType: 'text',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/csv' },
      maxRedirects: 5
    });

    if (typeof data === 'string' && data.trim().startsWith('<')) {
      return res.status(400).json({ error: 'Sheet is not publicly readable. Share it as "Anyone with the link can view".' });
    }

    const jobs = csvToObjects(data).filter(j => j.url);

    const decisions = getAll(
      'SELECT job_url, status FROM job_decisions WHERE user_id = ?', [req.user.id]
    );
    const decisionMap = Object.fromEntries(decisions.map(d => [d.job_url, d.status]));

    const enriched = jobs.map(j => ({ ...j, decision: decisionMap[j.url] || 'pending' }));
    res.json({ jobs: enriched, count: enriched.length });
  } catch (err) {
    const status = err.response?.status;
    const msg = status === 404 ? 'Sheet not found — check the URL and sharing settings.'
      : status ? `Failed to fetch sheet (HTTP ${status})`
      : err.code === 'ECONNABORTED' ? 'Request timed out fetching the sheet'
      : 'Failed to fetch the sheet';
    res.status(500).json({ error: msg });
  }
});

// POST /api/jobs/decision { url, status } — record apply/decline/pending (upsert)
router.post('/decision', authenticateToken, (req, res) => {
  const { url, status } = req.body;
  if (!url || !['applied', 'declined', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'url and a valid status (applied|declined|pending) are required' });
  }

  const existing = getOne(
    'SELECT id FROM job_decisions WHERE user_id = ? AND job_url = ?', [req.user.id, url]
  );
  if (existing) {
    runQuery(
      'UPDATE job_decisions SET status = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, existing.id]
    );
  } else {
    runQuery(
      'INSERT INTO job_decisions (user_id, job_url, status) VALUES (?, ?, ?)',
      [req.user.id, url, status]
    );
  }
  res.json({ url, status });
});

module.exports = router;
