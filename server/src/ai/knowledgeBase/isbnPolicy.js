export const isbnPolicy = `
ISBN Policy:
- Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf under BookLeaf's publisher imprint.
- If an author wants an ISBN under their own imprint, they must obtain it independently.
- ISBN errors (duplicate, wrong book linked, Amazon mismatch) are treated as serious data issues, marked high priority, and escalated immediately to the production team with a 48-hour resolution timeline.
`.trim();

