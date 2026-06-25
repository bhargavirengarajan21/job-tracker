const express = require('express');
const { runQuery, getOne, getAll } = require('./db');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const applications = getAll(
    'SELECT * FROM applications WHERE user_id = ? ORDER BY applied_date DESC', [req.user.id]
  );
  res.json(applications);
});

router.post('/', authenticateToken, (req, res) => {
  const { company, position, status, notes, job_url, ats_score, linkedin_message, email_subject, email_body } = req.body;
  if (!company || !position) {
    return res.status(400).json({ error: 'Company and position are required' });
  }

  const result = runQuery(
    'INSERT INTO applications (user_id, company, position, status, notes, job_url, ats_score, linkedin_message, email_subject, email_body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, company, position, status || 'applied', notes || null, job_url || null, ats_score || null, linkedin_message || null, email_subject || null, email_body || null]
  );

  const application = getOne('SELECT * FROM applications WHERE id = ?', [result.lastInsertRowid]);
  res.json(application);
});

router.put('/:id', authenticateToken, (req, res) => {
  const { company, position, status, notes, job_url, ats_score, linkedin_message, email_subject, email_body } = req.body;
  const app = getOne('SELECT * FROM applications WHERE id = ? AND user_id = ?', [Number(req.params.id), req.user.id]);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  runQuery(
    'UPDATE applications SET company = ?, position = ?, status = ?, notes = ?, job_url = ?, ats_score = ?, linkedin_message = ?, email_subject = ?, email_body = ? WHERE id = ?',
    [
      company || app.company,
      position || app.position,
      status || app.status,
      notes !== undefined ? notes : app.notes,
      job_url !== undefined ? job_url : app.job_url,
      ats_score !== undefined ? ats_score : app.ats_score,
      linkedin_message !== undefined ? linkedin_message : app.linkedin_message,
      email_subject !== undefined ? email_subject : app.email_subject,
      email_body !== undefined ? email_body : app.email_body,
      Number(req.params.id)
    ]
  );

  const updated = getOne('SELECT * FROM applications WHERE id = ?', [Number(req.params.id)]);
  res.json(updated);
});

router.delete('/:id', authenticateToken, (req, res) => {
  const app = getOne('SELECT * FROM applications WHERE id = ? AND user_id = ?', [Number(req.params.id), req.user.id]);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  runQuery('DELETE FROM applications WHERE id = ?', [Number(req.params.id)]);
  res.json({ message: 'Application deleted' });
});

router.post('/generate-outreach', authenticateToken, async (req, res) => {
  const { company, position, notes, job_url } = req.body;
  if (!company || !position) {
    return res.status(400).json({ error: 'Company and position are required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' });

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const context = [
    `Company: ${company}`,
    `Position: ${position}`,
    job_url ? `Job URL: ${job_url}` : '',
    notes ? `Notes: ${notes}` : ''
  ].filter(Boolean).join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Generate a short, personalized LinkedIn connection message and a cold email for a job application. Be concise, professional, and specific to the role. Do NOT use generic filler phrases like "I hope this finds you well".

${context}

Return ONLY valid JSON:
{
  "linkedin_message": "Under 300 characters. First-person, direct, mention the role. No hashtags.",
  "email_subject": "Compelling subject line under 60 chars",
  "email_body": "3-4 short paragraphs. Intro, why this role, one specific value you bring, CTA. Under 200 words."
}`
    }]
  });

  const text = message.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return res.status(500).json({ error: 'Failed to generate outreach' });

  try {
    res.json(JSON.parse(match[0]));
  } catch {
    res.status(500).json({ error: 'Failed to parse AI response' });
  }
});

module.exports = router;
