require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db');
const { router: authRouter } = require('./auth');
const applicationsRouter = require('./applications');
const atsRouter = require('./ats');
const jobsRouter = require('./jobs');
const { router: cronRouter, startCronJob } = require('./cron-jobs');

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/ats', atsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/cron', cronRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  await getDb();
  startCronJob();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
