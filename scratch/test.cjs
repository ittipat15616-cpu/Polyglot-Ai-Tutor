const cheerio = require('cheerio');
async function run() {
  const res = await fetch('https://learningenglish.voanews.com/a/lets-learn-english-lesson-one/3111026.html');
  const html = await res.text();
  const $ = cheerio.load(html);
  let txt = [];
  $('div.wsw').children('p, div, h2, h3').each((i, el) => {
    let t = $(el).text().trim();
    if(t && !t.includes('renderExternalContent') && !t.includes('64 kbps') && !t.includes('Quiz')) {
       // get only first line to avoid giant blobs
       txt.push(t.split('\n')[0].trim());
    }
  });
  console.log(txt.slice(0, 15));
}
run();
