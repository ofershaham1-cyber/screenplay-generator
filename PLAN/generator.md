# /generator Endpoint - Testing Plan

## Overview
The `/api/screenplay/generate` endpoint generates a new screenplay based on user inputs using OpenRouter API with various models.

## Current Implementation
- **Route**: `POST /api/screenplay/generate`
- **Input Parameters**:
  - `story_pitch` (string): Optional pitch for the screenplay
  - `dialog_languages` (array): Languages for character dialogs (default: ['English', 'Spanish'])
  - `default_screenplay_language` (string): Language for screenplay text (default: 'Hebrew')
  - `model` (string): AI model to use (default: 'allenai/olmo-3.1-32b-think:free')
  - `customApiKey` (string): Optional custom OpenRouter API key
- **Output**: JSON screenplay object with `generatedAt` timestamp and model used
- **Error Handling**: Comprehensive logging and error responses

## Testing Strategy

### 1. Unit Tests
**File**: `test/unit/screenplay.test.js`

#### 1.1 Input Validation
- [ ] Valid request with all parameters
- [ ] Valid request with minimal parameters (only required fields)
- [ ] Valid request with empty story_pitch
- [ ] Request with missing required fields
- [ ] Request with invalid data types (non-array languages, non-string pitch)
- [ ] Request with null/undefined values

#### 1.2 Response Format Validation
- [ ] Response contains `generatedAt` timestamp
- [ ] Response contains `model` field
- [ ] Response contains screenplay schema properties (title, scenes, characters, etc.)
- [ ] Response schema matches `responseFormat.json`
- [ ] Timestamp is valid ISO format
- [ ] Model name matches requested model

#### 1.3 Language Configuration
- [ ] Default languages applied correctly when not provided
- [ ] Custom languages override defaults
- [ ] Multiple languages handled correctly
- [ ] Screenplay language (default_screenplay_language) applied to description/action text

### 2. Integration Tests
**File**: `test/integration/screenplay-api.test.js`

#### 2.1 API Endpoint Tests
- [ ] POST to `/api/screenplay/generate` returns 200 status
- [ ] Invalid POST returns 400/422 status
- [ ] Error handling returns 500 status with error message
- [ ] CORS headers present in response
- [ ] Content-Type is application/json

#### 2.2 Multiple Model Support
- [ ] Generate with default model (allenai/olmo-3.1-32b-think:free)
- [ ] Generate with different free models
- [ ] Generate with paid model tier (with custom API key)
- [ ] Model switching doesn't break response format

#### 2.3 API Key Handling
- [ ] Works with default API key from config
- [ ] Works with environment variable API key
- [ ] Works with custom API key in request
- [ ] Custom API key takes priority over defaults
- [ ] Handles invalid API key gracefully

### 3. End-to-End Tests
**File**: `test/e2e/screenplay-generation.test.js` (Playwright/Puppeteer)

#### 3.1 Frontend to Backend Flow
- [ ] User navigates to `/generator` route
- [ ] Form accepts all input fields (story pitch, languages, model selection)
- [ ] Clicking generate calls `/api/screenplay/generate`
- [ ] Loading state displays during generation
- [ ] Generated screenplay displays in UI
- [ ] Screenplay saves to history correctly

#### 3.2 User Scenarios
- [ ] Generate screenplay with story pitch
- [ ] Generate screenplay without story pitch
- [ ] Generate with multiple language selections
- [ ] Change model and regenerate
- [ ] Use custom API key
- [ ] Handle API timeout/error gracefully

#### 3.3 Performance
- [ ] Generation completes within timeout (30-60 seconds)
- [ ] Large inputs don't crash API
- [ ] Multiple concurrent requests handled

### 4. Error Scenario Testing
**File**: `test/error-scenarios/screenplay-errors.test.js`

#### 4.1 OpenRouter API Errors
- [ ] Handle API rate limiting (429)
- [ ] Handle API authentication failure (401/403)
- [ ] Handle malformed response from API
- [ ] Handle network timeout
- [ ] Handle invalid model name
- [ ] Handle response healing plugin failures

#### 4.2 Config File Errors
- [ ] Handle missing `responseFormat.json`
- [ ] Handle missing `config.json`
- [ ] Handle corrupted JSON in config files
- [ ] Handle missing API key in all sources

#### 4.3 Request Malformation
- [ ] Handle non-JSON request body
- [ ] Handle empty request body
- [ ] Handle excessively large payload

### 5. Test Data

#### 5.1 Valid Inputs
```json
{
  "story_pitch": "A detective solves a mystery in a small town",
  "dialog_languages": ["English", "French"],
  "default_screenplay_language": "English",
  "model": "allenai/olmo-3.1-32b-think:free"
}
```

#### 5.2 Edge Cases
```json
{
  "story_pitch": "",
  "dialog_languages": [],
  "default_screenplay_language": "Hebrew"
}
```

```json
{
  "dialog_languages": ["English"],
  "default_screenplay_language": "Spanish"
}
```

### 6. Acceptance Criteria
- [ ] All valid requests return screenplay in correct format
- [ ] Response time < 120 seconds
- [ ] All errors logged with full context
- [ ] Error responses include helpful messages
- [ ] API doesn't leak sensitive information in errors
- [ ] Supports at least 5 concurrent requests
- [ ] Frontend seamlessly handles generation state transitions

## Testing Tools & Setup

### Tools
- **Unit/Integration**: Jest with `@testing-library/react`
- **E2E**: Playwright or Puppeteer
- **API Testing**: Supertest or axios
- **Mocking**: jest.mock() for OpenRouter API, fs, config loading

### Test Configuration Files
- `jest.config.js` - Jest configuration
- `.env.test` - Test environment variables
- `test/fixtures/mockScreenplay.json` - Sample generated screenplay
- `test/fixtures/mockApiResponses.js` - Mock OpenRouter responses

### Mock OpenRouter Responses
Create mocks that:
- Return valid screenplay JSON
- Simulate network delays
- Simulate various error conditions
- Validate request format before responding

## Implementation Checklist
- [ ] Create test directory structure
- [ ] Setup Jest configuration
- [ ] Create OpenRouter API mocks
- [ ] Write unit tests for screenplay generation
- [ ] Write integration tests for API endpoints
- [ ] Write E2E tests for user flows
- [ ] Setup GitHub Actions workflow
- [ ] Add test coverage reporting
- [ ] Document test running instructions in README

## Notes
- Tests should be isolated and not depend on real OpenRouter API for most cases
- Use fixtures for sample screenplay data
- Mock file system operations for config/format loading
- Consider using different models in tests to verify model-agnostic responses
- Track test execution time to identify performance regressions
