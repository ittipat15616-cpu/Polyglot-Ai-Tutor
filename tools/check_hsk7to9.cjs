const fs = require('fs');

async function main() {
    const content = fs.readFileSync('src/data/hsk7to9Data.ts', 'utf8');
    let hsk7to9Data;
    eval(content.replace('export const hsk7to9Data =', 'hsk7to9Data ='));
    
    console.log(`Total words: ${hsk7to9Data.length}`);
    
    let missingTh = 0;
    let missingExample = 0;
    let missingExampleTh = 0;
    let missingAny = 0;
    
    for (const item of hsk7to9Data) {
        const isMissingTh = !item.th || item.th.trim() === "" || item.th.trim() === "รอคำแปล";
        const isMissingExample = !item.example || item.example.trim() === "";
        const isMissingExampleTh = !item.exampleTh || item.exampleTh.trim() === "";
        
        if (isMissingTh) missingTh++;
        if (isMissingExample) missingExample++;
        if (isMissingExampleTh) missingExampleTh++;
        if (isMissingTh || isMissingExample || isMissingExampleTh) missingAny++;
    }
    
    console.log(`Missing Thai translation: ${missingTh}`);
    console.log(`Missing Chinese example: ${missingExample}`);
    console.log(`Missing Thai example translation: ${missingExampleTh}`);
    console.log(`Total words missing one or more fields: ${missingAny}`);
}

main().catch(console.error);
