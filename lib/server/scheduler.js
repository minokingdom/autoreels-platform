'use strict';
const db = require('./db');
async function available() {
  if (process.env.SNS_SCHEDULING_ENABLED !== 'true' || !process.env.CRON_SECRET) return false;
  const r=await db.query("SELECT streak FROM ar_worker_health WHERE name='sns' AND last_success > now()-interval '150 seconds'");
  return Boolean(r.rows[0] && r.rows[0].streak >= 3);
}
async function heartbeat() {
  await db.query("INSERT INTO ar_worker_health(name,last_success,streak) VALUES('sns',now(),1) ON CONFLICT(name) DO UPDATE SET streak=CASE WHEN ar_worker_health.last_success BETWEEN now()-interval '150 seconds' AND now()-interval '20 seconds' THEN LEAST(ar_worker_health.streak+1,3) WHEN ar_worker_health.last_success > now()-interval '20 seconds' THEN ar_worker_health.streak ELSE 1 END,last_success=now()");
}
module.exports={available,heartbeat};
