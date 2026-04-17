# Quarterly Report PDF Generation

This feature allows parents to generate quarterly homeschool progress reports for their students that comply with NYS requirements.

## Overview

The quarterly report PDF generation system creates comprehensive 5-page reports that include:

1. **Page 1**: Header & Student Information
   - Renaissance Kids branding
   - Report period and generation date
   - Student details (name, grade, parent/guardian, district)
   - Instruction summary (total hours, classes, instructors)

2. **Page 2**: Subject Breakdown
   - Hours by NYS required subject areas
   - Class listings with instructor names
   - Educational games played
   - Portfolio submission counts

3. **Page 3**: NYS Standards Alignment
   - Learning standards met during the quarter
   - Organized by subject area
   - Standard codes and descriptions

4. **Page 4**: Portfolio Evidence
   - Submitted work samples
   - Submission dates
   - Aligned NYS standards
   - Link to full online portfolio

5. **Page 5**: Instructor Notes & Signatures
   - Instructor feedback by subject
   - Parent/guardian certification section
   - Signature lines
   - Organization footer

## Technical Implementation

### Stack

- **Framework**: Next.js 14 (App Router)
- **PDF Generation**: `@react-pdf/renderer` v3.1.15
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth with RLS policies

### Database Schema

The following tables support quarterly report generation:

- `students` - Student information
- `instructors` - Instructor details
- `classes` - Course information
- `enrollments` - Student-class relationships
- `hours_log` - Attendance/hour tracking
- `portfolio_items` - Student work samples
- `nys_standards_met` - Standards alignment tracking
- `instructor_feedback` - Quarterly instructor comments
- `quarterly_reports` - Generated report audit trail
- `game_activity` - Educational game usage tracking

See `supabase/migrations/20260307_quarterly_reports.sql` for complete schema.

### API Endpoints

#### Generate Report

**POST** `/api/reports/generate`

Generates a new quarterly report PDF for a student.

**Request Headers:**
```
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "uuid",
  "quarter": "Q2",
  "year": 2026
}
```

**Response:**
```json
{
  "success": true,
  "reportUrl": "https://...",
  "reportId": "uuid",
  "data": { ... }
}
```

#### List Reports

**GET** `/api/reports/generate?studentId=<uuid>`

Lists previously generated reports.

**Request Headers:**
```
Authorization: Bearer <supabase-jwt-token>
```

**Query Parameters:**
- `studentId` (optional) - Filter by specific student

**Response:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "quarter": "Q2",
      "year": 2026,
      "file_url": "https://...",
      "total_hours": 127.5,
      "generated_date": "2026-03-07T..."
    }
  ]
}
```

### Security

- **Row Level Security (RLS)** policies ensure parents can only access their own students' data
- **JWT Authentication** required for all API endpoints
- **Service role key** used server-side for privileged operations
- **Public storage URLs** with obfuscated paths

### File Storage

Reports are stored in Supabase Storage:
- Bucket: `reports`
- Path: `quarterly-reports/{studentId}/{quarter}-{year}.pdf`
- Public access enabled (URLs are obfuscated)
- Automatic upsert on regeneration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `next` - Next.js framework
- `react` & `react-dom` - React
- `@react-pdf/renderer` - PDF generation
- `@supabase/supabase-js` - Supabase client
- TypeScript types

### 2. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Migrations

```bash
# Apply main schema migration
supabase migration up 20260307_quarterly_reports

# (Optional) Load sample data for testing
supabase migration up 20260307_sample_data
```

### 4. Create Storage Bucket

In Supabase dashboard:

1. Go to Storage
2. Create bucket named `reports`
3. Set to **public** access
4. Add RLS policies if needed

Or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true);
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/reports/generate`

## Usage Example

### Client-Side (Dashboard)

```typescript
async function generateReport(studentId: string, quarter: string, year: number) {
  const session = await supabase.auth.getSession();

  const response = await fetch('/api/reports/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.data.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ studentId, quarter, year }),
  });

  const result = await response.json();

  if (result.success) {
    // Open or download the PDF
    window.open(result.reportUrl, '_blank');
  }
}
```

### Sample Data

Use the sample data migration to populate test data:

1. Create a test user via Supabase Auth
2. Note the `user_id` from `auth.users`
3. Edit `20260307_sample_data.sql` to replace placeholders
4. Run the migration

## Customization

### Branding Colors

Edit `app/components/QuarterlyReportPDF.tsx`:

```typescript
const colors = {
  rkOrange: '#F05A22',
  rkBlue: '#2B59C3',
  rkYellow: '#FBC440',
  rkGreen: '#2F6B65',
  // ... customize as needed
};
```

### Footer Information

Update the footer in Page 5 of the PDF template:

```typescript
<Text>Renaissance Kids, Inc.</Text>
<Text>1343 Route 44, Pleasant Valley, NY 12569</Text>
<Text>(845) 452-4225 | www.renkids.org</Text>
```

### Report Layout

Modify `QuarterlyReportPDF.tsx` to adjust:
- Page layout and spacing
- Section ordering
- Font styles and sizes
- Additional sections

## Testing

### Manual Testing

1. Create test data using the sample migration
2. Generate a report via API:

```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"studentId": "uuid", "quarter": "Q2", "year": 2026}'
```

3. Verify the PDF at the returned URL

### Validation Checklist

- [ ] All 5 pages render correctly
- [ ] Student information is accurate
- [ ] Hours totals match database
- [ ] Subject areas are properly grouped
- [ ] NYS standards are listed correctly
- [ ] Portfolio items display with dates
- [ ] Instructor feedback appears
- [ ] Signature section is formatted properly
- [ ] Footer has correct organization info
- [ ] PDF is saved to Supabase Storage
- [ ] Report record created in database
- [ ] RLS policies prevent unauthorized access

## Troubleshooting

### "Missing required fields" error

Ensure all three fields are provided: `studentId`, `quarter`, `year`

### "Student not found or access denied"

- Verify the student exists in the database
- Check that the student's `user_id` matches the authenticated user
- Confirm RLS policies are properly configured

### "Failed to upload PDF"

- Check that the `reports` bucket exists
- Verify Supabase Storage credentials
- Ensure sufficient storage quota

### Empty or missing data in PDF

- Verify enrollments exist for the quarter date range
- Check that hours_log entries fall within the quarter
- Confirm portfolio items have submission dates
- Ensure instructor feedback has the correct quarter/year

## Future Enhancements

- [ ] Email delivery of reports to parents
- [ ] Bulk generation for all students
- [ ] Print-optimized version without colors
- [ ] Multi-language support
- [ ] Custom templates per district
- [ ] Digital signature integration
- [ ] Auto-generation at end of quarter
- [ ] Comparison with previous quarters

## License

Copyright © 2026 Renaissance Kids, Inc.
