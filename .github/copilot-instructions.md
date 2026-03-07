# GitHub Copilot Instructions for RK-HOMESCHOOL-HUB-1.1

## Project Overview
Renaissance Kids Homeschool Hub is a web application for educational content and interactive learning games for homeschool families. The project includes:
- Interactive educational games (e.g., Solfege Staircase)
- Science investigation templates
- Supabase backend with PostgreSQL database
- Row-level security (RLS) policies for multi-tenant access control
- Payment integration with Square
- User authentication and role-based access control (RBAC)

## Technology Stack
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Frontend**: HTML/CSS/JavaScript (static files), potentially Next.js
- **Payments**: Square API
- **Database**: PostgreSQL with RLS policies
- **Authentication**: Supabase Auth with custom roles (guest, registered, verified_family, admin)

## Coding Conventions

### General Guidelines
- **Code Style**: Use clear, readable code with meaningful variable names
- **Comments**: Add comments for complex logic or business rules, but prefer self-documenting code
- **Error Handling**: Always implement proper error handling for API calls and user interactions
- **Security**: Never commit secrets or API keys; use environment variables and GitHub Secrets

### Database & Supabase
- **Migrations**: Place all database migrations in `supabase/migrations/` with timestamp prefixes (format: `YYYYMMDD_description.sql`)
- **RLS Policies**: Always implement Row-Level Security policies for multi-tenant data isolation
- **Roles**: Use the established role hierarchy: guest → registered → verified_family → admin
- **Naming**: Use snake_case for database tables, columns, and functions
- **Foreign Keys**: Always define proper foreign key relationships with appropriate CASCADE rules

### Frontend
- **HTML Games**: Self-contained HTML files in `homeschool-hub/` directory
- **Styling**: Use CSS custom properties (CSS variables) for theming, following the existing color scheme:
  - Green: `#2F6B65`
  - Yellow: `#FBC440`
  - Orange: `#F05A22`
- **Accessibility**: Include proper ARIA labels, semantic HTML, and keyboard navigation support
- **LocalStorage**: Use prefixed keys (e.g., `rk_solfegeScore`) for persistent user data
- **Print Styles**: Include print-friendly styles for educational worksheets using `@media print`

### File Organization
- **Static HTML Games**: `homeschool-hub/[game-name]/index.html`
- **API Routes**: `app/api/` directory
- **Templates**: `supabase/templates/` for reusable database objects
- **Science Templates**: `science_investigation_templates/` for educational content
- **Documentation**: Keep README.md updated with deployment instructions

## Best Practices

### When Working on Tasks
1. **Understand Context**: Always read existing files before making changes
2. **Test Locally**: For HTML games, verify functionality in a browser before committing
3. **Database Changes**: Test migrations thoroughly; include rollback scripts when possible
4. **Dependencies**: Minimize external dependencies; prefer vanilla JavaScript for simple games
5. **Documentation**: Update README.md when adding new features or changing deployment steps

### Security Considerations
- **RLS Policies**: Always verify RLS policies are correctly implemented before deploying
- **Input Validation**: Validate all user inputs on both client and server side
- **SQL Injection**: Use parameterized queries; never concatenate user input into SQL
- **XSS Prevention**: Sanitize user-generated content before rendering
- **Authentication**: Verify user authentication and authorization for protected resources

### Accessibility & User Experience
- **Mobile-First**: Ensure responsive design works on mobile devices
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Readers**: Use semantic HTML and ARIA labels appropriately
- **Loading States**: Provide visual feedback during asynchronous operations
- **Error Messages**: Display clear, user-friendly error messages

### Testing
- **Manual Testing**: Test all user-facing features in multiple browsers
- **Edge Cases**: Consider and test edge cases (empty states, max values, etc.)
- **Accessibility Testing**: Use keyboard-only navigation to verify accessibility
- **Database Testing**: Verify RLS policies by testing with different user roles

## Specific to This Repository

### Educational Content
- **Age-Appropriate**: Design for K-12 homeschool students
- **Gamification**: Use points, stars, or progress tracking for engagement
- **Printable Worksheets**: Include print-friendly versions of interactive content
- **Parent/Teacher Notes**: Add instructional guidance where appropriate

### Branding
- **Renaissance Kids**: Use "Renaissance Kids" branding consistently
- **Tagline**: "Light up learning through the arts"
- **Contact**: Include contact info (renkids.org, (845) 452-4225) in footers

### Git Workflow
- **Branch Naming**: Use descriptive branch names (e.g., `feature/new-game`, `fix/rls-policy`)
- **Commit Messages**: Write clear, descriptive commit messages
- **Small Commits**: Make focused, incremental commits
- **No Build Artifacts**: Never commit generated files, dependencies, or build artifacts

## Common Tasks

### Adding a New Educational Game
1. Create directory: `homeschool-hub/[game-name]/`
2. Include self-contained `index.html` with inline CSS and JavaScript
3. Add Open Graph meta tags for social sharing
4. Implement localStorage for progress persistence
5. Include print stylesheet for worksheet version
6. Add accessibility features (ARIA labels, keyboard support)
7. Test on mobile and desktop browsers

### Adding a Database Migration
1. Create file: `supabase/migrations/YYYYMMDD_description.sql`
2. Include RLS policies for new tables
3. Define appropriate indexes for performance
4. Add comments explaining complex logic
5. Test migration on development environment
6. Consider adding a corresponding rollback migration

### Updating Secrets
- Document required secrets in `.github/GITHUB_SECRETS.md`
- Never hardcode secrets in code
- Use GitHub Secrets for CI/CD workflows
- Use Supabase environment variables for runtime configuration

## Resources
- Supabase Documentation: https://supabase.com/docs
- Square API Documentation: https://developer.squareup.com/docs
- Renaissance Kids Website: https://www.renkids.org
- GitHub Repository: https://github.com/juliampadron/RK-HOMESCHOOL-HUB-1.1
