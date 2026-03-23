---
name: WebApp Testing
description: Automated UI testing for web application using Playwright with comprehensive test coverage and reporting.
---

# WebApp Testing Skill
This skill enables UI testing for web application using Playwright. It helps ensure that critical user flows work correctly through screenshots and details test reports.

## When to use This Skill
Use this skill when you need to:
* Test complete user flows and interactions in web application
* Verify that UI components render correctly
* Ensure navigation between pages works as expected
* Capture screenshots for visual verification
* Generate comprehensive test reports with pas/fail result
* Preform regression testing after code changes
* Validate new words submission and workflows

## Prerequisites
* Web application must be running and accessible (e.g on localhost or a test environment)
* Playwright MCP server should be enable in Agent mode
* Basic understanding of the application's user flows

## How to use
When testing a wen application, provide clear instructions about:
1. **The screen to test**: Specify the exact screen of your running application.
2. **User flow steps**: List the sequence of actions to preform (e.g, "Click on "Add word", "Verify list of games are displayed")
3. **Expected outcome**: What should be visible or happen at each step
4. **Screenshot requirements**: Which pages r states to capture visually.

## Best Practices
* **Start with the application running**: Ensure everything is active before testing
* **Test critical paths first**: Focus on the most important user journeys
* **Use descriptive names**: Name your test steps clearly for better reporting
* **Capture visual proof**: Take screenshot of important steps
* **Habdle timing**: Allow tome for dynamic contest to load
* **Test edge cases**: Include error states and boundary conditions

## Benefits
* **No manual testing needed**: Automate repetitive testing task
* **Instant regression detection**: Quickly identify broken functionality
* **Visual documentation**: Screenshot provide proof of working features
* **AI-powered reliability**: ClaudeCode handles complex selectors and timing automatically
* **Comprehensive reports**: Get detailed pass/fail results for all test steps

## Common Test Scenarios

### Navigation Testing
```
Test that all navigation links work:
1. Visit homapage
2. Click each navigation item
3. Verify correct page loads
4. Take screenshots
```

### Form Testing
```
Test form submission:
1. Navigate to a page with a form in it
2. Fill the required fields
3. Click submit button
4. Verify success massage of redirect
5. Check that data appears correctly
```

## Troubleshooting
If tests failes:
* Verify the application is running and accessible
* Check that element selector are correct
* Ensure sufficient wait times for dynamic content
* Review browser console for JavaScript errors
* Ask ClaudeCode to fix failing tests with specific error massages
