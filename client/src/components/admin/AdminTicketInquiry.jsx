import { Paperclip } from 'lucide-react';

export function AdminTicketInquiry({ description, attachmentName }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Author Inquiry
      </div>
      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
        {description}
      </p>
      {attachmentName && (
        <div className="pt-2 flex items-center text-xs text-slate-500 border-t border-slate-100">
          <Paperclip className="w-3.5 h-3.5 mr-1 text-slate-400" />
          <span>Attachment: </span>
          <span className="font-medium text-slate-700 ml-1">{attachmentName}</span>
        </div>
      )}
    </div>
  );
}

