const test = require('node:test');
const assert = require('node:assert/strict');
const { parseJobListings, extractProviderName } = require('./cron-jobs');

test('parses job titles from Greenhouse and Lever style markup', () => {
  const html = `
    <html>
      <body>
        <a href="https://boards.greenhouse.io/acme/jobs/123">Senior Software Engineer</a>
        <a href="https://jobs.lever.co/acme/456">Product Designer</a>
        <a href="https://example.com/learn-more">Learn More</a>
      </body>
    </html>
  `;

  const jobs = parseJobListings(html, { careers_url: 'https://boards.greenhouse.io/acme', keywords: 'engineer,designer' });

  assert.ok(jobs.some((job) => job.title.includes('Senior Software Engineer')));
  assert.ok(jobs.some((job) => job.title.includes('Product Designer')));
  assert.ok(jobs.every((job) => !job.title.includes('Learn More')));
});

test('derives the provider name from the careers URL', () => {
  assert.equal(extractProviderName('https://boards.greenhouse.io/acme'), 'Greenhouse');
  assert.equal(extractProviderName('https://jobs.lever.co/acme'), 'Lever');
  assert.equal(extractProviderName('https://www.linkedin.com/jobs/search/'), 'LinkedIn');
  assert.equal(extractProviderName('https://careers.example.com'), 'Career Page');
});
