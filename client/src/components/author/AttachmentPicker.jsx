import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';

export function AttachmentPicker({ attachmentName, attachmentUrl, onFileChange, onRemove }) {
  const isImage = attachmentUrl?.startsWith('data:image/') || /\.(png|jpe?g|gif|webp)$/i.test(attachmentName || '');

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        Supporting Attachment
      </label>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-md shadow-xs text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
          <Paperclip className="w-4 h-4 mr-2 text-slate-500" />
          Choose File
          <input
            type="file"
            onChange={onFileChange}
            className="sr-only"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </label>

        {attachmentName && (
          <div className="flex items-center space-x-2 text-sm text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md">
            {isImage && attachmentUrl ? (
              <img
                src={attachmentUrl}
                alt="Upload preview"
                className="w-6 h-6 object-cover rounded border border-slate-300"
              />
            ) : isImage ? (
              <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span className="truncate max-w-xs font-medium text-xs">{attachmentName}</span>
            <button
              type="button"
              onClick={onRemove}
              className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Supported file types: PNG, JPG, PDF, DOC, TXT (Maximum 5MB). File will be accessible to support team and AI assistant.
      </p>
    </div>
  );
}


