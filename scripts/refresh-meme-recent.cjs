const fs = require('node:fs');
const path = require('node:path');
const {collect} = require('../lib/meme-recent.cjs');
const file = path.join(__dirname,'../public/meme-recent.json');
async function refresh() {
  const prior = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : {};
  const [quotes,clips] = await Promise.all([collect('quotes',prior.quotes), collect('clips',prior.clips)]);
  fs.writeFileSync(file, JSON.stringify({quotes,clips},null,2)+'\n');
  console.log('최근 7일 수집',quotes.length,'개 대사,',clips.length,'개 클립');
}
refresh().catch(e=>{console.error(e);process.exitCode=1;});
