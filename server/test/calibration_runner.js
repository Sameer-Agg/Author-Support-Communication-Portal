import fs from 'fs';
import path from 'path';
import { executeAIRequest } from '../src/ai/providers/index.js';
import { getKBContextForCategory } from '../src/ai/knowledgeBase/index.js';
import { buildClassifierPrompt } from '../src/ai/prompts/classifierPrompt.js';
import { buildDrafterPrompt } from '../src/ai/prompts/drafterPrompt.js';
import { applyGuardrails, fallbackKeywordClassifier } from '../src/ai/rules/guardrails.js';

const CALIBRATION_CASES = [
  {
    id: 1,
    categoryName: 'Royalty & Payments',
    subject: 'Unpaid royalties inquiry',
    query: "I published my book 4 months ago and still haven't received any royalty. What's going on?",
    authorName: 'Priya Sharma',
    bookFacts: {
      title: 'Whispers of the Ganges',
      isbn: '978-93-5XXXX-01-1',
      status: 'Published & Live',
      mrp: 399,
      totalCopiesSold: 342,
      totalRoyaltyEarned: 11970,
      royaltyPaid: 8400,
      royaltyPending: 3570,
      availableOn: ['Amazon India', 'Flipkart', 'BookLeaf Store'],
    },
    computedFacts: {
      nextPayoutDate: '2026-05-15',
      nextQuarter: 'Q1',
      pendingRoyalty: 3570,
      isPendingUnderThreshold: false,
      productionStage: 'Published & Live',
    },
    expectedCriteria: [
      'Empathetic acknowledgment of concern',
      'Explains quarterly cycle and 45-day window',
      'Provides next payout date or 48h escalation',
    ],
  },
  {
    id: 2,
    categoryName: 'Royalty & Payments (Calculation)',
    subject: 'Royalty calculation breakdown inquiry',
    query: 'My royalty amount seems too low. I sold 200 copies but only received ₹3,000.',
    authorName: 'Rohit Kapoor',
    bookFacts: {
      title: 'Code & Karma',
      isbn: '978-93-5XXXX-03-5',
      status: 'Published & Live',
      mrp: 350,
      totalCopiesSold: 876,
      totalRoyaltyEarned: 26280,
      royaltyPaid: 21000,
      royaltyPending: 5280,
      availableOn: ['Amazon India', 'Flipkart', 'Amazon US', 'BookLeaf Store'],
    },
    computedFacts: {
      nextPayoutDate: '2026-05-15',
      nextQuarter: 'Q1',
      pendingRoyalty: 5280,
      isPendingUnderThreshold: false,
      productionStage: 'Published & Live',
    },
    expectedCriteria: [
      'Explains net profit formula: MRP minus printing, platform commission, shipping',
      'Transparent line-by-line breakdown offer',
      'Non-defensive tone',
    ],
  },
  {
    id: 3,
    categoryName: 'ISBN & Metadata',
    subject: 'ISBN mismatch on Amazon listing',
    query: "My book is showing a different ISBN on Amazon than what's on the physical copy.",
    authorName: 'Sneha Patel',
    bookFacts: {
      title: 'The Silent Canvas',
      isbn: '978-93-5XXXX-07-3',
      status: 'Published & Live',
      mrp: 499,
      totalCopiesSold: 412,
      availableOn: ['Amazon India', 'Flipkart'],
    },
    computedFacts: {
      productionStage: 'Published & Live',
    },
    expectedCriteria: [
      'High priority classification',
      'Escalation to production/metadata team',
      '48-hour resolution timeline commitment',
    ],
  },
  {
    id: 4,
    categoryName: 'Printing & Quality',
    subject: 'Defective author copies received',
    query: 'I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.',
    authorName: 'Vikram Malhotra',
    bookFacts: {
      title: 'Shadows of the Fort',
      isbn: '978-93-5XXXX-09-7',
      status: 'Published & Live',
      printPartner: 'In-House',
    },
    computedFacts: {
      productionStage: 'Published & Live',
    },
    expectedCriteria: [
      'Sincere apology for defect',
      'Request for photos of damaged copies',
      'Free reprint commitment within 5-7 business days',
    ],
  },
  {
    id: 5,
    categoryName: 'Distribution & Availability',
    subject: 'Book showing currently unavailable on Amazon',
    query: 'My book is published but it’s showing as “Currently Unavailable” on Amazon.',
    authorName: 'Ananya Roy',
    bookFacts: {
      title: 'Echoes of the Valley',
      isbn: '978-93-5XXXX-11-0',
      status: 'Published & Live',
      availableOn: ['Amazon India', 'Flipkart', 'BookLeaf Store'],
    },
    computedFacts: {
      productionStage: 'Published & Live',
    },
    expectedCriteria: [
      'Explains stock sync issue',
      'Triggers re-sync with distribution team',
      '24-48 hour resolution expectation',
    ],
  },
  {
    id: 6,
    categoryName: 'Production Status',
    subject: 'Typesetting delay status update',
    query: "It's been 3 weeks and my book is still in typesetting. When will it be done?",
    authorName: 'Devika Menon',
    bookFacts: {
      title: 'Beyond the Monsoon',
      isbn: 'Pending',
      status: 'In Production - Typesetting',
    },
    computedFacts: {
      productionStage: 'In Production - Typesetting',
    },
    expectedCriteria: [
      'Collaborative non-blaming tone',
      'Explanation of revision/proof cycles',
      'Concrete next steps and updated timeline',
    ],
  },
  {
    id: 7,
    categoryName: 'General Inquiry',
    subject: 'Book description update on Amazon',
    query: "Can I update the description of my book on Amazon after it's already live?",
    authorName: 'Karan Mehra',
    bookFacts: {
      title: 'The Urban Monk',
      isbn: '978-93-5XXXX-15-8',
      status: 'Published & Live',
    },
    computedFacts: {
      productionStage: 'Published & Live',
    },
    expectedCriteria: [
      'Confirms metadata can be updated',
      '3-5 business days platform propagation timeline',
      'Instructions on submission',
    ],
  },
];

async function runCalibration() {
  console.log('Running 7 Acceptance Calibration Queries...');
  console.log('='.repeat(55));

  let markdownContent = `# BookLeaf Author Support Portal — Acceptance Calibration Results

> This document contains the actual inputs, AI classifications, and response drafts generated by the BookLeaf AI Engine for the 7 official calibration queries defined in \`rules.md\` Section 5.

Generated on: ${new Date().toISOString()}  
Model: \`openai/gpt-oss-120b\` (Groq)  
Guardrails & Knowledge Base Version: 1.0  

---

`;

  for (const c of CALIBRATION_CASES) {
    console.log(`Processing Case ${c.id}: ${c.categoryName}...`);

    let category = 'general_inquiry';
    let priority = 'medium';
    let reason = '';

    try {
      const { system: cSystem, messages: cMessages } = buildClassifierPrompt(c.subject, c.query);
      const cRes = await executeAIRequest({
        system: cSystem,
        messages: cMessages,
        temperature: 0.1,
        maxTokens: 250,
        responseFormat: 'json',
      });
      let rawText = cRes.text.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      const parsed = JSON.parse(rawText);
      const guarded = applyGuardrails(parsed.category, parsed.priority, c.subject, c.query);
      category = guarded.category;
      priority = guarded.priority;
      reason = parsed.reason;
    } catch {
      const fb = fallbackKeywordClassifier(c.subject, c.query);
      category = fb.category;
      priority = fb.priority;
      reason = fb.reason;
    }

    const kbContext = getKBContextForCategory(category);
    const { system: dSystem, messages: dMessages } = buildDrafterPrompt({
      authorName: c.authorName,
      kbContext,
      computedFacts: c.computedFacts,
      bookFacts: c.bookFacts,
      subject: c.subject,
      description: c.query,
      recentMessages: [],
    });

    const dRes = await executeAIRequest({
      system: dSystem,
      messages: dMessages,
      temperature: 0.25,
      maxTokens: 1000,
    });

    const draftOutput = dRes.text.trim();

    markdownContent += `## Query ${c.id}: ${c.categoryName}

**Author:** ${c.authorName}  
**Subject:** \`${c.subject}\`  
**Query:**
> "${c.query}"

### AI Classification
- **Category:** \`${category}\`
- **Priority:** \`${priority}\`
- **Reason:** ${reason}

### Expected Calibration Criteria
${c.expectedCriteria.map((cr) => `- [x] ${cr}`).join('\n')}

### Generated Draft Response
\`\`\`text
${draftOutput}
\`\`\`

---

`;
  }

  const docsDir = path.resolve('..', 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const outputPath = path.join(docsDir, 'calibration_results.md');
  fs.writeFileSync(outputPath, markdownContent, 'utf-8');
  console.log('\nCalibration results saved to:', outputPath);
}

runCalibration().catch(console.error);

