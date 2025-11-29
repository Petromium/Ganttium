# Google Integration & Deployment Guide

This guide provides step-by-step instructions for integrating Google Cloud services (Vertex AI, Authentication) and preparing for future deployment.

## 1. Development Strategy: Local First

**Recommendation:** Continue development on your local machine. You do **not** need to deploy to the cloud immediately.
- **Why:** Faster iteration cycles, zero cloud hosting costs during development, and easier debugging.
- **Google Services:** You can still use Google APIs (AI, Maps, Auth) locally by configuring your Google Cloud Project properly.

## 2. Google Cloud Project Setup

To use Gemini (Vertex AI) and Google Sign-In, you need a Google Cloud Project.

### Step 1: Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `projectflow-dev`).
3. Note your **Project ID** (e.g., `projectflow-dev-12345`).

### Step 2: Enable APIs
Enable the following APIs in "APIs & Services > Library":
- **Vertex AI API** (for Gemini)
- **Google Identity / OAuth 2.0** (for Sign-In, later)

### Step 3: Local Authentication (For Gemini)
To allow your local code to access Vertex AI without hardcoding keys:

1. **Install Google Cloud SDK:** [Download & Install](https://cloud.google.com/sdk/docs/install)
2. **Initialize:** Run `gcloud init` in your terminal and login.
3. **Set Default Credentials:** Run the following command:
   ```powershell
   gcloud auth application-default login
   ```
   This creates a local credential file that the Node.js SDK automatically detects.

### Step 4: Environment Variables
Update your `.env` file (or create it) with:
```
GOOGLE_PROJECT_ID=your-project-id-here
GOOGLE_LOCATION=us-central1
```
*(Note: Remove `OPENAI_API_KEY` if you want to force using Gemini)*

## 3. Google Sign-In Integration (Future)

You can implement Google Sign-In locally before deploying.

1. **Configure OAuth Consent Screen:**
   - Go to APIs & Services > OAuth consent screen.
   - User Type: External (or Internal if you have Google Workspace).
   - Add test users (your email).

2. **Create Credentials:**
   - Go to APIs & Services > Credentials > Create Credentials > OAuth client ID.
   - Type: Web application.
   - **Authorized JavaScript origins:** `http://localhost:5000`
   - **Authorized redirect URIs:** `http://localhost:5000/api/auth/google/callback`

3. **Implementation:**
   - We will use `passport-google-oauth20` strategy in `server/auth.ts`.
   - This requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 4. Deployment Strategy (When Ready)

When you are ready to go live (MVP Launch), we recommend **Google Cloud Run**.

### Why Cloud Run?
- **Serverless:** Pay only when code runs (scale to zero).
- **Containers:** Uses Docker, so it works exactly like your local dev environment.
- **Integration:** Built-in support for Google Secrets and Networking.

### Prerequisites for Deployment
1. **Dockerize:** We will create a `Dockerfile` for the app.
2. **Database:** Use **Google Cloud SQL** (PostgreSQL) or a managed service like **Neon** (current).
3. **CI/CD:** Use **Cloud Build** to automatically deploy when you push to GitHub.

## 5. Troubleshooting AI (Gemini)

If the AI Assistant fails:
1. Check if `gcloud auth application-default login` was run.
2. Verify `GOOGLE_PROJECT_ID` matches your console project.
3. Ensure **Vertex AI API** is enabled in the console.
4. Check logs for "PermissionDenied" errors.

