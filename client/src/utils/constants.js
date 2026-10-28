export const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const CATEGORY_OPTIONS = [
  { value: 'royalty_payments', label: 'Royalty & Payments' },
  { value: 'isbn_metadata', label: 'ISBN & Metadata' },
  { value: 'printing_quality', label: 'Printing Quality' },
  { value: 'distribution_availability', label: 'Distribution & Availability' },
  { value: 'book_status_production', label: 'Production Status' },
  { value: 'general_inquiry', label: 'General Inquiry' },
];

export const BOOK_TABLE_COLUMNS = [
  { label: 'Title & Genre', align: 'left' },
  { label: 'ISBN', align: 'left' },
  { label: 'Status', align: 'left' },
  { label: 'MRP', align: 'right' },
  { label: 'Copies Sold', align: 'right' },
  { label: 'Earned', align: 'right' },
  { label: 'Paid', align: 'right' },
  { label: 'Pending', align: 'right' },
  { label: 'Action', align: 'right' },
];

export const ADMIN_QUEUE_COLUMNS = [
  { label: 'Ticket & Author', align: 'left' },
  { label: 'Category', align: 'left' },
  { label: 'Priority', align: 'left' },
  { label: 'Status', align: 'left' },
  { label: 'Assignee', align: 'left' },
  { label: 'Age', align: 'right' },
];
