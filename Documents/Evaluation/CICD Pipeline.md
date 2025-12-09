<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# How would I do below, are they doable via CLI:

What you're MISSING (not wrong toolkit, just incomplete):
❌ GitHub Actions pipeline (automate testing on push)
❌ Terraform for IaC (reproducible GCP deployment)
❌ Automated security scanning (SAST/DAST)

**YES—all three are 100% doable via CLI and are industry standard patterns.** Let me give you the exact CLI commands and explain each, scoped to your tech stack (Node.js, TypeScript, GCP Cloud Run, GitHub).

***

## **1. GitHub Actions Pipeline (Automate Testing on Push)**

### **What it does:**

Automatically runs linting, building, unit tests, E2E tests, and deploys to Cloud Run **every time you push to GitHub.**

### **Setup (CLI)**

#### **Step 1: Create the GitHub Actions directory**

```bash
mkdir -p .github/workflows
```


#### **Step 2: Create the CI/CD workflow file**

```bash
cat > .github/workflows/ci-cd-pipeline.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: gcr.io
  PROJECT_ID: ganttium-303401483984
  IMAGE_NAME: ganttium-app

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ganttium_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint code
        run: npm run lint

      - name: Build application
        run: npm run build

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ganttium_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ganttium_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
          BASE_URL: http://localhost:5173

      - name: Security audit
        run: npm audit --audit-level=moderate

  build-and-deploy:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Configure Docker for GCR
        run: |
          gcloud auth configure-docker $REGISTRY

      - name: Build Docker image
        run: |
          docker build -t $REGISTRY/$PROJECT_ID/$IMAGE_NAME:${{ github.sha }} \
                       -t $REGISTRY/$PROJECT_ID/$IMAGE_NAME:latest .

      - name: Push Docker image
        run: |
          docker push $REGISTRY/$PROJECT_ID/$IMAGE_NAME:${{ github.sha }}
          docker push $REGISTRY/$PROJECT_ID/$IMAGE_NAME:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ganttium \
            --image=$REGISTRY/$PROJECT_ID/$IMAGE_NAME:${{ github.sha }} \
            --region=us-central1 \
            --platform=managed \
            --allow-unauthenticated=false \
            --set-env-vars ENVIRONMENT=production \
            --service-account=${{ secrets.GCP_SERVICE_ACCOUNT }} \
            --no-gen2

      - name: Health check
        run: |
          sleep 10
          curl -H "Authorization: bearer $(gcloud auth print-identity-token)" \
            https://ganttium-303401483984.us-central1.run.app/api/health

EOF
```


#### **Step 3: Set GitHub Secrets (ONE TIME)**

```bash
# GitHub CLI (if installed)
gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER -b "projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID"
gh secret set GCP_SERVICE_ACCOUNT -b "your-sa@ganttium-303401483984.iam.gserviceaccount.com"

# OR manually via GitHub UI:
# Settings → Secrets and variables → Actions → New repository secret
```


#### **Step 4: Configure GCP Workload Identity (ONE TIME)**

```bash
# This allows GitHub Actions to authenticate without storing keys
gcloud iam workload-identity-pools create github-pool \
  --project=ganttium-303401483984 \
  --location=global

gcloud iam workload-identity-pools providers create-oidc github \
  --project=ganttium-303401483984 \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.aud=assertion.aud" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Create service account
gcloud iam service-accounts create github-actions-sa \
  --project=ganttium-303401483984 \
  --display-name="GitHub Actions"

# Grant permissions
gcloud projects add-iam-policy-binding ganttium-303401483984 \
  --member="serviceAccount:github-actions-sa@ganttium-303401483984.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ganttium-303401483984 \
  --member="serviceAccount:github-actions-sa@ganttium-303401483984.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```


#### **Step 5: Verify workflow**

```bash
# Push to GitHub
git add .github/workflows/ci-cd-pipeline.yml
git commit -m "feat: add CI/CD pipeline"
git push origin main

# Watch it run:
# GitHub UI → Actions tab → see the workflow execute
```


***

### **What happens on each push:**

1. ✅ Lints code (ESLint, TypeScript)
2. ✅ Builds React + Node
3. ✅ Runs unit tests against PostgreSQL + Redis
4. ✅ Runs E2E tests
5. ✅ Audits dependencies for vulnerabilities
6. ✅ Builds Docker image
7. ✅ Pushes to Google Container Registry
8. ✅ Deploys to Cloud Run
9. ✅ Health check

**If ANY step fails, deployment is blocked.**

***

## **2. Terraform for IaC (Reproducible GCP Deployment)**

### **What it does:**

Defines your entire GCP infrastructure (Cloud Run, Cloud SQL, Redis, IAM, secrets) as code. Change a `.tf` file, run `terraform apply`, and your infrastructure is updated consistently.

### **Setup (CLI)**

#### **Step 1: Install Terraform**

```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.4/terraform_1.6.4_linux_amd64.zip
unzip terraform_1.6.4_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify
terraform version
```


#### **Step 2: Create Terraform project structure**

```bash
mkdir -p terraform
cd terraform

cat > main.tf << 'EOF'
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "ganttium-terraform-state"
    prefix = "prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "sql.googleapis.com",
    "redis.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
    "containerregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com"
  ])

  service            = each.value
  disable_on_destroy = false
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "postgres" {
  name             = "ganttium-postgres"
  database_version = "POSTGRES_16"
  region           = var.region
  deletion_protection = true

  settings {
    tier                        = "db-f1-micro"
    availability_type           = "REGIONAL"
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      transaction_log_retention_days = 7
    }
    ip_configuration {
      require_ssl = true
    }
  }

  depends_on = [google_project_service.required_apis["sql.googleapis.com"]]
}

resource "google_sql_database" "ganttium" {
  name     = "ganttium"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app_user" {
  name     = "ganttium_user"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# Redis
resource "google_redis_instance" "cache" {
  name           = "ganttium-redis"
  tier           = "basic"
  memory_size_gb = 1
  region         = var.region
  redis_version  = "7.0"
  auth_enabled   = true

  depends_on = [google_project_service.required_apis["redis.googleapis.com"]]
}

# Cloud Run
resource "google_cloud_run_service" "app" {
  name     = "ganttium"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/ganttium-app:latest"

        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.app_user.name}:${random_password.db_password.result}@${google_sql_database_instance.postgres.private_ip_address}:5432/${google_sql_database.ganttium.name}?sslmode=require"
        }

        env {
          name  = "REDIS_URL"
          value = "redis://:${random_password.redis_password.result}@${google_redis_instance.cache.host}:6379"
        }

        env {
          name  = "ENVIRONMENT"
          value = "production"
        }

        env {
          name  = "PORT"
          value = "8080"
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }

      service_account_name = google_service_account.cloud_run.email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.required_apis["run.googleapis.com"]]
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "ganttium-cloud-run"
  display_name = "Cloud Run Service Account"
}

# IAM binding
resource "google_cloud_run_service_iam_member" "unauthenticated" {
  service  = google_cloud_run_service.app.name
  location = google_cloud_run_service.app.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Secrets
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "redis_password" {
  length  = 32
  special = true
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "ganttium-db-password"
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

EOF
```


#### **Step 3: Create variables file**

```bash
cat > variables.tf << 'EOF'
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "ganttium-303401483984"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

EOF
```


#### **Step 4: Create outputs file**

```bash
cat > outputs.tf << 'EOF'
output "cloud_run_url" {
  value       = google_cloud_run_service.app.status[0].url
  description = "Cloud Run service URL"
}

output "database_connection_string" {
  value       = "postgresql://${google_sql_user.app_user.name}@${google_sql_database_instance.postgres.private_ip_address}:5432/${google_sql_database.ganttium.name}"
  sensitive   = true
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

EOF
```


#### **Step 5: Initialize Terraform**

```bash
# Create GCS bucket for Terraform state (one time)
gsutil mb gs://ganttium-terraform-state

# Initialize Terraform
terraform init

# Verify configuration
terraform validate

# See what will be created
terraform plan
```


#### **Step 6: Deploy infrastructure**

```bash
# Apply the configuration
terraform apply

# Review the changes, type "yes" to confirm
```


#### **Step 7: Destroy (if needed)**

```bash
terraform destroy
```


***

### **Using Terraform in CI/CD**

Add to your GitHub Actions workflow:

```yaml
deploy-infra:
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  
  steps:
    - uses: actions/checkout@v4
    
    - name: Setup Terraform
      uses: hashicorp/setup-terraform@v2
      with:
        terraform_version: 1.6.4
    
    - name: Terraform Init
      run: terraform init
      working-directory: ./terraform
      env:
        GOOGLE_CREDENTIALS: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
    
    - name: Terraform Plan
      run: terraform plan -out=tfplan
      working-directory: ./terraform
    
    - name: Terraform Apply
      run: terraform apply tfplan
      working-directory: ./terraform
```


***

## **3. Automated Security Scanning (SAST/DAST)**

### **What it does:**

Scans your code for:

- **SAST (Static Application Security Testing):** Code vulnerabilities (SQL injection, XSS, etc.)
- **DAST (Dynamic Application Security Testing):** Runtime vulnerabilities (broken auth, SSRF, etc.)
- **Dependency scanning:** Vulnerable npm packages


### **Setup (CLI)**

#### **Option A: GitHub's Built-in CodeQL (FREE \& EASIEST)**

```bash
cat > .github/workflows/security-scan.yml << 'EOF'
name: Security Scanning

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  codeql:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      security-events: write

    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript
          queries: security-and-quality

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  dependency-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Check for vulnerable packages
        run: npx snyk test --severity-threshold=high || true

  bandit-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Bandit
        run: pip install bandit
      
      - name: Run Bandit on backend code
        run: bandit -r server/ -ll -f json -o bandit-report.json || true
      
      - name: Upload Bandit report
        uses: actions/upload-artifact@v3
        with:
          name: bandit-report
          path: bandit-report.json

  dast-scan:
    needs: [dependency-check]
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Build and start app
        run: npm run build && npm run start &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test

      - name: Wait for app
        run: sleep 10

      - name: Install OWASP ZAP
        run: |
          mkdir -p zap
          wget -q https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2.14.0_Linux.tar.gz
          tar -xzf ZAP_2.14.0_Linux.tar.gz -C zap

      - name: Run ZAP DAST scan
        run: |
          zap/ZAP_2.14.0/zap.sh -cmd \
            -quickurl http://localhost:8080 \
            -quickout zap-report.html || true

      - name: Upload ZAP report
        uses: actions/upload-artifact@v3
        with:
          name: zap-report
          path: zap-report.html

EOF
```


#### **Option B: Install locally for testing**

```bash
# CodeQL (if you want to test locally)
brew install codeql

# Run locally
codeql database create --language=javascript --source-root=. codeql-db
codeql database analyze codeql-db javascript-security-and-quality --format=sarif-latest --output=results.sarif

# npm audit (test locally)
npm audit
npm audit fix

# Snyk (alternative to npm audit)
npm install -g snyk
snyk auth
snyk test

# Bandit (Python backend scanning)
pip install bandit
bandit -r server/ -ll

# OWASP ZAP (local DAST)
brew install zaproxy

# Start your app locally
docker-compose up -d

# Run ZAP
zaproxy -cmd -quickurl http://localhost:8080 -quickout zap-report.html
```


***

## **Complete CLI Setup (All 3 Together)**

Here's the exact sequence to run **right now**:

```bash
# 1. Set up GitHub Actions
mkdir -p .github/workflows

# CI/CD pipeline
cat > .github/workflows/ci-cd-pipeline.yml << 'EOF'
# [Use the YAML from section 1 above]
EOF

# Security scanning
cat > .github/workflows/security-scan.yml << 'EOF'
# [Use the YAML from section 3 above]
EOF

# 2. Set up Terraform
mkdir -p terraform
cd terraform

cat > main.tf << 'EOF'
# [Use the Terraform config from section 2 above]
EOF

cat > variables.tf << 'EOF'
# [Use the variables from section 2 above]
EOF

cat > outputs.tf << 'EOF'
# [Use the outputs from section 2 above]
EOF

# Initialize Terraform
terraform init
terraform plan

# 3. Commit everything
cd ..
git add .github/workflows/ terraform/
git commit -m "feat: add CI/CD, Terraform IaC, and security scanning"
git push origin main

# 4. Watch it run!
# GitHub → Actions tab
```


***

## **Priority: What to Do First (90 Days)**

| Phase | Task | Effort | Impact |
| :-- | :-- | :-- | :-- |
| **Week 1** | ✅ GitHub Actions (CI/CD) | 4 hours | 🔴 CRITICAL—catch bugs before deploy |
| **Week 2** | ✅ Security scanning (CodeQL + npm audit) | 2 hours | 🔴 CRITICAL—prevent vulnerabilities |
| **Week 3-4** | ✅ Terraform (IaC) | 8 hours | 🟡 MEDIUM—reproducible infra |
| **Week 5+** | ✅ DAST (ZAP scanning) | 4 hours | 🟡 MEDIUM—runtime security testing |


***

**Are all three doable via CLI? YES.** Do you need all three immediately? **No.** Start with GitHub Actions + CodeQL (Week 1), then add Terraform and DAST as you scale.

**Want me to create a ready-to-use artifact with all the files you can copy-paste?**

