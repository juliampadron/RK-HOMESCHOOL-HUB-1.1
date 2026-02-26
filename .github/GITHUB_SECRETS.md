# GitHub Secrets Setup Guide

## Supabase Configuration
Add these secrets to your GitHub repository:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### How to get these:
1. Go to https://supabase.com/dashboard
2. Select your Renaissance Kids project
3. Navigate to Settings → API
4. Copy your Project URL and anon key

---

## Square Payment Configuration

```
SQUARE_ACCESS_TOKEN
SQUARE_APP_ID
SQUARE_LOCATION_ID
SQUARE_WEBHOOK_SECRET
```

### How to get these:
1. Go to https://developer.squareup.com/apps
2. Select your Renaissance Kids application
3. Credentials tab → Access Token (Production)
4. Settings → Locations (for Location ID)
5. Webhooks → Create new webhook for payment events

---

## Deployment Secrets (for CI/CD)

```
DEPLOY_KEY (SSH private key)
DEPLOY_HOST (your production server hostname)
DEPLOY_USER (SSH username)
```

### How to set these:
1. Generate SSH key pair locally: `ssh-keygen -t rsa -b 4096`
2. Add public key to server ~/.ssh/authorized_keys
3. Go to GitHub repository → Settings → Secrets and variables → Actions
4. Click "New repository secret"
5. Add each secret above

---

## Copilot Studio Configuration

```
COPILOT_STUDIO_BOT_ID
COPILOT_STUDIO_TENANT_ID
```

### How to get these:
1. Go to https://copilotstudio.microsoft.com
2. Select your Renaissance Kids bots
3. Copy Bot ID and Tenant ID from configuration

---

## To Add Secrets:
1. Go to your repository: https://github.com/juliampadron/RK-HOMESCHOOL-HUB-1.1
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Enter the secret name and value
5. Click "Add secret"

All secrets will be available as `${{ secrets.SECRET_NAME }}` in GitHub Actions workflows.