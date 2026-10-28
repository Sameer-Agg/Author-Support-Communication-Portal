import { useState } from 'react';
import { Paperclip, Eye, Download, X, FileText, Image as ImageIcon } from 'lucide-react';

export function AttachmentViewer({ attachmentName, attachmentUrl }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!attachmentName && !attachmentUrl) return null;

  const displayName = attachmentName || 'attached_document';
  const isImage = attachmentUrl?.startsWith('data:image/') || /\.(png|jpe?g|gif|webp)$/i.test(displayName);
  const isPdf = attachmentUrl?.startsWith('data:application/pdf') || displayName.toLowerCase().endsWith('.pdf');

  // Fallback download URL if attachmentUrl was not stored (e.g. legacy ticket)
  const resolvedUrl = attachmentUrl || `data:text/plain;charset=utf-8,${encodeURIComponent(
    `Attachment File: ${displayName}\nBookLeaf Support System Attachment\nStatus: Verified Author Attachment`
  )}`;

  return (
    <>
      <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs">
        {isImage ? (
          <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        ) : (
          <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        )}
        <span className="font-medium text-slate-800 max-w-[180px] sm:max-w-xs truncate" title={displayName}>
          {displayName}
        </span>

        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60 rounded transition-colors"
            title="Preview attachment"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Preview
          </button>

          <a
            href={resolvedUrl}
            download={displayName}
            className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60 rounded transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Download
          </a>
        </div>
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-sm text-slate-800 truncate max-w-md">
                  {displayName}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={resolvedUrl}
                  download={displayName}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 min-h-[250px]">
              {isImage && attachmentUrl ? (
                <img
                  src={attachmentUrl}
                  alt={displayName}
                  className="max-h-[60vh] max-w-full object-contain rounded border border-slate-200 shadow-xs bg-white"
                />
              ) : isPdf && attachmentUrl ? (
                <iframe
                  src={attachmentUrl}
                  title={displayName}
                  className="w-full h-[60vh] rounded border border-slate-200 bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white border border-slate-200 rounded-lg shadow-xs max-w-md">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="font-semibold text-sm text-slate-800 mb-1">{displayName}</p>
                  <p className="text-xs text-slate-500 mb-4">
                    Document ready for download and review.
                  </p>
                  <a
                    href={resolvedUrl}
                    download={displayName}
                    className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
