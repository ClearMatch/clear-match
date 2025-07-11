# Regression Testing Suite

## Overview

This project includes a comprehensive regression testing suite using Puppeteer to validate core functionality after major changes like the single-tenant consolidation.

## Purpose

The regression test suite was added as part of PR #153 (Phase 1: Single-Tenant Consolidation) to ensure that:

1. **Migration Validation**: Verify that all core functionality works after database migration
2. **End-to-End Testing**: Test complete user workflows in a real browser environment  
3. **Cross-Platform Validation**: Ensure responsive design works across different viewports
4. **Quality Assurance**: Catch regressions before they reach production

## Dependencies

### Puppeteer
- **Version**: `^24.12.1`
- **Purpose**: Browser automation for end-to-end testing
- **Why Added**: Provides reliable testing of JavaScript-heavy Single Page Application functionality that unit tests cannot cover

## Test Coverage

The regression suite tests the following areas:

### Authentication
- User sign-in process
- Dashboard redirect after authentication
- Session management

### Navigation
- All primary navigation links (Dashboard, Contacts, Tasks, Events)
- Page routing and URL changes
- Navigation consistency

### CRUD Operations
- **Contacts**: Create, read, update operations
- **Tasks**: List view and create page navigation
- **Events**: List view and create page navigation
- **Profile**: Edit profile and password change forms

### User Interface
- **Responsive Design**: Mobile (375px), tablet (768px), and desktop (1920px) viewports
- **Page Load Performance**: Ensures pages load within reasonable timeframes
- **Form Functionality**: Basic form submission and validation

## Usage

### Prerequisites
1. Ensure the development server is running on `http://localhost:3000`
2. Have valid test credentials (configured in `regression-test.js`)
3. Database should be in a testable state with sample data

### Running Tests
```bash
# Install dependencies (if not already installed)
pnpm install

# Run the regression test suite
node regression-test.js
```

### Test Configuration
Update the following variables in `regression-test.js`:
```javascript
const BASE_URL = 'http://localhost:3000';  // Your app URL
const TEST_USER = {
  email: 'your-test-email@example.com',     // Valid test user
  password: 'your-test-password'            // Valid test password
};
```

## Test Results

The suite provides detailed console output including:
- ✅ Passed tests with timestamps
- ❌ Failed tests with error details  
- 📊 Final summary with success rate
- 🚨 List of all failed tests for debugging

### Example Output
```
📊 REGRESSION TEST RESULTS
==========================================================
✅ Tests Passed: 15
❌ Tests Failed: 2
📈 Success Rate: 88%

🚨 Failed Tests:
1. Contacts - Create Form Submission: Form validation error
2. Tasks - List Display: No tasks found in database
```

## Integration with CI/CD

This regression suite can be integrated into continuous integration pipelines:

1. **Pre-deployment**: Run after staging deployment
2. **Post-migration**: Validate functionality after database changes
3. **Release validation**: Ensure core workflows before production deployment

## Browser Configuration

The tests run with the following Puppeteer configuration:
- **Headless**: `false` (visible browser for debugging)
- **Slow Motion**: `100ms` (easier to follow test execution)
- **Default Viewport**: `1920x1080` (desktop-first testing)
- **Network Idle**: Waits for network requests to complete

## Maintenance

### Adding New Tests
1. Create new test functions following the existing pattern
2. Add test calls to the main `runRegressionTests()` function
3. Use the `logTest()` helper for consistent result tracking

### Updating Selectors
When UI changes require test updates:
1. Update CSS selectors in the test functions
2. Ensure selectors are specific enough to avoid false positives
3. Test both positive and negative cases

### Troubleshooting
- **Sign-in failures**: Verify test credentials and auth flow
- **Timeout errors**: Increase timeout values for slower environments
- **Selector not found**: Check if UI elements have changed
- **Navigation issues**: Verify routing and page load completion

## Security Considerations

⚠️ **Important**: The test file contains hardcoded credentials that should:
1. Only be used in development/testing environments
2. Never be committed with real production credentials
3. Be stored securely or passed via environment variables in CI/CD

## Future Enhancements

Potential improvements for the testing suite:
1. **Environment Variables**: Use env vars for configuration
2. **Parallel Testing**: Run tests in parallel for faster execution
3. **Screenshot Capture**: Save screenshots on test failures
4. **Database Seeding**: Automated test data setup/teardown
5. **API Testing**: Include backend API validation
6. **Performance Metrics**: Track page load times and performance