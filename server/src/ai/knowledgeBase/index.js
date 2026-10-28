import { companyOverview } from './companyOverview.js';
import { royaltyPolicy } from './royaltyPolicy.js';
import { isbnPolicy } from './isbnPolicy.js';
import { printingQuality } from './printingQuality.js';
import { distributionAvailability } from './distributionAvailability.js';
import { productionStages } from './productionStages.js';
import { toneGuidelines } from './toneGuidelines.js';

const CATEGORY_KB_MAP = {
  royalty_payments: royaltyPolicy,
  isbn_metadata: isbnPolicy,
  printing_quality: printingQuality,
  distribution_availability: distributionAvailability,
  book_status_production: productionStages,
  general_inquiry: `${productionStages}\n\n${distributionAvailability}`,
};

export function getKBContextForCategory(category) {
  const policy = CATEGORY_KB_MAP[category] || CATEGORY_KB_MAP.general_inquiry;
  return `${companyOverview}\n\n${policy}\n\n${toneGuidelines}`;
}

