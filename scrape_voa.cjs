const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeArticle(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const title = $('h1.title').text().trim() || $('h1').text().trim();
    
    // VOA audio is usually inside a <div class="media-download"> with an <a> tag pointing to .mp3, 
    // or <div class="c-mmp__player"> with audio src.
    let audioUrl = '';
    const audioLinks = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.endsWith('.mp3')) {
        audioLinks.push(href);
      }
    });
    audioUrl = audioLinks.length > 0 ? audioLinks[0] : '';
    
    // Content is usually in <div class="wsw">
    const paragraphs = [];
    let isWordsInThisStory = false;
    const vocabList = [];
    
    $('#article-content p, div.wsw p').each((i, el) => {
      let pText = $(el).text().trim();
      if (!pText || pText.includes('No media source')) return;
      
      const pLower = pText.toLowerCase();
      // Check if it's the start of "Words in This Story"
      if (pLower.includes('words in this story') || pLower === 'words in this story') {
        isWordsInThisStory = true;
        return; // skip the heading itself
      }
      
      if (isWordsInThisStory) {
        // Only push if it has definition structure, usually some dashes or bold text
        if (pText.includes('–') || pText.includes('-') || $(el).find('strong').length > 0) {
            vocabList.push(pText);
        }
      } else {
        paragraphs.push(pText);
      }
    });
    
    // Sometimes vocab is in <ul><li> instead of <p>
    if (vocabList.length === 0) {
        $('div.wsw ul li').each((i, el) => {
            const liText = $(el).text().trim();
            if (liText.includes('–') || liText.includes('-') || $(el).find('strong').length > 0) {
                vocabList.push(liText);
            }
        });
    }

    return {
        title,
        url,
        audioUrl,
        paragraphs,
        vocabList
    };
    
  } catch(e) {
    console.error("Error scraping " + url, e);
    return null;
  }
}

async function scrapeHomepage() {
  try {
    const res = await fetch('https://learningenglish.voanews.com/z/3521'); // As It Is
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const articleLinks = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('/a/') && href.endsWith('.html')) {
        articleLinks.push('https://learningenglish.voanews.com' + href);
      }
    });
    
    const uniqueLinks = [...new Set(articleLinks)];
    console.log("Found", uniqueLinks.length, "articles on homepage");
    
    const allData = [];
    for (let i = 0; i < Math.min(10, uniqueLinks.length); i++) {
        console.log("Scraping:", uniqueLinks[i]);
        const data = await scrapeArticle(uniqueLinks[i]);
        if (data && data.paragraphs && data.paragraphs.length > 0) {
            allData.push(data);
        }
    }
    
    const outputPath = 'src/data/voa_lessons.json';
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf-8');
    console.log("Saved", allData.length, "lessons to", outputPath);
  } catch(e) {
    console.error(e);
  }
}

scrapeHomepage();
