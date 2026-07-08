const fs = require('fs');
const path = require('path');

const dataset = {
  beginning: {
    label: "Beginning (Let's Learn English)",
    description: "เริ่มต้นเรียนภาษาอังกฤษด้วยเนื้อหาที่เข้าใจง่าย คำศัพท์พื้นฐาน และพูดช้า",
    articles: []
  },
  intermediate: {
    label: "Intermediate (As It Is)",
    description: "พัฒนาทักษะด้วยข่าวสารและเรื่องราวรอบโลกที่ใช้คำศัพท์ระดับกลาง",
    articles: []
  },
  advanced: {
    label: "Advanced (Education & Science)",
    description: "ท้าทายความสามารถด้วยบทความเชิงลึก คำศัพท์ซับซ้อน และการวิเคราะห์",
    articles: []
  }
};

// --- BEGINNING ---
const begTitles = [
  "Welcome to the United States",
  "How to Order Food in English",
  "A Day at the Park",
  "My New Apartment",
  "Taking the Bus"
];

for(let i=0; i<5; i++) {
  dataset.beginning.articles.push({
    title: begTitles[i],
    url: "https://learningenglish.voanews.com/z/4729",
    audioUrl: "",
    paragraphs: [
      `This is a story about ${begTitles[i]}. People want to know about this topic. It is very simple to learn.`,
      `Many people start by learning simple words. We use these words every day. Practice makes perfect.`,
      `Finally, you can talk to friends. You can use English in many places. Thank you for learning with us.`
    ],
    vocabList: [
      "simple - adjective. ง่าย, เรียบง่าย",
      "practice - verb. ฝึกฝน",
      "friend - noun. เพื่อน"
    ],
    quiz: [
      {
        question: "What is the story about?",
        options: ["Learning simple words", begTitles[i], "Animals", "Space"],
        answer: 1,
        explanation: `ข้อนี้อ้างอิงจากย่อหน้าที่ 1 ที่ระบุว่า This is a story about ${begTitles[i]}.`
      },
      {
        question: "What makes perfect according to the text?",
        options: ["Friends", "Simple words", "Practice", "The park"],
        answer: 2,
        explanation: "ข้อนี้อ้างอิงจากย่อหน้าที่ 2 ที่ระบุว่า Practice makes perfect."
      },
      {
        question: "Where can you use English?",
        options: ["Only at home", "In many places", "Never", "In a box"],
        answer: 1,
        explanation: "ข้อนี้อ้างอิงจากย่อหน้าที่ 3 ที่ระบุว่า You can use English in many places."
      }
    ]
  });
}

// --- INTERMEDIATE ---
const intTitles = [
  "New Technology Changes Work",
  "Climate Change and the Ocean",
  "The History of the Olympic Games",
  "Healthy Eating Habits",
  "Traveling Around the World"
];

for(let i=0; i<5; i++) {
  dataset.intermediate.articles.push({
    title: intTitles[i],
    url: "https://learningenglish.voanews.com/z/986",
    audioUrl: "",
    paragraphs: [
      `Experts say ${intTitles[i].toLowerCase()} is becoming a major topic today. People around the world are paying close attention to these developments. As society evolves, understanding this issue is crucial.`,
      `In recent years, researchers have found new evidence supporting this trend. The data shows a significant increase in public interest. Governments are now starting to implement policies to address it.`,
      `However, there are still challenges to overcome. Some groups argue that more funding is necessary. They believe that without immediate action, the situation could worsen.`,
      `Looking ahead, experts are optimistic but cautious. They emphasize the need for continued education and awareness. Collaboration between nations will be the key to long-term success.`
    ],
    vocabList: [
      "crucial - adjective. สำคัญมาก, วิกฤต",
      "implement - verb. นำไปปฏิบัติ, ดำเนินการ",
      "worsen - verb. ทำให้แย่ลง",
      "optimistic - adjective. มองโลกในแง่ดี"
    ],
    quiz: [
      {
        question: "Why is understanding this issue crucial?",
        options: ["Because no one cares", "As society evolves", "It is not crucial", "Only for experts"],
        answer: 1,
        explanation: "อ้างอิงจากย่อหน้าที่ 1: As society evolves, understanding this issue is crucial."
      },
      {
        question: "What have researchers found in recent years?",
        options: ["No new evidence", "A decrease in public interest", "New evidence supporting this trend", "That governments are stopping policies"],
        answer: 2,
        explanation: "อ้างอิงจากย่อหน้าที่ 2: researchers have found new evidence supporting this trend."
      },
      {
        question: "What do some groups argue is necessary?",
        options: ["Less attention", "More funding", "Immediate surrender", "Stopping all policies"],
        answer: 1,
        explanation: "อ้างอิงจากย่อหน้าที่ 3: Some groups argue that more funding is necessary."
      },
      {
        question: "What will be the key to long-term success according to experts?",
        options: ["Ignoring the issue", "Optimism alone", "Collaboration between nations", "Less education"],
        answer: 2,
        explanation: "อ้างอิงจากย่อหน้าที่ 4: Collaboration between nations will be the key to long-term success."
      }
    ]
  });
}

// --- ADVANCED ---
const advTitles = [
  "Quantum Computing Breakthroughs",
  "Neuroplasticity and the Human Brain",
  "Global Economic Impacts of AI",
  "Deep Sea Exploration Discoveries",
  "The Future of Renewable Energy"
];

for(let i=0; i<5; i++) {
  dataset.advanced.articles.push({
    title: advTitles[i],
    url: "https://learningenglish.voanews.com/z/950",
    audioUrl: "",
    paragraphs: [
      `The realm of ${advTitles[i].toLowerCase()} represents a paradigm shift in modern scientific inquiry. Analysts postulate that these advancements will inextricably alter the landscape of human capability. The profound implications are currently being intensely debated in academic circles.`,
      `A meticulous examination of the empirical data reveals an unprecedented trajectory of growth. Proponents assert that this phenomenon mitigates traditional bottlenecks that have long hindered progress. Conversely, skeptics caution against premature implementation without rigorous regulatory frameworks.`,
      `Furthermore, the socio-economic ramifications extend far beyond initial projections. Developing nations stand on the precipice of either unprecedented technological integration or exacerbating the existing digital divide. Policymakers are consequently urged to adopt a nuanced approach to governance.`,
      `In conclusion, navigating this complex terrain requires a synthesis of multidisciplinary expertise. Stakeholders must transcend partisan divides to foster an environment conducive to ethical innovation. Ultimately, the trajectory of this field will serve as a bellwether for humanity's capacity to harness its own ingenuity safely.`
    ],
    vocabList: [
      "paradigm shift - noun. การเปลี่ยนกระบวนทัศน์, การเปลี่ยนแปลงครั้งใหญ่",
      "inextricably - adverb. อย่างแยกไม่ออก, อย่างผูกพันกันแน่นหนา",
      "empirical - adjective. ซึ่งได้จากประสบการณ์หรือการทดลอง",
      "mitigate - verb. บรรเทา, ทำให้ลดน้อยลง",
      "exacerbate - verb. ทำให้แย่ลง, ทำให้รุนแรงขึ้น",
      "bellwether - noun. ผู้นำ, เครื่องชี้วัดแนวโน้ม"
    ],
    quiz: [
      {
        question: "How do analysts describe the impact of these advancements on human capability?",
        options: [
          "They will have a negligible effect.",
          "They will inextricably alter the landscape.",
          "They will hinder progress.",
          "They will only affect academic circles."
        ],
        answer: 1,
        explanation: "อ้างอิงจากย่อหน้าที่ 1: Analysts postulate that these advancements will inextricably alter the landscape of human capability."
      },
      {
        question: "According to proponents, what does this phenomenon achieve?",
        options: [
          "It mitigates traditional bottlenecks.",
          "It increases regulatory frameworks.",
          "It causes premature implementation.",
          "It ignores empirical data."
        ],
        answer: 0,
        explanation: "อ้างอิงจากย่อหน้าที่ 2: Proponents assert that this phenomenon mitigates traditional bottlenecks..."
      },
      {
        question: "What potential risk do developing nations face regarding this advancement?",
        options: [
          "Complete technological isolation",
          "Exacerbating the existing digital divide",
          "Loss of all natural resources",
          "Immediate economic collapse"
        ],
        answer: 1,
        explanation: "อ้างอิงจากย่อหน้าที่ 3: Developing nations stand on the precipice of either unprecedented technological integration or exacerbating the existing digital divide."
      },
      {
        question: "What is required to navigate this complex terrain successfully?",
        options: [
          "A reliance on single-discipline experts",
          "Increasing partisan divides",
          "A synthesis of multidisciplinary expertise",
          "Ignoring ethical innovation"
        ],
        answer: 2,
        explanation: "อ้างอิงจากย่อหน้าที่ 4: navigating this complex terrain requires a synthesis of multidisciplinary expertise."
      },
      {
        question: "What will the trajectory of this field ultimately serve as?",
        options: [
          "A reason to halt all research",
          "A bellwether for humanity's capacity to harness ingenuity safely",
          "A warning against all technological advancements",
          "An irrelevant footnote in history"
        ],
        answer: 1,
        explanation: "อ้างอิงจากย่อหน้าที่ 4: Ultimately, the trajectory of this field will serve as a bellwether for humanity's capacity to harness its own ingenuity safely."
      }
    ]
  });
}

const outputPath = 'C:\\\\Users\\\\USER\\\\antigravity\\\\Polyglot-AI-Tutor-New\\\\src\\\\data\\\\voa_lessons.json';
fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
console.log('Successfully generated 15 mock articles!');
