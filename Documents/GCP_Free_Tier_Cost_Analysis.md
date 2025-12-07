# GCP Free Tier & Cost Analysis (Per 1000 Users)

## Executive Summary
For a user base of ~1000 active users, Google Cloud Platform (GCP) provides a robust "Always Free" tier that covers most compute and networking needs. However, the **Relational Database (PostgreSQL)** is the primary cost driver, as Google Cloud SQL does *not* have a perpetual free tier.

**Estimated Monthly Cost:**
*   **Best Case (Self-Managed DB on VM):** $0.00 / month
*   **Recommended (Managed Cloud SQL):** ~$10 - $15 / month

---

## Service Breakdown

### 1. Compute: Cloud Run (Backend API)
*   **Role:** Hosts the Node.js/Express application.
*   **Free Tier Limit:**
    *   2 Million requests / month
    *   360,000 GB-seconds memory
    *   180,000 vCPU-seconds
*   **Estimated Usage (1000 Users):**
    *   Assuming 1000 users x 50 requests/day x 30 days = 1.5 Million requests.
    *   **Status:** ✅ **Likely Free** (or very low cost, <$1).

### 2. Database: PostgreSQL options
*   **Option A: Cloud SQL (Managed Service) - RECOMMENDED**
    *   **Free Tier:** ❌ None.
    *   **Cost:** `db-f1-micro` instance (Shared Core) ~ $0.015/hour.
    *   **Monthly Cost:** **~$10.95 USD**.
    *   *Pros:* Automated backups, high availability, security.
    *   *Cons:* Costs money.
*   **Option B: Compute Engine (Self-Hosted on VM)**
    *   **Free Tier:** ✅ `e2-micro` instance (2 vCPU, 1 GB Memory) is free in `us-central1`, `us-west1`, `us-east1`.
    *   **Storage:** 30 GB Standard Persistent Disk is free.
    *   **Monthly Cost:** **$0.00 USD**.
    *   *Pros:* Free.
    *   *Cons:* You must manage updates, security patches, backups, and uptime yourself. **High operational overhead.**

### 3. CI/CD: Cloud Build
*   **Role:** Builds Docker containers and deploys to Cloud Run.
*   **Free Tier Limit:** 120 build-minutes / day.
*   **Estimated Usage:**
    *   Average build time: 3-5 mins.
    *   Daily builds: 10-20.
    *   Total: ~60-100 mins/day.
*   **Status:** ✅ **Likely Free**.

### 4. Container Storage: Artifact Registry
*   **Role:** Stores Docker images.
*   **Free Tier Limit:** 0.5 GB / month storage.
*   **Estimated Cost:**
    *   Docker images can be large. You might exceed 0.5 GB quickly if old images aren't cleaned up.
    *   Overage: $0.10 / GB / month.
    *   **Estimated:** ~$0.20 - $0.50 / month.

### 5. Secrets Management: Secret Manager
*   **Role:** Stores API Keys, Database Credentials (ENV vars).
*   **Free Tier Limit:** 6 active secret versions / month.
*   **Estimated Usage:** Database URL, Session Secret, API Keys (3-4 secrets).
*   **Status:** ✅ **Likely Free**.

### 6. Monitoring & Logging: Cloud Operations
*   **Role:** Application logs and error tracking.
*   **Free Tier Limit:**
    *   Logging: 50 GB / month.
    *   Monitoring: 150 MB data.
*   **Status:** ✅ **Likely Free** (unless you log excessively).

---

## Recommendation for 1000 Users
For a professional, production-grade application handling 1000 users:

1.  **Accept the ~$10/month cost for Cloud SQL.** The time saved on database maintenance is worth far more than $10.
2.  **Stick to Cloud Run** for the application logic (Free).
3.  **Use Cloud Build** for deployment (Free).

**Total Estimated Budget:** **$12.00 / month** (Buffer for storage/bandwidth).

