const express = require('express');
const cron = require('node-cron');
const puppeteer = require('puppeteer');
const { runQuery, getOne, getAll } = require('./db');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/companies', authenticateToken, (req, res) => {
  const companies = getAll(
    'SELECT * FROM tracked_companies WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]
  );
  res.json(companies);
});

router.post('/companies', authenticateToken, (req, res) => {
  const { company_name, careers_url, keywords } = req.body;
  if (!company_name || !careers_url) {
    return res.status(400).json({ error: 'Company name and careers URL are required' });
  }

  const result = runQuery(
    'INSERT INTO tracked_companies (user_id, company_name, careers_url, keywords) VALUES (?, ?, ?, ?)',
    [req.user.id, company_name, careers_url, keywords || null]
  );

  const company = getOne('SELECT * FROM tracked_companies WHERE id = ?', [result.lastInsertRowid]);
  res.json(company);
});

router.put('/companies/:id', authenticateToken, (req, res) => {
  const { company_name, careers_url, keywords, active } = req.body;
  const company = getOne('SELECT * FROM tracked_companies WHERE id = ? AND user_id = ?', [Number(req.params.id), req.user.id]);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  runQuery(
    'UPDATE tracked_companies SET company_name = ?, careers_url = ?, keywords = ?, active = ? WHERE id = ?',
    [
      company_name || company.company_name,
      careers_url || company.careers_url,
      keywords !== undefined ? keywords : company.keywords,
      active !== undefined ? active : company.active,
      Number(req.params.id)
    ]
  );

  const updated = getOne('SELECT * FROM tracked_companies WHERE id = ?', [Number(req.params.id)]);
  res.json(updated);
});

router.delete('/companies/:id', authenticateToken, (req, res) => {
  const company = getOne('SELECT * FROM tracked_companies WHERE id = ? AND user_id = ?', [Number(req.params.id), req.user.id]);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  runQuery('DELETE FROM fetched_jobs WHERE tracked_company_id = ?', [Number(req.params.id)]);
  runQuery('DELETE FROM tracked_companies WHERE id = ?', [Number(req.params.id)]);
  res.json({ message: 'Company removed' });
});

router.get('/fetched-jobs', authenticateToken, (req, res) => {
  const jobs = getAll(`
    SELECT fj.*, tc.company_name
    FROM fetched_jobs fj
    JOIN tracked_companies tc ON fj.tracked_company_id = tc.id
    WHERE tc.user_id = ?
    ORDER BY fj.fetched_at DESC
    LIMIT 100
  `, [req.user.id]);
  res.json(jobs);
});

router.post('/fetch-now', authenticateToken, async (req, res) => {
  try {
    const companies = getAll(
      'SELECT * FROM tracked_companies WHERE user_id = ? AND active = 1', [req.user.id]
    );

    const results = await fetchJobsForCompanies(companies);
    res.json({ message: 'Jobs fetched successfully', results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cron-status', authenticateToken, (req, res) => {
  res.json({
    active: true,
    schedule: '0 11 * * *',
    timezone: 'America/Chicago',
    description: 'Runs daily at 11:00 AM CST'
  });
});

async function fetchJobsForCompanies(companies) {
  const results = [];
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    for (const company of companies) {
      const page = await browser.newPage();
      try {
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await page.goto(company.careers_url, { waitUntil: 'networkidle2', timeout: 30000 });
        // Extra wait for late-rendering SPAs
        await new Promise(r => setTimeout(r, 2000));

        const html = await page.content();
        const jobs = parseJobListings(html, company);

        let newJobs = 0;
        for (const job of jobs) {
          const existing = getOne(
            'SELECT id FROM fetched_jobs WHERE tracked_company_id = ? AND title = ? AND url = ?',
            [company.id, job.title, job.url]
          );
          if (!existing) {
            runQuery(
              'INSERT INTO fetched_jobs (tracked_company_id, title, url) VALUES (?, ?, ?)',
              [company.id, job.title, job.url]
            );
            newJobs++;
          }
        }

        results.push({ company: company.company_name, jobsFound: jobs.length, newJobs });
      } catch (err) {
        results.push({ company: company.company_name, error: err.message });
      } finally {
        await page.close();
      }
    }
  } finally {
    if (browser) await browser.close();
  }

  return results;
}

function parseJobListings(html, company) {
  const jobs = [];
  const keywords = company.keywords ? company.keywords.toLowerCase().split(',').map(k => k.trim()) : [];

  const titlePatterns = [
    /<a[^>]*href=["']([^"']*)['"'][^>]*>([^<]*(?:engineer|developer|designer|manager|analyst|scientist|architect|lead|senior|junior|intern|director|coordinator|specialist|consultant)[^<]*)<\/a>/gi,
    /<h[2-4][^>]*>([^<]*(?:engineer|developer|designer|manager|analyst|scientist|architect|lead|senior|junior|intern|director|coordinator|specialist|consultant)[^<]*)<\/h[2-4]>/gi,
    /<(?:div|span|li)[^>]*class=["'][^"']*(?:job|position|title|role)[^"']*["'][^>]*>([^<]+)<\/(?:div|span|li)>/gi
  ];

  for (const pattern of titlePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[2] ? match[1] : null;
      const title = (match[2] || match[1]).trim();

      if (title.length > 5 && title.length < 150) {
        const matchesKeyword = keywords.length === 0 ||
          keywords.some(kw => title.toLowerCase().includes(kw));

        if (matchesKeyword) {
          jobs.push({ title, url: url || company.careers_url });
        }
      }
    }
  }

  return jobs.slice(0, 50);
}

function startCronJob() {
  cron.schedule('0 11 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled job fetch...`);

    const activeCompanies = getAll('SELECT * FROM tracked_companies WHERE active = 1');

    if (activeCompanies.length === 0) {
      console.log('No active companies to fetch jobs for.');
      return;
    }

    const results = await fetchJobsForCompanies(activeCompanies);
    console.log('Cron job results:', JSON.stringify(results, null, 2));
  }, {
    timezone: 'America/Chicago'
  });

  console.log('Cron job scheduled: Daily at 11:00 AM CST');
}

module.exports = { router, startCronJob };
