# API Implementation Documentation

This document describes the implemented API routes for the RK Homeschool Hub application.

## Overview

All API routes have been implemented according to the specified contracts. The implementation includes:

- Payment processing via Stripe
- Webhook handling for Stripe and Checkr
- Class listings with filtering
- Student progress tracking
- Game uploads for instructors

## Implemented Routes

### 1. POST /api/checkout

Creates a Stripe checkout session for class enrollment.

**Request:**
```typescript
{
  classId: string; // UUID
  studentId: string; // UUID
}
```

**Response:**
```typescript
{
  url: string; // Stripe checkout URL
}
```

**Features:**
- Verifies user authentication
- Validates student ownership
- Checks class availability and capacity
- Creates payment intent record
- Generates Stripe checkout session
- Logs audit trail

---

### 2. POST /api/webhooks/stripe

Handles Stripe payment events.

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Handled Events:**
- `checkout.session.completed`: Creates enrollment after successful payment

**Features:**
- Verifies webhook signature
- Updates payment intent status
- Creates enrollment record
- Increments class enrollment count
- Logs audit trail

---

### 3. POST /api/webhooks/checkr

Handles Checkr background check updates.

**Headers:**
- `checkr-signature`: Webhook signature for verification

**Handled Events:**
- `report.completed`: Updates instructor background check status

**Features:**
- Verifies webhook signature
- Updates instructor profile with background check results
- Triggers admin notification for "consider" or "failed" statuses
- Logs audit trail

---

### 4. GET /api/classes

Lists available classes with optional filtering.

**Query Parameters:**
- `subject_area` (optional): Filter by subject
- `grade_band` (optional): Filter by grade band
- `status` (optional): Filter by status (default: "active")

**Response:**
```typescript
{
  classes: Array<{
    id: string;
    title: string;
    description: string;
    price_cents: number;
    instructor: {
      id: string;
      full_name: string;
    };
    schedule: object;
  }>
}
```

**Features:**
- Only returns classes from approved instructors
- Supports filtering by subject area and grade band
- RLS ensures data security

---

### 5. GET /api/student/:studentId/progress

Gets student progress report.

**Authorization:** Parent must own the student

**Response:**
```typescript
{
  student: {
    id: string;
    first_name: string;
  };
  enrollments: Array<{
    class_title: string;
    hours_completed: number;
    games_unlocked: number;
    portfolio_items: number;
  }>;
  nys_compliance: {
    total_hours: number;
    subjects_covered: string[];
    quarterly_ready: boolean;
  };
}
```

**Features:**
- Verifies parent ownership
- Aggregates progress across all enrollments
- Calculates NYS compliance metrics
- Counts unique games unlocked and portfolio items

---

### 6. POST /api/games

Instructor uploads a new game.

**Request:**
```typescript
{
  classId: string;
  title: string;
  description: string;
  html_content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_public: boolean;
}
```

**Response:**
```typescript
{
  id: string;
  created_at: string;
}
```

**Features:**
- Verifies instructor authentication
- Validates class ownership
- Supports public and class-specific games
- Logs audit trail

---

## Database Schema

The implementation includes comprehensive database migrations:

### Tables Created

1. **classes** - Class information and metadata
2. **instructor_profiles** - Instructor details and background check status
3. **students** - Student information linked to parents
4. **payment_intents** - Payment tracking with Stripe integration
5. **enrollments** - Student class enrollments
6. **games** - Educational games uploaded by instructors
7. **student_progress** - Progress tracking for students
8. **portfolio_items** - Student work samples
9. **audit_trail** - System-wide audit logging

### Security

- Row Level Security (RLS) enabled on all tables
- Comprehensive RLS policies for data access control
- Public can only view active classes from approved instructors
- Parents can only access their own students' data
- Instructors can only manage their own classes and games

---

## Environment Variables

Required environment variables (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
CHECKR_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

3. Run database migrations:
   ```bash
   # Using Supabase CLI
   supabase db push
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

---

## Testing Webhooks Locally

### Stripe Webhooks

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Test checkout flow:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Checkr Webhooks

Use tools like `ngrok` to expose your local server for webhook testing:

```bash
ngrok http 3000
# Use the ngrok URL in Checkr webhook settings
```

---

## Error Handling

All routes implement comprehensive error handling:

- 401: Unauthorized (missing/invalid authentication)
- 400: Bad request (missing/invalid parameters)
- 404: Resource not found
- 500: Internal server error

Errors are logged to console for debugging.

---

## Audit Trail

All significant operations are logged to the `audit_trail` table:

- Checkout session creation
- Payment completion
- Enrollment creation
- Background check updates
- Game uploads

This provides a complete audit history for compliance and debugging.
