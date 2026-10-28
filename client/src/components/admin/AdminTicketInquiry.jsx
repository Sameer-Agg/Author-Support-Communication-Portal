import { AttachmentViewer } from '../common/AttachmentViewer.jsx';

export function AdminTicketInquiry({ description, attachmentName, attachmentUrl }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Author Inquiry
      </div>
      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
        {description}
      </p>
      {(attachmentName || attachmentUrl) && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-500 border-t border-slate-100">
          <span className="font-semibold text-slate-600">Attached File:</span>
          <AttachmentViewer
            attachmentName={attachmentName}
            attachmentUrl={attachmentUrl}
          />
        </div>
      )}
    </div>
  );
}


