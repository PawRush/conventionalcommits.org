# Conventional Commits Test Suite

Comprehensive Playwright test suite for the Conventional Commits Hugo documentation website.

## Overview

This test suite validates the functionality, accessibility, and performance of the conventionalcommits.org website across multiple browsers, devices, and screen sizes.

## Test Coverage

### 1. Homepage Tests (`homepage.spec.js`)
- Verifies homepage loads correctly with all essential elements
- Tests for proper meta tags and SEO compliance
- Checks for JavaScript errors
- Validates accessible navigation
- Ensures all main content sections are visible

### 2. Language Switching Tests (`language-switching.spec.js`)
- Tests language selector presence and functionality
- Validates switching between 24+ supported languages including:
  - English, Italian, Chinese (Simplified/Traditional)
  - Spanish, French, Russian, Japanese, Korean
  - Portuguese, German, Polish, Indonesian
  - Armenian, Thai, Dutch, Arabic, Persian, and more
- Verifies language persistence during navigation
- Tests HTML `lang` attribute correctness
- Validates RTL (Right-to-Left) support for Arabic and Persian

### 3. Version Navigation Tests (`version-navigation.spec.js`)
- Tests version selector/dropdown functionality
- Validates navigation between different specification versions:
  - v1.0.0 (current)
  - v1.0.0-beta.4
  - v1.0.0-beta.3
  - v1.0.0-beta.2
  - v1.0.0-beta.1
- Ensures language is maintained when switching versions
- Checks version indicators in UI
- Verifies all versions load without errors

### 4. Responsive Design Tests (`responsive-design.spec.js`)
- Tests across 6 different viewport sizes:
  - Mobile Portrait (375x667)
  - Mobile Landscape (667x375)
  - Tablet Portrait (768x1024)
  - Tablet Landscape (1024x768)
  - Desktop (1920x1080)
  - Large Desktop (2560x1440)
- Validates mobile-friendly navigation
- Checks text readability on mobile devices
- Verifies proper touch target sizes
- Tests for horizontal overflow issues
- Validates layout adaptation across screen sizes
- Tests orientation changes

### 5. External Links Tests (`external-links.spec.js`)
- Validates GitHub repository links
- Checks Creative Commons license links
- Verifies external links have proper security attributes (`rel="noopener noreferrer"`)
- Tests internal anchor links
- Checks footer links accessibility
- Security validation (no `javascript:` protocol links)
- Verifies navigation between specification sections
- Tests link reachability for key external domains

## Prerequisites

- Node.js 19+ (as specified in `.node-version`)
- Hugo (v0.152.2 or later)
- npm or yarn package manager

## Installation

1. Install Hugo (if not already installed):
```bash
brew install hugo
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests (headless mode)
```bash
npm test
```

### Run tests with browser UI visible
```bash
npm run test:headed
```

### Run tests in interactive UI mode
```bash
npm run test:ui
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run tests on specific browsers
```bash
# Chromium only
npm run test:chromium

# Firefox only
npm run test:firefox

# WebKit/Safari only
npm run test:webkit
```

### Run mobile tests only
```bash
npm run test:mobile
```

### View test report
```bash
npm run test:report
```

## Test Configuration

The test suite is configured via `playwright.config.js` with the following settings:

- **Base URL**: `http://localhost:1313`
- **Test Directory**: `./tests`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Devices**: Pixel 5, iPhone 12
- **Retries**: 2 retries in CI, 0 in local development
- **Reporter**: HTML report
- **Screenshots**: Captured on failure
- **Traces**: Recorded on first retry

The test suite automatically starts the Hugo development server before running tests and reuses existing servers to speed up test execution.

## Project Structure

```
conventionalcommits.org/
├── tests/
│   ├── homepage.spec.js              # Homepage functionality tests
│   ├── language-switching.spec.js    # Multilingual support tests
│   ├── version-navigation.spec.js    # Version switching tests
│   ├── responsive-design.spec.js     # Responsive layout tests
│   ├── external-links.spec.js        # Link validation tests
│   └── README.md                     # This file
├── playwright.config.js              # Playwright configuration
└── package.json                      # Node.js dependencies
```

## Development Server

The Hugo site runs on `http://localhost:1313` by default. The test suite will automatically start the server if it's not running.

To manually start the development server:
```bash
make all-dev
# or
hugo serve --bind=0.0.0.0
```

## CI/CD Integration

The test suite is designed to work in CI/CD environments:

- Automatic retries on failure
- Headless execution by default
- HTML reports for debugging
- Screenshot and trace capture on failures

To run in CI mode:
```bash
CI=true npm test
```

## Browser Support

Tests are executed across:
- **Chromium** (Chrome, Edge, Opera)
- **Firefox**
- **WebKit** (Safari)
- **Mobile Chrome** (Android)
- **Mobile Safari** (iOS)

## Key Features Tested

### Multilingual Support
- 24+ languages supported
- Language switching functionality
- RTL language support (Arabic, Persian)
- Language persistence across navigation

### Accessibility
- Proper semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Screen reader compatibility
- Touch target sizes for mobile

### Performance
- Page load times
- No JavaScript errors
- No console warnings
- Proper resource loading

### Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop layouts
- No horizontal scrolling
- Readable text sizes
- Proper spacing and margins

## Troubleshooting

### Tests failing due to server not starting
Ensure Hugo is installed and accessible:
```bash
hugo version
```

### Port 1313 already in use
Kill any existing Hugo processes:
```bash
lsof -ti:1313 | xargs kill -9
```

### Playwright browsers not installed
Install browsers:
```bash
npx playwright install
```

### Tests timing out
Increase timeout in `playwright.config.js`:
```javascript
use: {
  timeout: 60000, // 60 seconds
}
```

## Contributing

When adding new tests:

1. Place test files in the `tests/` directory
2. Follow the naming convention: `feature-name.spec.js`
3. Use descriptive test names with `test.describe()` and `test()`
4. Add comments for complex test logic
5. Ensure tests are idempotent and can run in any order
6. Update this README with new test coverage

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Hugo Documentation](https://gohugo.io/documentation/)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)

## License

This test suite is part of the Conventional Commits project and follows the same license (Creative Commons - CC BY 3.0).
