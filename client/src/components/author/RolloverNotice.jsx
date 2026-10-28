import { HelpCircle } from 'lucide-react';

export function RolloverNotice() {
  return (
    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start space-x-3">
      <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-amber-900">Quarterly Payout Threshold Policy</div>
        <p className="mt-0.5 text-amber-700">
          Royalties below the ₹1,000 threshold roll over to subsequent quarters until cumulative earnings reach ₹1,000.
        </p>
      </div>
    </div>
  );
}

