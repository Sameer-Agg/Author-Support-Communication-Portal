export function applyGuardrails(rawCategory, rawPriority, subject, description) {
  const text = `${subject} ${description}`.toLowerCase();

  let category = rawCategory;
  let priority = rawPriority;

  if (
    text.includes('isbn') &&
    (text.includes('mismatch') || text.includes('wrong') || text.includes('different') || text.includes('error') || text.includes('duplicate'))
  ) {
    category = 'isbn_metadata';
    if (priority === 'low' || priority === 'medium') {
      priority = 'high';
    }
  }

  if (
    (text.includes('legal') || text.includes('lawyer') || text.includes('court') || text.includes('sue') || text.includes('consumer forum'))
  ) {
    priority = 'critical';
  } else if (
    text.includes('haven\'t received') ||
    text.includes('havent received') ||
    text.includes('not received') ||
    text.includes('missing royalty') ||
    text.includes('royalty overdue') ||
    text.includes('unpaid')
  ) {
    if (priority === 'low') {
      priority = 'high';
    }
  }

  if (
    text.includes('update bio') ||
    text.includes('update author bio') ||
    text.includes('update description') ||
    text.includes('change photo') ||
    text.includes('how can i') ||
    text.includes('how do i')
  ) {
    if (!text.includes('royalty') && !text.includes('isbn') && !text.includes('print') && !text.includes('defective')) {
      if (priority === 'critical' || priority === 'high') {
        priority = 'low';
      }
    }
  }

  return { category, priority };
}

export function fallbackKeywordClassifier(subject, description) {
  const text = `${subject} ${description}`.toLowerCase();

  let category = 'general_inquiry';
  let priority = 'medium';
  let reason = 'Determined via heuristic rule analysis.';

  if (text.includes('royalty') || text.includes('payout') || text.includes('payment') || text.includes('bank') || text.includes('earned')) {
    category = 'royalty_payments';
    if (text.includes('not received') || text.includes('haven\'t received') || text.includes('missing') || text.includes('overdue')) {
      priority = 'high';
      reason = 'Author reports missing or delayed royalty payment.';
    } else {
      priority = 'medium';
      reason = 'Author inquiring regarding royalty figures or calculation breakdown.';
    }
  } else if (text.includes('isbn')) {
    category = 'isbn_metadata';
    priority = 'high';
    reason = 'ISBN issue flagged as high priority per metadata policy.';
  } else if (text.includes('print') || text.includes('misprint') || text.includes('binding') || text.includes('blurry') || text.includes('quality') || text.includes('damaged')) {
    category = 'printing_quality';
    priority = 'high';
    reason = 'Defective printed copy requires photo verification and reprint evaluation.';
  } else if (text.includes('unavailable') || text.includes('amazon') || text.includes('flipkart') || text.includes('out of stock') || text.includes('listing')) {
    category = 'distribution_availability';
    priority = 'high';
    reason = 'Listing availability discrepancy requires stock sync check.';
  } else if (text.includes('typesetting') || text.includes('cover design') || text.includes('proofreading') || text.includes('production') || text.includes('status') || text.includes('stage')) {
    category = 'book_status_production';
    priority = 'medium';
    reason = 'Author inquiring about current production stage and expected schedule.';
  } else if (text.includes('update') || text.includes('bio') || text.includes('description') || text.includes('can i')) {
    category = 'general_inquiry';
    priority = 'low';
    reason = 'General administrative or metadata update request.';
  }

  if (
    text.includes('legal') ||
    text.includes('lawyer') ||
    text.includes('court') ||
    text.includes('sue') ||
    text.includes('consumer forum')
  ) {
    priority = 'critical';
    reason = 'Legal or escalation keyword detected in query.';
  }

  return { category, priority, reason };
}

