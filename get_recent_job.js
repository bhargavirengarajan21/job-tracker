const { getDb, getAll } = require('./server/db');
(async () => {
  await getDb();
  const rows = getAll('SELECT * FROM fetched_jobs ORDER BY fetched_at DESC LIMIT 1');
  console.log(JSON.stringify(rows));
})();