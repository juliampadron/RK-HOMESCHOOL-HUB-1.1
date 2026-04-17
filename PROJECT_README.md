# RK Homeschool Hub 1.1

**Renaissance Kids Homeschool Hub** - A comprehensive platform for managing homeschool education, tracking progress, and generating NYS-compliant quarterly reports.

## Features

### 🎮 Interactive Educational Games
- **Solfege Staircase** - Musical ear training game for learning the major scale
- **Color Mixing Canvas** - Art education tool for color theory
- More games coming soon!

### 📊 Quarterly Progress Reports
Generate comprehensive NYS-compliant quarterly homeschool progress reports that include:

- Student information and instruction summary
- Subject area hour breakdowns
- NYS Learning Standards alignment
- Portfolio evidence submissions
- Instructor feedback and certifications
- Parent/guardian signature sections

See [QUARTERLY_REPORTS_README.md](./QUARTERLY_REPORTS_README.md) for detailed documentation.

### 🗄️ Data Management
- Student enrollment tracking
- Hours/attendance logging
- Portfolio item storage
- NYS standards tracking
- Game activity monitoring

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Storage**: Supabase Storage
- **PDF Generation**: @react-pdf/renderer
- **Payments**: Square (for premium features)

## Project Structure

```
RK-HOMESCHOOL-HUB-1.1/
├── app/
│   ├── api/
│   │   ├── checkout/          # Payment processing
│   │   └── reports/
│   │       └── generate/      # Quarterly report generation
│   ├── components/
│   │   └── QuarterlyReportPDF.tsx  # PDF template
│   └── types/
│       └── quarterly-reports.ts    # TypeScript definitions
├── homeschool-hub/
│   └── solfege-staircase/     # Educational games
├── supabase/
│   ├── migrations/            # Database schema migrations
│   └── templates/             # Handlebars templates for worksheets
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- (Optional) Square account for payments

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/juliampadron/RK-HOMESCHOOL-HUB-1.1.git
cd RK-HOMESCHOOL-HUB-1.1
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

4. **Run database migrations**

```bash
# Initialize the base schema
supabase migration up 20260226_init_hub

# Add quarterly reports tables
supabase migration up 20260307_quarterly_reports

# (Optional) Load sample data for testing
supabase migration up 20260307_sample_data
```

5. **Create Supabase Storage bucket**

Create a public bucket named `reports` in your Supabase project for storing generated PDFs.

6. **Start the development server**

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Database Schema

The application uses the following main tables:

- `students` - Student profiles and information
- `instructors` - Instructor/teacher details
- `classes` - Course/class definitions
- `enrollments` - Student-class relationships
- `hours_log` - Attendance and hours tracking
- `portfolio_items` - Student work samples
- `nys_standards_met` - NYS standards achievement tracking
- `instructor_feedback` - Quarterly instructor comments
- `quarterly_reports` - Generated report audit trail
- `game_activity` - Educational game usage data

See `supabase/migrations/` for complete schema definitions.

## API Documentation

### Generate Quarterly Report

**POST** `/api/reports/generate`

Generate a new quarterly progress report PDF.

**Request:**
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
  "reportId": "uuid"
}
```

### List Reports

**GET** `/api/reports/generate?studentId=<uuid>`

Retrieve previously generated reports for a student.

See [QUARTERLY_REPORTS_README.md](./QUARTERLY_REPORTS_README.md) for complete API documentation.

## Security

- **Row Level Security (RLS)** - Database-level access control ensures parents only see their own students' data
- **JWT Authentication** - All API routes require valid Supabase authentication tokens
- **Service Role Isolation** - Privileged operations use server-side service role key
- **Public Storage** - PDF URLs are publicly accessible but obfuscated

## Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Follow Next.js App Router conventions
- Use Supabase client for database operations

### Adding New Features

1. Create database migration in `supabase/migrations/`
2. Add TypeScript types in `app/types/`
3. Implement API routes in `app/api/`
4. Add UI components as needed
5. Update documentation

## Testing

### Manual Testing

1. Create test data using sample migration
2. Test API endpoints with curl or Postman
3. Verify PDF generation and storage
4. Check RLS policies prevent unauthorized access

## Deployment

The application can be deployed to:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Self-hosted** (using Docker or Node.js)

Ensure all environment variables are configured in your deployment platform.

## Contributing

This is a private repository for Renaissance Kids, Inc.

## Support

For issues or questions:
- Create an issue in this repository
- Contact Renaissance Kids at (845) 452-4225
- Email: info@renkids.org

## License

Copyright © 2026 Renaissance Kids, Inc.

---

**Renaissance Kids, Inc.**
1343 Route 44, Pleasant Valley, NY 12569
(845) 452-4225 | www.renkids.org
