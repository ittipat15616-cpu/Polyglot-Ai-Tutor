import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import AnnotationToolbar, { AnnotationState } from './AnnotationToolbar';
import AnnotatableImage from './AnnotatableImage';

interface DocumentGalleryProps {
  type: 'hsk' | 'courseware';
  folder: string;
  prefix: string;
  hideLastNPages?: number;
  hideDownload?: boolean;
  prependNode?: React.ReactNode;
  enableAnnotation?: boolean;
}

import manifestData from '../data/image_manifest.json';

const BUCKET_NAME = 'polyglot-ai-tuto.firebasestorage.app';

export default function DocumentGallery({ 
  type, folder, prefix, hideLastNPages = 0, hideDownload = false, prependNode, enableAnnotation = false 
}: DocumentGalleryProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Annotation State
  const [annotationState, setAnnotationState] = useState<AnnotationState>({
    activeTool: 'none',
    color: '#ef4444',
    size: 4
  });
  const [clearTrigger, setClearTrigger] = useState(0);

  useEffect(() => {
    setLoading(true);
    
    // Determine the base path key in the manifest
    const basePath = type === 'hsk' ? 'HSK_Images' : 'Courseware_Images';
    const manifestKey = `${basePath}/${folder}`;
    
    // Assert manifest as a Record of string arrays
    const manifest = manifestData as Record<string, string[]>;
    const folderFiles = manifest[manifestKey] || [];
    
    // Filter files matching prefix
    const matchedFiles = folderFiles.filter(f => f.startsWith(prefix) && f.endsWith('.jpg'));
    
    // Sort numerically by page number
    matchedFiles.sort((a, b) => {
      const numA = parseInt(a.match(/page(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/page(\d+)/)?.[1] || '0');
      return numA - numB;
    });
    
    // Map to Firebase Storage URLs
    let finalImages = matchedFiles.map(f => {
      const fullPath = `${manifestKey}/${f}`;
      return `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodeURIComponent(fullPath)}?alt=media`;
    });
    
    if (hideLastNPages && finalImages.length > hideLastNPages) {
      finalImages = finalImages.slice(0, finalImages.length - hideLastNPages);
    }
    
    setImages(finalImages);
    setLoading(false);
  }, [type, folder, prefix, hideLastNPages]);

  const handleDownload = (url: string, index: number) => {
    // Create an invisible link to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}_page${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <p>ไม่พบไฟล์ภาพเอกสารสำหรับเรื่องนี้</p>
        <p className="text-sm mt-2">(ไฟล์อาจกำลังอยู่ระหว่างเตรียมการ)</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 relative">
      {enableAnnotation && (
        <div className="sticky top-0 z-50 w-full p-2">
          <AnnotationToolbar 
            state={annotationState} 
            onChange={setAnnotationState} 
            onClear={() => setClearTrigger(c => c + 1)} 
          />
        </div>
      )}
      <div className="w-full flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          {prependNode}
          {images.map((url, idx) => (
            <div key={url} className="relative group bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
              {/* Image with Annotations */}
              {enableAnnotation ? (
                <AnnotatableImage 
                  src={url} 
                  alt={`${prefix} page ${idx + 1}`} 
                  className="w-full h-auto block" 
                  annotationState={annotationState}
                  clearTrigger={clearTrigger}
                  isActive={true}
                />
              ) : (
                <img src={url} alt={`${prefix} page ${idx + 1}`} className="w-full h-auto block" />
              )}
            
            {/* Page Number indicator */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold z-10">
              หน้าที่ {idx + 1}
            </div>

            {!hideDownload && (
              <>
                {/* Download Button */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    onClick={() => handleDownload(url, idx)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg flex items-center gap-2 transform hover:scale-105 transition-all"
                    title="ดาวน์โหลดภาพหน้านี้"
                  >
                    <Download size={18} />
                    <span className="text-sm font-bold pr-1">ดาวน์โหลด</span>
                  </button>
                </div>
                
                {/* Download Button (Mobile Fallback always visible slightly) */}
                <div className="absolute bottom-4 right-4 md:hidden z-10">
                  <button 
                    onClick={() => handleDownload(url, idx)}
                    className="bg-indigo-600/90 text-white p-2.5 rounded-full shadow-lg"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
