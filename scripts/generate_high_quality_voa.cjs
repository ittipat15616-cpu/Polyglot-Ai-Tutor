const fs = require('fs');
const path = require('path');

const filePath = path.join('C:\\Users\\USER\\antigravity\\Polyglot-AI-Tutor-New', 'src/data/voa_lessons.json');

const structuredData = {
  beginning: {
    label: "Beginning (Let's Learn English)",
    description: "เริ่มต้นเรียนภาษาอังกฤษด้วยเนื้อหาที่เข้าใจง่าย คำศัพท์พื้นฐาน และบทสนทนาในชีวิตประจำวัน",
    articles: [
      {
        title: "Australian Navy Rescues Rower Crossing Pacific from California",
        url: "https://learningenglish.voanews.com/a/australian-navy-rescues-rower-crossing-pacific-from-california/8002695.html",
        audioUrl: "https://voa-audio.voanews.eu/vle/2025/03/07/bb7a5958-58f5-401d-2e48-08dd5c897904.mp3",
        paragraphs: [
          "A Lithuanian rower attempting to cross the Pacific Ocean has been rescued by an Australian warship after hitting stormy waters off the coast of Queensland state.",
          "Royal Australian Navy officer Justin Jones said in a statement that Aurimas Mockus was brought aboard the warship on March 3.",
          "The 44-year-old adventurer began his trip alone in October from San Diego, California. He made it to within 740 kilometers of Australia’s mainland before running into a tropical cyclone.",
          "Australia’s Maritime Safety Authority organized the rescue. It said the enclosed boat that Mockus traveled in was mostly destroyed by the powerful waters. He was only able to recover a few personal belongings from the boat.",
          "Mockus was stranded for three days in the Coral Sea east of Queensland’s coastal city of Mackay. His goal was to make it from California to the Australian state’s capital, Brisbane. The whole distance is about 12,000 kilometers.",
          "The rower turned on an emergency signal while experiencing stormy seas fueled by 80-kilometer-per-hour winds caused by Tropical Cyclone Alfred. That led to rescuers establishing radio contact with Mockus. Mockus reported he was 'fatigued,' the team said.",
          "Navy officials said the warship was taking Mockus to Sydney in New South Wales.",
          "Rowers traveling by themselves have crossed the Pacific Ocean nonstop in the past. Mockus was attempting to become one of the few to cross the sea alone and without stopping."
        ],
        vocabList: [
          "row – v. พายเรือ (โดยใช้ไม้พาย)",
          "adventurer – n. นักผจญภัย, ผู้ที่ชื่นชอบประสบการณ์น่าตื่นเต้นหรืออันตราย",
          "strand – v. ปล่อยให้ติดเกาะ หรือตกอยู่ในสถานการณ์ที่ไปไหนไม่ได้",
          "fatigued – adj. เหน็ดเหนื่อยมาก, อ่อนล้า"
        ],
        quiz: [
          {
            question: "When did the 44-year-old adventurer begin his journey from California?",
            options: ["In March", "In October", "Three days ago", "In 1983"],
            answer: 1,
            explanation: "ย่อหน้าที่ 3 ระบุว่าเขาเริ่มการเดินทางในเดือนตุลาคม (began his trip alone in October)."
          },
          {
            question: "What caused the destruction of the rower's enclosed boat?",
            options: ["A collision with an Australian warship", "A fire on board", "Powerful waters from a tropical cyclone", "A shark attack"],
            answer: 2,
            explanation: "ย่อหน้าที่ 4 ระบุว่าเรือถูกทำลายโดยน้ำที่มีความรุนแรงจากพายุไซโคลนเขตร้อน (mostly destroyed by the powerful waters)."
          },
          {
            question: "How long was Mockus stranded in the Coral Sea before being rescued?",
            options: ["One week", "Three days", "265 days", "48 hours"],
            answer: 1,
            explanation: "ย่อหน้าที่ 5 ระบุว่าเขาติดอยู่กลางทะเลเป็นเวลา 3 วัน (stranded for three days)."
          },
          {
            question: "Why did the rower turn on an emergency signal?",
            options: ["He ran out of food.", "He reached the Australian mainland.", "He experienced stormy seas and 80-km/h winds.", "He wanted to talk to his family."],
            answer: 2,
            explanation: "ย่อหน้าที่ 6 ระบุว่าเขาเปิดสัญญาณฉุกเฉินขณะเผชิญกับพายุคลื่นลมแรง (experiencing stormy seas fueled by 80-kilometer-per-hour winds)."
          }
        ]
      }
    ]
  },
  intermediate: {
    label: "Intermediate (As It Is)",
    description: "พัฒนาทักษะการอ่านด้วยข่าวสารที่ยาวขึ้น โครงสร้างประโยคซับซ้อนขึ้น",
    articles: [
      {
        title: "Researchers: South Korea’s Birth Rate Increase Last Year Unclear",
        url: "https://learningenglish.voanews.com/a/researchers-south-korea-s-birth-rate-increase-last-year-unclear-/7997203.html",
        audioUrl: "https://voa-audio.voanews.eu/vle/2025/03/05/e4a0af84-7057-4f35-9015-08dd5b02d8d7.mp3",
        paragraphs: [
          "In 2024, the number of babies born in South Korea increased for the first time in nine years. The change is welcome news for a country that is dealing with serious population problems.",
          "South Korea’s statistics agency said recently that 238,300 babies were born last year, an increase of 8,300 from a year earlier.",
          "The agency said the country’s fertility rate — the average number of babies born to each woman in her reproductive years — was 0.75 in 2024, up from 0.72 in 2023. The data represents the first time that the yearly number of births has increased since 2015.",
          "Choi Yoon Kyung is an expert with the Korea Institute of Child Care and Education. Choi told the Associated Press that researchers must wait for more data over the next few years to see if increased births were driven by “structural changes.”",
          "Park Hyun Jung is with the government agency Statistics Korea. Park said the agency believes the rise is partly due to an increase in marriages following postponements of such plans during the COVID-19 pandemic.",
          "Park said another reason for the increase is that a growing number of people entered their early 30s. She also noted a government study that shows a small increase in the number of young people hoping to have children after marriage.",
          "Official data show South Korea’s fertility rate has been the lowest in the developed world in recent years. In 2022, South Korea was the only country with a fertility rate below one, among members of the Paris-based Organization for Economic Cooperation and Development.",
          "The low fertility rate could threaten South Korea’s economic health. The country, Asia’s fourth largest economy, could face labor shortages and greater spending on public assistance programs.",
          "But experts say that it will be difficult to solve the country’s population problems. Many young people say they do not want to have babies. Their reasons include costly housing, low levels of upward social movement, the high costs of raising and educating children, and a culture that requires women to do more of the childcare.",
          "Park said that the fertility rate will likely stay on an upward movement at least for another year. But observers say it remains to be seen whether the rate will go back down as post-pandemic marriages even out. The country’s population structure will also change, with a drop in the number of people in their early 30s."
        ],
        vocabList: [
          "steep – adj. สูงชัน หรือลดลง/เพิ่มขึ้นอย่างรวดเร็วมาก",
          "fertility rate – n. อัตราเจริญพันธุ์ (จำนวนเด็กเฉลี่ยที่เกิดต่อผู้หญิงหนึ่งคน)",
          "postponement – n. การเลื่อนเวลาออกไป",
          "labor shortage – n. ภาวะขาดแคลนแรงงาน"
        ],
        quiz: [
          {
            question: "What is the main significance of the baby birth statistics in South Korea for the year 2024?",
            options: [
              "It represents the highest birth rate in the world.",
              "It marks the first increase in the number of births in almost a decade.",
              "It shows a decline compared to the previous year.",
              "It indicates that population problems have been fully solved."
            ],
            answer: 1,
            explanation: "ย่อหน้าที่ 1 และ 3 ระบุว่าจำนวนเด็กแรกเกิดเพิ่มขึ้นเป็นครั้งแรกในรอบ 9 ปี นับตั้งแต่ปี 2015"
          },
          {
            question: "According to Park Hyun Jung, what is one of the primary factors contributing to the recent rise in births?",
            options: [
              "An increase in government financial support for all families.",
              "A decrease in housing costs for young couples.",
              "A rise in marriages that had been delayed due to the pandemic.",
              "Structural changes that occurred over the last few years."
            ],
            answer: 2,
            explanation: "ย่อหน้าที่ 5 (ข้อความของ Park) อธิบายว่าการเพิ่มขึ้นเกิดจากการแต่งงานที่เพิ่มขึ้นหลังจากการเลื่อนกำหนดการในช่วงการระบาดของโควิด-19"
          },
          {
            question: "What potential consequence does South Korea face due to its exceptionally low fertility rate?",
            options: [
              "An oversupply of labor in the market.",
              "A decrease in public assistance spending.",
              "A potential shortage of workers and economic threats.",
              "An immediate increase in the number of people in their early 30s."
            ],
            answer: 2,
            explanation: "ย่อหน้าที่ 8 ระบุว่าประเทศอาจเผชิญกับปัญหาขาดแคลนแรงงานและผลกระทบต่อเศรษฐกิจ (threaten economic health, labor shortages)."
          },
          {
            question: "Which of the following is NOT mentioned in the article as a reason why many young South Koreans are hesitant to have children?",
            options: [
              "Expensive housing prices.",
              "High costs of education and childcare.",
              "Lack of interest in getting married.",
              "Unequal distribution of childcare responsibilities between men and women."
            ],
            answer: 2,
            explanation: "ย่อหน้าที่ 9 ระบุถึงราคาบ้าน ค่าเลี้ยงดู และวัฒนธรรมที่ผู้หญิงต้องรับภาระเลี้ยงลูกมากกว่า แต่ไม่ได้ระบุว่าไม่อยากแต่งงาน"
          },
          {
            question: "What do observers believe about the future trend of the fertility rate in South Korea?",
            options: [
              "It is guaranteed to continue rising for the next decade.",
              "It will experience a sharp 45-degree drop immediately.",
              "It is uncertain whether the rate will remain high after post-pandemic marriages settle.",
              "It will definitely decrease next year due to a drop in marriages."
            ],
            answer: 2,
            explanation: "ย่อหน้าสุดท้ายระบุว่ายังคงต้องจับตาดูว่าอัตรานี้จะลดลงหรือไม่หลังจากที่การแต่งงานชดเชยช่วงโควิดลดระดับลงเป็นปกติ (remains to be seen whether the rate will go back down as post-pandemic marriages even out)."
          }
        ]
      }
    ]
  },
  advanced: {
    label: "Advanced (Education & Science)",
    description: "ท้าทายด้วยคำศัพท์เชิงวิชาการ และคำถามเชิงวิเคราะห์ (Inference)",
    articles: [
      {
        title: "France Sets New Record in Hunt for Nuclear Fusion",
        url: "https://learningenglish.voanews.com/a/france-sets-new-record-in-hunt-for-nuclear-fusion/7980845.html",
        audioUrl: "https://voa-audio.voanews.eu/vle/2025/02/20/0c5b946d-117b-4862-fc34-08dd4a817620.mp3",
        paragraphs: [
          "Scientists in France have reached a new milestone in the quest to harness nuclear fusion, the same process that powers the sun and stars. A team operating the WEST tokamak reactor achieved a plasma temperature of about 50 million degrees Celsius for a record six minutes.",
          "Nuclear fusion occurs when two light atomic nuclei combine to form a heavier nucleus, releasing a massive amount of energy. Unlike nuclear fission, which splits atoms and creates long-lasting radioactive waste, fusion has the potential to provide a clean, nearly limitless source of energy.",
          "The WEST reactor, located in Cadarache, southern France, uses strong magnetic fields to confine the super-hot plasma. The recent achievement is significant because sustaining the plasma for a longer duration is one of the biggest challenges in fusion research.",
          "While 50 million degrees is extremely hot, it is still not the 150 million degrees needed for commercial fusion power. However, keeping the plasma stable for six minutes represents a major step forward.",
          "Researchers emphasize that practical and affordable fusion energy might still be decades away. The materials used to build the reactors must withstand extreme heat and radiation, and the energy produced must ultimately be greater than the energy consumed to start the reaction."
        ],
        vocabList: [
          "milestone – n. ความสำเร็จหรือเหตุการณ์สำคัญในประวัติศาสตร์",
          "harness – v. ควบคุมและนำมาใช้ประโยชน์",
          "fission – n. การแตกตัวของนิวเคลียส (กระบวนการผลิตพลังงานนิวเคลียร์แบบดั้งเดิม)",
          "withstand – v. ทนทานต่อ, ต่อต้าน"
        ],
        quiz: [
          {
            question: "What is the primary difference between nuclear fusion and nuclear fission mentioned in the text?",
            options: [
              "Fusion splits atoms, while fission combines them.",
              "Fusion creates long-lasting radioactive waste, unlike fission.",
              "Fusion combines atomic nuclei to produce clean energy, while fission splits them.",
              "Fission powers the sun, while fusion is used in modern reactors."
            ],
            answer: 2,
            explanation: "ย่อหน้าที่ 2 อธิบายว่า fusion คือการรวมนิวเคลียสเพื่อให้พลังงานสะอาด ส่วน fission คือการแยกอะตอมและสร้างขยะกัมมันตภาพรังสี"
          },
          {
            question: "Why is the recent six-minute achievement by the WEST reactor considered significant?",
            options: [
              "It achieved the 150 million degrees necessary for commercial use.",
              "It proved that nuclear fusion can currently power a small city.",
              "Sustaining plasma for an extended period is a major challenge in fusion research.",
              "It discovered a new method of cooling down nuclear reactors."
            ],
            answer: 2,
            explanation: "ย่อหน้าที่ 3 และ 4 ระบุว่าความสำเร็จนี้สำคัญเพราะการรักษาเสถียรภาพของพลาสมาให้ได้นานๆ เป็นหนึ่งในความท้าทายที่ใหญ่ที่สุด (sustaining the plasma for a longer duration is one of the biggest challenges)."
          },
          {
            question: "Which of the following remains a major obstacle before commercial fusion power can be realized?",
            options: [
              "Finding scientists who are willing to work in Cadarache.",
              "Developing materials capable of withstanding extreme heat and radiation.",
              "Preventing the sun from losing its fusion energy.",
              "Creating radioactive waste to fuel the reactors."
            ],
            answer: 1,
            explanation: "ย่อหน้าสุดท้ายระบุถึงอุปสรรคว่า วัสดุที่ใช้สร้างเตาปฏิกรณ์จะต้องทนทานต่อความร้อนและรังสีที่รุนแรงได้ (materials must withstand extreme heat and radiation)."
          }
        ]
      }
    ]
  }
};

fs.writeFileSync(filePath, JSON.stringify(structuredData, null, 2));
console.log('High-quality VOA mock data applied.');
