import React from 'react';
import { Download, FileArchive, Settings } from 'lucide-react';

export default function DownloadsArea() {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">ดาวน์โหลดซอร์สโค้ด (Source Code)</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
        <FileArchive size={64} className="text-indigo-200 mb-6" />
        <p className="text-gray-600 text-center max-w-md mb-8">
          โปรเจกต์นี้มีขนาดใหญ่เนื่องจากมีไฟล์เสียงและข้อสอบ PDF จำนวนมาก เพื่อให้ดาวน์โหลดได้ง่ายและไม่เกินลิมิต ผมได้แบ่งไฟล์ออกเป็นส่วนย่อยๆ (ส่วนละไม่เกิน 20MB) ให้แล้วครับ
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
          {[1, 2, 3].map((part) => (
            <a 
              key={part}
              href={`/Polyglot-AI-Tutor-SourceCode.part${part}.zip`}
              download
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileArchive size={24} className="text-indigo-500" />
                <span className="font-semibold text-gray-800">Part {part}</span>
              </div>
              <Download size={20} className="text-gray-500" />
            </a>
          ))}
          
          <a 
            href="/combine.bat"
            download
            className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200 hover:border-orange-400 hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings size={24} className="text-orange-500" />
              <span className="font-semibold text-orange-800">สคริปต์รวมไฟล์ (.bat)</span>
            </div>
            <Download size={20} className="text-orange-500" />
          </a>
        </div>

        <div className="bg-indigo-50 text-indigo-800 p-4 rounded-lg w-full max-w-2xl text-sm">
          <strong>วิธีรวมไฟล์:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>ดาวน์โหลดไฟล์ Part 1, 2, 3 และไฟล์ <code>combine.bat</code> ไปไว้ใน <b>โฟลเดอร์เดียวกัน</b></li>
            <li>ดับเบิลคลิกที่ไฟล์ <code>combine.bat</code> เพื่อทำการรวมไฟล์อัตโนมัติ</li>
            <li>คุณจะได้ไฟล์ <code>Polyglot-AI-Tutor-SourceCode-Combined.zip</code> ที่นำไปแตกไฟล์เพื่อดูโค้ดทั้งหมดได้ทันที!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
