# Gemini AI Smart Allocation Setup Guide

This guide will help you set up Gemini AI for intelligent advocate allocation in the CT MAP Title Search Portal.

## Overview

Gemini AI provides intelligent assignment allocation by analyzing:
- **Location matching**: State and district coverage
- **Product expertise**: Loan product specialization (HL, LAP, BL)
- **Workload balancing**: Current advocate capacity
- **Hub alignment**: Geographic proximity
- **Tags & specializations**: Fast TAT, High Value Expert, etc.

## Prerequisites

- Google Gemini API key (free tier available)
- Node.js environment with environment variable support

## Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key

**Note**: The free tier includes:
- 15 requests per minute
- 1 million tokens per day
- Perfect for testing and development

## Step 2: Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
touch .env
```

2. Add your API key to `.env`:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

3. Replace `your_api_key_here` with your actual API key from Step 1

**Security Note**: The `.env` file is already in `.gitignore` to prevent accidental commits of sensitive keys.

## Step 3: Restart Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Step 4: Load Test Dataset

1. Navigate to **CT Ops Dashboard**
2. Click **"🧪 Load Test Data"** button in the header
3. Confirm the dialog to load:
   - 65 pending assignments
   - 25 advocates across 10 cities
   - 10 bank hubs

## Step 5: Run AI Allocation

1. After loading test data, the **"🤖 AI Allocate All"** button will appear
2. Click it to start Gemini AI allocation
3. Confirm the dialog
4. Watch the progress dialog as Gemini processes each assignment
5. View results summary when complete

## Features

### Smart Matching Algorithm

Gemini AI uses a sophisticated prompt to analyze:

```
Assignment: LN10001 - Rajesh Kumar
Location: Mumbai, Maharashtra
Product: Home Loan
Priority: High Value

Available: 25 advocates
Criteria:
  1. Location match (CRITICAL) - Must operate in Maharashtra/Mumbai
  2. Product expertise - Home Loan experience preferred
  3. Workload balance - Lower workload preferred (0-5 max)
  4. Hub alignment - Same hub bonus
  5. Tags - "Fast TAT", "High Value Expert"
```

### AI Response Format

Gemini returns structured JSON:

```json
{
  "advocateId": "adv1",
  "advocateName": "Rohan Deshmukh",
  "confidence": 9,
  "factors": [
    "Perfect location match (Maharashtra + Mumbai)",
    "Has expertise in Home Loan",
    "Low workload (1 active case)",
    "Tagged as High Value Expert and Fast TAT"
  ],
  "reason": "Best match due to perfect location coverage, HL expertise, and low workload"
}
```

### Allocation Audit Trail

Every AI allocation is logged in the assignment's audit trail:

```
Action: ALLOCATED
Performed By: CT_OPS
Timestamp: 2025-11-22T10:30:00Z
Details: AI-allocated by Gemini (confidence: 9/10) - Best match due to perfect location coverage
```

## Usage Patterns

### 1. Full Auto-Allocation

For high-volume days (300-400 assignments):

```
1. Load all pending assignments
2. Click "🤖 AI Allocate All"
3. Let Gemini process all assignments (~1 minute per 60 assignments)
4. Review allocation results
```

### 2. Bulk + Manual Hybrid

For complex scenarios:

```
1. Use "Bulk Allocate" for straightforward cases
2. Use "🤖 AI Allocate All" for complex/high-priority assignments
3. Manual allocation for edge cases
```

### 3. Testing & Validation

Using test dataset:

```
1. Load test data (65 assignments, 25 advocates)
2. Run AI allocation
3. Check audit trails for allocation reasoning
4. Compare with rule-based allocation
```

## Performance

- **Speed**: ~1 second per assignment (with 1s rate limit delay)
- **Accuracy**: Gemini analyzes 5+ factors per assignment
- **Capacity**: Free tier handles 1,000+ allocations/day
- **Cost**: Free tier sufficient for testing; paid tier for production

### Throughput Comparison

| Method | 65 Assignments | 300 Assignments |
|--------|---------------|-----------------|
| Manual | ~3 hours | ~14 hours |
| Bulk Selection | ~15 minutes | ~1 hour |
| Rule-Based Auto | Instant | Instant |
| Gemini AI | ~1 minute | ~5 minutes |

## Troubleshooting

### "Gemini AI Not Configured" Error

**Problem**: API key not detected

**Solution**:
1. Check `.env` file exists in project root
2. Verify `VITE_GEMINI_API_KEY=your_key` is present
3. Ensure no spaces around `=`
4. Restart dev server after adding key

### Rate Limit Errors

**Problem**: "429 Too Many Requests"

**Solution**:
- Free tier: 15 requests/minute limit
- Code includes 1s delay between requests
- Upgrade to paid tier for higher limits

### Failed Allocations

**Problem**: Some assignments fail to allocate

**Reasons**:
- No advocates available in required state
- All advocates at capacity (5+ active assignments)
- API timeout or network error

**Solution**:
- Review failed assignments in results
- Add more advocates in required states
- Manually allocate edge cases

### Parse Errors

**Problem**: "Failed to parse AI response"

**Solution**:
- Gemini occasionally returns markdown-wrapped JSON
- Code automatically strips markdown blocks
- Check console for raw response if issue persists

## Cost Estimation

### Free Tier (Testing)

- **Limit**: 15 requests/minute, 1M tokens/day
- **Cost**: $0
- **Suitable for**: Development, testing, small deployments

### Paid Tier (Production)

- **Gemini 1.5 Flash**: $0.075 per 1M input tokens
- **Average tokens per allocation**: ~500 tokens
- **Daily volume (400 assignments)**: ~200K tokens
- **Monthly cost**: ~$4.50

## Best Practices

### 1. API Key Security

```bash
# ✅ DO: Use environment variables
VITE_GEMINI_API_KEY=abc123xyz

# ❌ DON'T: Hardcode in source
const apiKey = "abc123xyz" // NEVER DO THIS
```

### 2. Error Handling

```typescript
try {
  const result = await store.geminiAllocateAll();
  // Handle success
} catch (error) {
  // Always have fallback strategy
  console.error('AI allocation failed, falling back to rule-based');
  const fallback = store.autoAllocateAll();
}
```

### 3. Hybrid Approach

Don't rely 100% on AI:
- Use AI for complex, high-priority assignments
- Use rule-based for straightforward cases
- Keep manual override available

### 4. Monitor Performance

Track metrics:
- Success rate (successful / total)
- Average confidence scores
- Allocation quality (re-allocation rate)
- Processing time

## Integration with Existing System

### Rule-Based Allocation (Current)

```typescript
// Fast, deterministic, works offline
const result = store.autoAllocateAll();
// Instant results, no API calls
```

### Gemini AI Allocation (New)

```typescript
// Intelligent, context-aware, requires API
const result = await store.geminiAllocateAll();
// ~1s per assignment, API-dependent
```

### Recommended Strategy

```typescript
// Step 1: Load test data or production data
if (!dataLoaded) {
  store.loadTestData();
}

// Step 2: Use AI for complex cases
if (complexAssignments.length > 0 && geminiAvailable) {
  await store.geminiAllocateAll();
}

// Step 3: Fallback to rule-based for remaining
const remaining = store.getAssignments()
  .filter(a => a.status === AssignmentStatus.PENDING_ALLOCATION);

if (remaining.length > 0) {
  store.autoAllocateAll();
}
```

## Testing Checklist

- [ ] API key configured in `.env`
- [ ] Dev server restarted
- [ ] "🤖 AI Allocate All" button appears
- [ ] Test data loaded (65 assignments, 25 advocates)
- [ ] AI allocation completes successfully
- [ ] Results show confidence scores
- [ ] Audit trail includes AI reasoning
- [ ] Failed allocations handled gracefully
- [ ] Progress dialog shows real-time updates

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Review allocation results in assignment audit trail
4. Test with smaller dataset first (5-10 assignments)

## Next Steps

After successful setup:
1. Test with provided dataset
2. Compare AI vs rule-based allocation
3. Analyze confidence scores and reasoning
4. Adjust advocate pool as needed
5. Consider paid tier for production deployment

---

**Last Updated**: November 2025
**Gemini Model**: gemini-1.5-flash
**Free Tier Limits**: 15 req/min, 1M tokens/day
