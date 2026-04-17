# Renaissance Kids Homeschool Platform - Setup Guide

Complete setup and deployment instructions for the RK Homeschool Platform.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [External Services](#external-services)
5. [Deployment](#deployment)
6. [Testing](#testing)

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Square account (sandbox for testing, production for live)
- Checkr account (optional, for background checks)
- Git

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/juliampadron/RK-HOMESCHOOL-HUB-1.1.git
cd RK-HOMESCHOOL-HUB-1.1
```

### 2. Install Dependencies

```bash
npm install
```

Required packages:
- `@supabase/supabase-js` - Supabase client
- `uuid` - UUID generation for payments
- `pdfkit` - PDF generation for reports
- `next` - Next.js framework

### 3. Environment Variables

Create `.env.local` file in the root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Square Payment Configuration
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_APP_ID=your-square-app-id
SQUARE_LOCATION_ID=your-square-location-id
SQUARE_WEBHOOK_SECRET=your-square-webhook-secret
SQUARE_ENVIRONMENT=sandbox  # or 'production'

# Checkr Background Check Configuration (Optional)
CHECKR_API_KEY=your-checkr-api-key
CHECKR_ENVIRONMENT=sandbox  # or 'production'

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-random-secret-here
```

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### 2. Run Database Migration

Copy the SQL from `Schema_RLS_Policies.txt` and run it in Supabase SQL Editor:

```sql
-- This will create:
-- - 15+ tables (profiles, families, students, classes, payments, etc.)
-- - 50+ RLS policies
-- - Indexes for performance
-- - Triggers for auto-updates and audit logging
-- - Functions for game enrollment automation
```

### 3. Create Storage Buckets

Run these commands in Supabase SQL Editor:

```sql
-- Instructor uploads bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-uploads', 'instructor-uploads', true);

-- District reports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('district-reports', 'district-reports', true);
```

Then apply storage RLS policies (SQL provided in component files).

### 4. Seed Initial Data (Optional)

```sql
-- Insert NYS Standards (example)
INSERT INTO nys_standards (code, subject, grade_level, description, category)
VALUES
  ('CCSS.Math.K.CC.A.1', 'Math', 'K', 'Count to 100 by ones and tens', 'Counting & Cardinality'),
  ('NYS.Science.MS.PS1', 'Science', '6-8', 'Structure and Properties of Matter', 'Physical Science');

-- Insert public games
INSERT INTO games (title, slug, description, subject_area, grade_levels, file_path, is_public, requires_enrollment, created_by)
VALUES
  ('Solfege Staircase', 'solfege-staircase', 'Musical ear training game', 'Music', 'K-8', '/homeschool-hub/solfege-staircase/index.html', true, false, NULL),
  ('Color Mixing Canvas', 'color-mixing-canvas', 'Interactive color theory game', 'Arts', 'K-5', '/homeschool-hub/color-mixing-canvas/index.html', true, false, NULL);
```

## External Services

### Square Payment Setup

1. **Create Square Account**
   - Go to [developer.squareup.com](https://developer.squareup.com)
   - Create an application

2. **Get Credentials**
   - Go to your application dashboard
   - Copy Access Token (sandbox or production)
   - Copy Application ID
   - Get Location ID from Locations page

3. **Setup Webhook**
   - Go to Webhooks in Square Dashboard
   - Create webhook with URL: `https://your-domain.com/api/webhooks/square`
   - Subscribe to events: `payment.created`, `payment.updated`, `order.updated`, `refund.created`
   - Copy Webhook Signature Key

### Checkr Background Check Setup (Optional)

1. **Create Checkr Account**
   - Go to [checkr.com](https://checkr.com)
   - Sign up for API access

2. **Get API Key**
   - Go to API settings
   - Copy your API key
   - Use sandbox environment for testing

3. **Configure Webhook (Optional)**
   - Setup webhook URL: `https://your-domain.com/api/background-checks`
   - Subscribe to `report.completed` and `report.updated` events

## Deployment

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   npm install -g vercel
   vercel login
   vercel link
   ```

2. **Add Environment Variables**
   - Go to Vercel dashboard → Settings → Environment Variables
   - Add all variables from `.env.local`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t rk-homeschool-platform .
docker run -p 3000:3000 --env-file .env.local rk-homeschool-platform
```

## Testing

### Manual Testing Checklist

1. **Authentication**
   - [ ] User can sign up
   - [ ] User can log in
   - [ ] User can log out
   - [ ] Roles are assigned correctly

2. **Payment Flow**
   - [ ] Checkout creates Square payment link
   - [ ] Payment webhook activates enrollment
   - [ ] Failed payment cancels enrollment
   - [ ] Refund webhook updates status

3. **Game Access**
   - [ ] Public games accessible without login
   - [ ] Enrolled games require active enrollment
   - [ ] Game progress is tracked
   - [ ] RLS policies prevent unauthorized access

4. **Instructor Features**
   - [ ] Upload games and materials
   - [ ] View class enrollments
   - [ ] Background check can be initiated
   - [ ] Only see own uploads

5. **Student Dashboard**
   - [ ] View active enrollments
   - [ ] Access enrolled games
   - [ ] See progress statistics
   - [ ] Portfolio items displayed

6. **District Reporting**
   - [ ] Generate quarterly report PDF
   - [ ] Report includes all required data
   - [ ] District viewers can access reports
   - [ ] Families can access own reports

### API Endpoint Testing

```bash
# Test checkout
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "uuid",
    "studentId": "uuid",
    "payerId": "uuid",
    "amount": 100.00,
    "redirectUrl": "http://localhost:3000/success"
  }'

# Test quarterly report generation
curl -X POST http://localhost:3000/api/reports/quarterly \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "uuid",
    "quarter": "Q1",
    "year": 2026
  }'
```

## Monitoring & Maintenance

### Database Backup
```sql
-- Run weekly backups via Supabase dashboard
-- Enable Point-in-Time Recovery (PITR)
```

### Performance Monitoring
- Monitor Supabase dashboard for slow queries
- Check API response times in Vercel analytics
- Review audit logs for security events

### Background Check Renewals
```sql
-- Check for expiring background checks
SELECT p.full_name, p.email, bc.expires_at
FROM profiles p
JOIN background_checks bc ON bc.profile_id = p.id
WHERE bc.expires_at < CURRENT_DATE + INTERVAL '30 days'
AND p.role = 'instructor';
```

## Troubleshooting

### Common Issues

**Issue:** RLS policies blocking queries
**Solution:** Check user authentication and role assignment

**Issue:** Square webhook not firing
**Solution:** Verify webhook URL is publicly accessible and SSL enabled

**Issue:** PDF generation timeout
**Solution:** Increase serverless function timeout in `vercel.json`

**Issue:** Storage upload fails
**Solution:** Check storage bucket policies and file size limits

## Security Checklist

- [ ] All API endpoints validate authentication
- [ ] RLS policies enabled on all tables
- [ ] Webhook signatures verified
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced in production
- [ ] Environment variables secured
- [ ] Rate limiting enabled on API routes
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized inputs)
- [ ] CSRF tokens on forms

## Support

For issues or questions:
- GitHub Issues: https://github.com/juliampadron/RK-HOMESCHOOL-HUB-1.1/issues
- Email: support@renkids.org
- Phone: (845) 452-4225

## License

© 2026 Renaissance Kids. All rights reserved.
