import React, { useState } from 'react';
import { FileText, Clock, ChevronLeft } from 'lucide-react';
import MockTestArea from './MockTestArea';

const hskExamsData: Record<string, { id: string, name: string, videoId: string }[]> = {
  HSK1: [
    { id: 'H10901', name: 'ข้อสอบ HSK1 ชุด H10901', videoId: '8_JRYnsB6qU' },
    { id: 'H10902', name: 'ข้อสอบ HSK1 ชุด H10902', videoId: 'tHHS1avF_yQ' },
    { id: 'H11003', name: 'ข้อสอบ HSK1 ชุด H11003', videoId: 'RYZhjRcb54g' },
    { id: 'H11004', name: 'ข้อสอบ HSK1 ชุด H11004', videoId: 'e07D-435glE' },
    { id: 'H11005', name: 'ข้อสอบ HSK1 ชุด H11005', videoId: 'y-jPjnNob9I' },
    { id: 'H11329', name: 'ข้อสอบ HSK1 ชุด H11329', videoId: 'RqhAgDClY6A' },
    { id: 'H11330', name: 'ข้อสอบ HSK1 ชุด H11330', videoId: 'vBne3H4ca4E' },
    { id: 'H11331', name: 'ข้อสอบ HSK1 ชุด H11331', videoId: 'Y6Z-yHzcqgQ' },
    { id: 'H11332', name: 'ข้อสอบ HSK1 ชุด H11332', videoId: 'fXmlHgKXkJ0' },
    { id: 'H11334', name: 'ข้อสอบ HSK1 ชุด H11334', videoId: 's02v2uE-4Bg' },
  ],
  HSK2: [
    { id: 'H20901', name: 'ข้อสอบ HSK2 ชุด H20901', videoId: 'lkdzZ9ZUmNA' },
    { id: 'H20902', name: 'ข้อสอบ HSK2 ชุด H20902', videoId: 'qQEoMpY6DYY' },
    { id: 'H21003', name: 'ข้อสอบ HSK2 ชุด H21003', videoId: 'OHqqCvpBhk0' },
    { id: 'H21004', name: 'ข้อสอบ HSK2 ชุด H21004', videoId: 'TvVQ4xBVtEo' },
    { id: 'H21005', name: 'ข้อสอบ HSK2 ชุด H21005', videoId: 'zNZWoHVT3fM' },
    { id: 'H21329', name: 'ข้อสอบ HSK2 ชุด H21329', videoId: 'L_CbpOvyu8A' },
    { id: 'H21330', name: 'ข้อสอบ HSK2 ชุด H21330', videoId: 'x-0ZdKh49_g' },
    { id: 'H21331', name: 'ข้อสอบ HSK2 ชุด H21331', videoId: 'BGTG-rfhOHE' },
    { id: 'H21332', name: 'ข้อสอบ HSK2 ชุด H21332', videoId: 'msmbWhifOIk' },
    { id: 'H21334', name: 'ข้อสอบ HSK2 ชุด H21334', videoId: 'zqBtukjwiec' },
  ],
  HSK3: [
    { id: 'H31001', name: 'ข้อสอบ HSK3 ชุด H31001', videoId: 'UlGwJaejn9E' },
    { id: 'H31002', name: 'ข้อสอบ HSK3 ชุด H31002', videoId: '_ZfnH5u5hfA' },
    { id: 'H31003', name: 'ข้อสอบ HSK3 ชุด H31003', videoId: 'jqXR7dnWUZw' },
    { id: 'H31004', name: 'ข้อสอบ HSK3 ชุด H31004', videoId: 'yaGqJMbHwKk' },
    { id: 'H31005', name: 'ข้อสอบ HSK3 ชุด H31005', videoId: 'RJjyosA2rWs' },
    { id: 'H31327', name: 'ข้อสอบ HSK3 ชุด H31327', videoId: 'qBsYyZjRqS0' },
    { id: 'H31328', name: 'ข้อสอบ HSK3 ชุด H31328', videoId: 'aM7cDmXHcUo' },
    { id: 'H31329', name: 'ข้อสอบ HSK3 ชุด H31329', videoId: '0CNCPDaTqLU' },
    { id: 'H31330', name: 'ข้อสอบ HSK3 ชุด H31330', videoId: 'iSQkOYaA7YI' },
    { id: 'H31332', name: 'ข้อสอบ HSK3 ชุด H31332', videoId: 'dqb6TtdEntc' },
  ],
  HSK4: [
    { id: 'H41001', name: 'ข้อสอบ HSK4 ชุด H41001', videoId: 'LraoOUis_dw' },
    { id: 'H41002', name: 'ข้อสอบ HSK4 ชุด H41002', videoId: '9_nm3L9pbBY' },
    { id: 'H41003', name: 'ข้อสอบ HSK4 ชุด H41003', videoId: 'K7FZZXTEqd0' },
    { id: 'H41004', name: 'ข้อสอบ HSK4 ชุด H41004', videoId: 'gIgIpJZfbig' },
    { id: 'H41005', name: 'ข้อสอบ HSK4 ชุด H41005', videoId: 'SkPYI6XEd0c' },
    { id: 'H41006', name: 'ข้อสอบ HSK4 ชุด H41006', videoId: 'zytXDibbFU0' },
    { id: 'H41007', name: 'ข้อสอบ HSK4 ชุด H41007', videoId: '4ztgMHzHl00' },
    { id: 'H41008', name: 'ข้อสอบ HSK4 ชุด H41008', videoId: 'rEmLSO7gz48' },
    { id: 'H41009', name: 'ข้อสอบ HSK4 ชุด H41009', videoId: 'Ys5b1SbscNI' },
    { id: 'H41218', name: 'ข้อสอบ HSK4 ชุด H41218', videoId: 'OfmXmLH4JT4' },
    { id: 'H41219', name: 'ข้อสอบ HSK4 ชุด H41219', videoId: 'P1tR1Tjn5Zo' },
    { id: 'H41220', name: 'ข้อสอบ HSK4 ชุด H41220', videoId: 'jU7Tvkm-bYY' },
    { id: 'H41221', name: 'ข้อสอบ HSK4 ชุด H41221', videoId: 'hExDaxcf2HY' },
    { id: 'H41327', name: 'ข้อสอบ HSK4 ชุด H41327', videoId: 'zgT1edrKNkA' },
    { id: 'H41328', name: 'ข้อสอบ HSK4 ชุด H41328', videoId: 'mAm91VlUkek' },
    { id: 'H41329', name: 'ข้อสอบ HSK4 ชุด H41329', videoId: '3jjhHHeWAS4' },
    { id: 'H41330', name: 'ข้อสอบ HSK4 ชุด H41330', videoId: '7IFs8aFM0eI' },
    { id: 'H41332', name: 'ข้อสอบ HSK4 ชุด H41332', videoId: 'TNEERk3t9W8' },
  ],
  HSK5: [
    { id: 'H51001', name: 'ข้อสอบ HSK5 ชุด H51001', videoId: '9h6ShKLMM7s' },
    { id: 'H51002', name: 'ข้อสอบ HSK5 ชุด H51002', videoId: 'KkcxtQSrKEQ' },
    { id: 'H51003', name: 'ข้อสอบ HSK5 ชุด H51003', videoId: 'QLQZF4Q5MVQ' },
    { id: 'H51004', name: 'ข้อสอบ HSK5 ชุด H51004', videoId: 'yucVuMZoOs8' },
    { id: 'H51005', name: 'ข้อสอบ HSK5 ชุด H51005', videoId: '8P4kGZMo-DI' },
    { id: 'H51327', name: 'ข้อสอบ HSK5 ชุด H51327', videoId: 'FCubat-sFKk' },
    { id: 'H51328', name: 'ข้อสอบ HSK5 ชุด H51328', videoId: 'u7PjdRrAMTU' },
    { id: 'H51329', name: 'ข้อสอบ HSK5 ชุด H51329', videoId: 'MHp3H4eg4NQ' },
    { id: 'H51330', name: 'ข้อสอบ HSK5 ชุด H51330', videoId: '5cU7XtfQ1iQ' },
    { id: 'H51332', name: 'ข้อสอบ HSK5 ชุด H51332', videoId: 'vY3kzNfuV3I' },
  ],
  HSK6: [
    { id: 'H61001', name: 'ข้อสอบ HSK6 ชุด H61001', videoId: 'qR3Ni3o7vMI' },
    { id: 'H61002', name: 'ข้อสอบ HSK6 ชุด H61002', videoId: '2i8aGAgE--g' },
    { id: 'H61003', name: 'ข้อสอบ HSK6 ชุด H61003', videoId: '8pAxx2N_VlA' },
    { id: 'H61004', name: 'ข้อสอบ HSK6 ชุด H61004', videoId: 'ShoZIr0QIVA' },
    { id: 'H61005', name: 'ข้อสอบ HSK6 ชุด H61005', videoId: 'fAn-0n0TrGo' },
    { id: 'H61327', name: 'ข้อสอบ HSK6 ชุด H61327', videoId: 'fjH9mqsu56c' },
    { id: 'H61328', name: 'ข้อสอบ HSK6 ชุด H61328', videoId: 'iRJujU8kHUs' },
    { id: 'H61329', name: 'ข้อสอบ HSK6 ชุด H61329', videoId: 'Oe_c1Sm8494' },
    { id: 'H61330', name: 'ข้อสอบ HSK6 ชุด H61330', videoId: 'HtzmOTOgcjo' },
    { id: 'H61332', name: 'ข้อสอบ HSK6 ชุด H61332', videoId: 'NyiUTcHp70E' },
  ],
};

export default function MockTestsTabArea() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExamSet, setSelectedExamSet] = useState<string | null>(null);

  // If testing
  if (selectedExamSet && selectedCategory) {
    const examData = hskExamsData[selectedCategory]?.find(e => e.id === selectedExamSet);
    return (
      <MockTestArea 
        level={selectedCategory} 
        examId={selectedExamSet} 
        videoId={examData?.videoId}
        onExit={() => setSelectedExamSet(null)} 
      />
    );
  }

  // View: Choose Level
  if (!selectedCategory) {
    return (
      <div className="flex flex-col gap-8 pb-10 w-full animate-fade-in max-w-4xl mx-auto mt-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            <Clock className="text-indigo-600" size={32} />
            จำลองสอบ HSK (Mock Test)
          </h1>
          <p className="text-gray-500 font-medium">ระบบจำลองการสอบเสมือนจริงแบบจับเวลา พร้อมให้ AI ตรวจให้คะแนน</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.keys(hskExamsData).map((catId) => (
            <button
              key={catId}
              onClick={() => setSelectedCategory(catId)}
              className="group flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">จำลองสอบ {catId}</h3>
              <p className="text-sm text-gray-500 mt-2 text-center">มีทั้งหมด {hskExamsData[catId].length} ชุด</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // View: Choose specific exam set
  const examsList = hskExamsData[selectedCategory] || [];
  return (
    <div className="flex flex-col gap-6 pb-10 w-full animate-fade-in max-w-4xl mx-auto mt-4">
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <button 
          onClick={() => setSelectedCategory(null)}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">เลือกระดับ {selectedCategory}</h2>
          <p className="text-sm text-gray-500">จำลองสอบ {selectedCategory} พร้อมจับเวลาจริง</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {examsList.map((exam) => (
          <button
            key={exam.id}
            onClick={() => setSelectedExamSet(exam.id)}
            className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold shrink-0">
              <Clock size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {exam.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1 uppercase font-medium">{exam.id}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
