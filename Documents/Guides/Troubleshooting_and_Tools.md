# Troubleshooting and Developer Tools Guide

This guide details the security, error handling, and debugging tools installed in the ProjectFlow application. Use this reference to diagnose issues, understand security mechanisms, and utilize development utilities efficiently.

## 1. Security Infrastructure

The application implements a multi-layered security approach. Understanding these layers is crucial when debugging "Access Denied," "CORS," or connection issues.

### Helmet.js (Security Headers)
*   **Location:** `server/middleware/security.ts` -> `configureHelmet()`
*   **What it does:** Sets secure HTTP headers to protect against XSS, clickjacking, etc.
*   **Troubleshooting:**
    *   **Issue:** External images, fonts, or scripts not loading.
    *   **Check:** Look for "Content Security Policy" (CSP) errors in the browser console.
    *   **Fix:** Update the `directives` in `server/middleware/security.ts` to allow the specific domain (e.g., add `https://new-font-source.com` to `fontSrc`).

### Rate Limiting
*   **Location:** `server/middleware/security.ts`
*   **What it does:** Limits the number of requests from a single IP to prevent abuse.
    *   `apiLimiter`: 100 requests / 15 mins (General API)
    *   `authLimiter`: 5 attempts / 15 mins (Login)
    *   `uploadLimiter`: 20 uploads / 1 hour
*   **Troubleshooting:**
    *   **Issue:** API returns `429 Too Many Requests`.
    *   **Fix:** Wait for the cooldown period. For testing load-heavy features, you can temporarily increase the limits in the middleware file or set `windowMs` to a smaller value during development.

### CORS (Cross-Origin Resource Sharing)
*   **Location:** `server/middleware/security.ts` -> `configureCORS()`
*   **What it does:** Controls which domains can access the API.
*   **Troubleshooting:**
    *   **Issue:** Browser console shows "CORS header 'Access-Control-Allow-Origin' missing".
    *   **Fix:** Ensure your frontend domain is in the `ALLOWED_ORIGINS` environment variable (production) or that you are running in `development` mode (which allows localhost).

### Input Sanitization
*   **Location:** `server/middleware/security.ts` -> `sanitizeInput()`
*   **What it does:** Automatically removes dangerous characters (null bytes, control characters) from `req.body`, `req.query`, and `req.params`.
*   **Troubleshooting:**
    *   **Issue:** Special characters in your data are disappearing or being modified.
    *   **Check:** Review the sanitization logic if your application requires specific control characters.

---

## 2. Error Handling Mechanisms

### React Global Error Boundary
*   **Location:** `client/src/components/ErrorBoundary.tsx` (Wrapped in `client/src/App.tsx`)
*   **What it does:** Catches JavaScript errors in the component tree (rendering errors) that would otherwise crash the entire React app (White Screen of Death).
*   **Utility:** Displays a friendly "Something went wrong" UI with a "Reload Page" button.
*   **Debugging:**
    *   The error boundary UI displays the error message and component stack trace in development/debug modes. Use this stack trace to pinpoint exactly which component failed.

### Server-Side Global Error Handler
*   **Location:** `server/app.ts` (End of middleware chain)
*   **What it does:** Catches unhandled exceptions from any route.
*   **Utility:** Prevents the server from hanging and returns a standard JSON response: `{ message: "Internal Server Error" }`.
*   **Debugging:**
    *   Check the server terminal logs. The handler often logs the full error stack trace before sending the generic response to the client.

### Zod Validation
*   **Location:** `server/routes.ts` and `shared/schema.ts`
*   **What it does:** Validates incoming API data against strict types.
*   **Utility:** Automatically returns `400 Bad Request` with detailed field-level error messages if the data doesn't match the schema (e.g., "Invalid email", "Missing required field").
*   **Troubleshooting:**
    *   If an API call fails with 400, check the network response body in browser DevTools. It will list exactly which fields are invalid.

---

## 3. Debugging & Development Tools

### Request Logging
*   **Location:** `server/app.ts` (Custom middleware)
*   **What it does:** Logs every incoming HTTP request to the server terminal.
*   **Format:** `[METHOD] [URL] [STATUS] in [DURATION]ms :: [RESPONSE_BODY_PREVIEW]`
*   **Usage:**
    *   **Trace Data Flow:** Watch the terminal to see if your frontend is actually hitting the backend.
    *   **Performance:** Identify slow requests (high duration).
    *   **Debug Logic:** See the JSON response body sent back to the client without needing `console.log` in every route.

### Vite Runtime Error Overlay
*   **What it does:** Automatically displays a modal in the browser when a compilation or runtime error occurs during development.
*   **Usage:** Click on the file links in the stack trace to open the specific line of code in your editor (requires editor configuration).

### Environment Validation
*   **Location:** `server/middleware/security.ts` -> `validateEnvironmentVariables()`
*   **What it does:** Checks for missing `.env` keys on server startup.
*   **Troubleshooting:**
    *   If the server crashes immediately upon start, check the logs. It will explicitly say "Missing required environment variables: ..."

---

## 4. Common Troubleshooting Scenarios

### Scenario: "I see a white blank page"
1.  **Check Console:** Open Browser DevTools (F12) -> Console.
2.  **React Error:** If you see a React error stack, the Error Boundary should have caught it. If not, it might be an error outside the React tree (e.g., in a context provider initialization).
3.  **Network Error:** Check the Network tab. If `main.tsx` or `index.js` failed to load, it might be a CSP issue (check Security Infrastructure above).

### Scenario: "Import fails with 'Internal Server Error'"
1.  **Check Server Logs:** Look at the terminal running `npm run dev`.
2.  **Request Log:** Find the `POST /api/projects/:id/import` log line.
3.  **Stack Trace:** The global error handler should have printed the actual JS error (e.g., "duplicate key value", "cannot read property of undefined").

### Scenario: "My form validation isn't working"
1.  **Check Network Response:** Open Network tab -> Select the failed request -> Preview.
2.  **Zod Errors:** You will likely see a JSON array of issues. Matches these against your `insertSchema` in `shared/schema.ts`.

### Scenario: "WebSockets aren't connecting"
1.  **Check CSP:** Ensure `connect-src` in `server/middleware/security.ts` includes `ws:` and `wss:`.
2.  **Check Port:** WebSockets typically run on the same HTTP server instance. Ensure no proxy is stripping the `Upgrade` headers.

