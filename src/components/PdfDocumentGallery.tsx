import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import AnnotationToolbar, { AnnotationState } from './AnnotationToolbar';
import AnnotatablePdfLayer from './AnnotatablePdfLayer';

// Configure PDF worker using local bundle (fixes hanging issues with unpkg)
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfDocumentGalleryProps {
  pdfUrl: string;
  enableAnnotation?: boolean;
}

export default function PdfDocumentGallery({ pdfUrl, enableAnnotation = false }: PdfDocumentGalleryProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Annotation State
  const [annotationState, setAnnotationState] = useState<AnnotationState>({
    activeTool: 'none',
    color: '#ef4444',
    size: 4
  });
  const [clearTrigger, setClearTrigger] = useState(0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  // To properly overlay the canvas, we need to know the rendered size of each page.
  // react-pdf's <Page> will size itself automatically. We use an onRenderSuccess callback 
  // or simply rely on absolute positioning if the Page component container is relative.
  // Actually, we can just use `width` and `height` state for each page, or rely on ResizeObserver,
  // but it's simpler: react-pdf allows passing an `onRenderSuccess` to get actual dimensions,
  // OR since <Page> renders a <canvas>, we can just absolute position our layer over it.
  
  // We'll store page dimensions to pass to AnnotatablePdfLayer
  const [pageDimensions, setPageDimensions] = useState<Record<number, { w: number, h: number }>>({});

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 relative">
      {enableAnnotation && !loading && (
        <div className="absolute top-20 sm:top-24 left-0 w-full z-50 pointer-events-none flex justify-center">
          <div className="pointer-events-auto shadow-lg rounded-full">
            <AnnotationToolbar 
              state={annotationState} 
              onChange={setAnnotationState} 
              onClear={() => setClearTrigger(c => c + 1)} 
            />
          </div>
        </div>
      )}
      <div className="w-full flex-1 overflow-y-auto p-4 pt-40 sm:pt-48 custom-scrollbar">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto items-center">
          {loading && (
            <div className="w-full h-40 flex flex-col items-center justify-center text-gray-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
              <p>กำลังโหลดเอกสาร PDF...</p>
            </div>
          )}
          
          <div className={loading ? 'hidden' : 'w-full'}>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={null}
              error={<div className="text-red-500 p-4 bg-red-50 rounded-lg">ไม่สามารถโหลดเอกสาร PDF ได้</div>}
            >
              {Array.from(new Array(numPages), (el, index) => {
                const pageNum = index + 1;
                const dims = pageDimensions[pageNum];
                return (
                  <div key={`page_${pageNum}`} className="relative bg-white shadow-md rounded-xl overflow-hidden border border-gray-200 mb-6 flex justify-center">
                    <Page 
                      pageNumber={pageNum}
                      scale={1.5} // Scale for better readability
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onRenderSuccess={(page) => {
                        // page contains width and height
                        setPageDimensions(prev => ({
                          ...prev,
                          [pageNum]: { w: page.width * 1.5, h: page.height * 1.5 }
                        }));
                      }}
                      loading={<div className="p-20 text-gray-400">กำลังโหลดหน้า...</div>}
                    />
                    
                    {enableAnnotation && dims && (
                      <AnnotatablePdfLayer
                        idKey={`${pdfUrl}_page${pageNum}`}
                        annotationState={annotationState}
                        clearTrigger={clearTrigger}
                        isActive={true}
                        width={dims.w}
                        height={dims.h}
                        className="z-10"
                      />
                    )}
                    
                    {/* Page Number indicator */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold z-20 pointer-events-none">
                      หน้าที่ {pageNum} / {numPages}
                    </div>
                  </div>
                );
              })}
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}
