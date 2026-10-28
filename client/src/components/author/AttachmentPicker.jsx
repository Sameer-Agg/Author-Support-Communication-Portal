import { Paperclip, X } from 'lucide-react';

export function AttachmentPicker({ attachmentName, onFileChange, onRemove }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        Attachment <span className="text-xs font-normal text-slate-400">(UI representation only)</span>
      </label>
      <div className="mt-1 flex items-center space-x-3">
        <label className="cursor-pointer inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
          <Paperclip className="w-4 h-4 mr-2 text-slate-500" />
          Browse File
          <input
            type="file"
            onChange={onFileChange}
            className="sr-only"
            accept="image/*,.pdf,.doc,.docx"
          />
        </label>
        {attachmentName && (
          <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">
            <span className="truncate max-w-xs">{attachmentName}</span>
            <button
              type="button"
              onClick={onRemove}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Supported file types: PNG, JPG, PDF (Simulated attachment picker for evaluation).
      </p>
    </div>
  );
}

