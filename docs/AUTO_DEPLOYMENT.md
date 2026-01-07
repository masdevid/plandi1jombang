# Auto-Deployment Setup Guide

**Date**: 2026-01-08
**Project**: SDN Plandi 1 Jombang

This guide explains how to set up automatic Docker deployment when pushing to the `main` branch.

## 📋 Table of Contents

1. [Method 1: GitHub Actions (Recommended)](#method-1-github-actions-recommended)
2. [Method 2: Webhook Server](#method-2-webhook-server-alternative)
3. [Server Requirements](#server-requirements)
4. [Troubleshooting](#troubleshooting)

---

## Method 1: GitHub Actions (Recommended)

GitHub Actions automatically deploys to your server via SSH when you push to the `main` branch.

### ✅ Advantages
- No server-side webhook service needed
- Secure SSH-based deployment
- GitHub-managed infrastructure
- Build logs visible in GitHub UI
- Easy to debug and monitor

### 📝 Setup Steps

#### 1. Prepare Your Server

SSH into your production server and set up the project:

```bash
# Clone the repository
sudo mkdir -p /opt
cd /opt
sudo git clone https://github.com/masdevid/plandi1jombang.git sd-plandi
cd sd-plandi

# Set permissions
sudo chown -R $USER:$USER /opt/sd-plandi

# Create environment file
sudo cp .env.example .env.docker
sudo nano .env.docker  # Edit with your production credentials
```

#### 2. Generate SSH Key for GitHub Actions

On your server, create a dedicated SSH key for GitHub Actions:

```bash
# Generate SSH key (no passphrase for automation)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Add to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Display private key (you'll need this for GitHub Secrets)
cat ~/.ssh/github_actions_deploy
```

**Copy the entire private key output** (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`).

#### 3. Configure GitHub Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add the following:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SERVER_HOST` | Your server IP or domain | `203.0.113.10` or `plandi.example.com` |
| `SERVER_USER` | SSH username | `root` or `ubuntu` |
| `SERVER_SSH_KEY` | Private key from step 2 | *paste entire key* |
| `SERVER_PORT` | SSH port (optional) | `22` (default) |
| `PROJECT_PATH` | Project directory on server | `/opt/sd-plandi` |

#### 4. Test the Deployment

Make a small change and push to main:

```bash
# On your local machine
git add .
git commit -m "test: trigger auto-deployment"
git push origin main
```

Go to **GitHub** → **Actions** tab to see the deployment progress.

#### 5. Verify Deployment

SSH into your server and check:

```bash
cd /opt/sd-plandi
docker-compose ps
docker-compose logs --tail=50
```

### 🔧 Customizing the Workflow

Edit [.github/workflows/deploy.yml](.github/workflows/deploy.yml) to customize:

```yaml
# Deploy on different branches
on:
  push:
    branches:
      - main
      - production

# Add build steps before deployment
- name: Build frontend
  run: pnpm build

# Add notifications (Slack, Discord, etc.)
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
```

---

## Method 2: Webhook Server (Alternative)

A Node.js webhook server that listens for GitHub push events and triggers deployment.

### ✅ Advantages
- Full control over deployment process
- Can add custom logic (notifications, rollbacks, etc.)
- Works with any Git provider
- No external dependencies

### ❌ Disadvantages
- Requires server-side service to run continuously
- Need to expose webhook port to internet
- More complex setup

### 📝 Setup Steps

#### 1. Prepare Server Files

SSH into your server:

```bash
cd /opt/sd-plandi

# Make deploy script executable
chmod +x scripts/deploy.sh

# Test the deploy script manually
sudo bash scripts/deploy.sh
```

#### 2. Install Webhook Service

```bash
# Copy systemd service file
sudo cp scripts/webhook.service /etc/systemd/system/

# Edit the service file to set your webhook secret
sudo nano /etc/systemd/system/webhook.service

# Set a strong random secret (save this for GitHub webhook config)
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "Your webhook secret: $WEBHOOK_SECRET"

# Update the service file with your secret
sudo sed -i "s/your-github-webhook-secret-here/$WEBHOOK_SECRET/" /etc/systemd/system/webhook.service

# Reload systemd
sudo systemctl daemon-reload

# Start webhook service
sudo systemctl start webhook

# Enable on boot
sudo systemctl enable webhook

# Check status
sudo systemctl status webhook
```

#### 3. Configure Firewall

Open the webhook port:

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 9000/tcp

# FirewallD (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=9000/tcp
sudo firewall-cmd --reload
```

#### 4. Configure Nginx Reverse Proxy (Optional but Recommended)

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/webhook
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name webhook.plandi1jombang.sch.id;  # Change to your domain

    location /webhook {
        proxy_pass http://localhost:9000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:9000/health;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Configure GitHub Webhook

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `http://your-server-ip:9000/webhook` or `https://webhook.plandi1jombang.sch.id/webhook`
   - **Content type**: `application/json`
   - **Secret**: Use the `WEBHOOK_SECRET` from step 2
   - **Events**: Select "Just the push event"
   - **Active**: ✓ Checked

4. Click **Add webhook**

#### 6. Test the Webhook

Make a commit and push:

```bash
git add .
git commit -m "test: trigger webhook deployment"
git push origin main
```

Check webhook logs:

```bash
# View webhook server logs
sudo journalctl -u webhook -f

# View deployment logs
sudo tail -f /var/log/sd-plandi-deploy.log
```

---

## Server Requirements

### Minimum Server Specs
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: 2GB minimum (4GB recommended)
- **Disk**: 20GB free space
- **CPU**: 2 cores minimum

### Required Software

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for webhook method)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get update
sudo apt-get install -y git
```

### Server Permissions

The deployment user needs:
- Docker access: `sudo usermod -aG docker $USER`
- Project directory access: `sudo chown -R $USER:$USER /opt/sd-plandi`
- Sudo access for webhook method (to run deploy script)

---

## Troubleshooting

### GitHub Actions Issues

#### ❌ SSH Connection Failed
```
Error: Connection refused
```

**Solution**:
1. Check `SERVER_HOST` and `SERVER_PORT` secrets
2. Verify SSH key is correct
3. Test SSH manually: `ssh -i ~/.ssh/github_actions_deploy user@server`
4. Check server firewall allows SSH

#### ❌ Permission Denied
```
Error: Permission denied (publickey)
```

**Solution**:
1. Verify private key in `SERVER_SSH_KEY` secret
2. Check public key is in `~/.ssh/authorized_keys` on server
3. Check SSH key permissions: `chmod 600 ~/.ssh/authorized_keys`

#### ❌ Docker Command Failed
```
Error: docker: command not found
```

**Solution**:
1. Install Docker on server
2. Add user to docker group: `sudo usermod -aG docker $USER`
3. Re-login or run: `newgrp docker`

### Webhook Server Issues

#### ❌ Webhook Service Won't Start
```
Failed to start webhook.service
```

**Solution**:
```bash
# Check service status
sudo systemctl status webhook

# Check logs
sudo journalctl -u webhook -n 50

# Verify Node.js is installed
node --version

# Check file permissions
ls -la /opt/sd-plandi/scripts/webhook-server.js
chmod +x /opt/sd-plandi/scripts/webhook-server.js
```

#### ❌ GitHub Webhook Returns 401 Unauthorized
```
Delivery failed: 401 Unauthorized
```

**Solution**:
1. Verify `WEBHOOK_SECRET` matches in both GitHub and `/etc/systemd/system/webhook.service`
2. Restart webhook service: `sudo systemctl restart webhook`

#### ❌ Deployment Script Fails
```
Error: Failed to pull latest code
```

**Solution**:
```bash
# Check Git configuration
cd /opt/sd-plandi
git remote -v
git status

# Reset to clean state
git fetch origin
git reset --hard origin/main

# Check permissions
ls -la /opt/sd-plandi
```

### Docker Issues

#### ❌ Containers Won't Start
```
Error: Cannot connect to database
```

**Solution**:
```bash
# Check .env.docker file exists
ls -la /opt/sd-plandi/.env.docker

# Check database credentials
cat /opt/sd-plandi/.env.docker

# View container logs
docker-compose logs db
docker-compose logs api

# Restart containers
docker-compose down
docker-compose up -d
```

#### ❌ Port Already in Use
```
Error: bind: address already in use
```

**Solution**:
```bash
# Check what's using the port
sudo lsof -i :3001
sudo lsof -i :5432

# Stop conflicting service or change port in .env.docker
sudo systemctl stop postgresql  # If using system PostgreSQL
```

---

## Security Best Practices

### 1. Use SSH Keys (Not Passwords)
- Generate dedicated keys for automation
- Never commit private keys to Git
- Rotate keys every 6-12 months

### 2. Protect Webhook Secret
- Use strong random secrets: `openssl rand -hex 32`
- Store in environment variables, not code
- Rotate periodically

### 3. Firewall Configuration
```bash
# Only allow necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 9000/tcp # Webhook (or use nginx proxy)
sudo ufw enable
```

### 4. Use HTTPS for Webhooks
- Get free SSL with Let's Encrypt
- Configure nginx as reverse proxy
- GitHub requires HTTPS for webhooks in production

### 5. Limit Deployment Permissions
- Use dedicated deployment user (not root)
- Restrict sudo access to only deployment script
- Add to `/etc/sudoers.d/deploy`:
  ```
  deploy ALL=(ALL) NOPASSWD: /opt/sd-plandi/scripts/deploy.sh
  ```

---

## Monitoring Deployment

### View Logs

```bash
# GitHub Actions logs
# Go to: https://github.com/masdevid/plandi1jombang/actions

# Webhook server logs
sudo journalctl -u webhook -f

# Deployment script logs
sudo tail -f /var/log/sd-plandi-deploy.log

# Docker container logs
docker-compose logs -f
docker-compose logs -f api
docker-compose logs -f db
```

### Check Service Status

```bash
# Check all services
docker-compose ps

# Check webhook service (if using webhook method)
sudo systemctl status webhook

# Check container health
docker inspect sd-plandi-api | grep -A 10 Health
docker inspect sd-plandi-db | grep -A 10 Health
```

### Health Checks

```bash
# API health
curl http://localhost:3001/health

# Database connection
docker exec sd-plandi-db pg_isready -U sd_plandi_user

# Webhook server health (if using)
curl http://localhost:9000/health
```

---

## Manual Deployment

If automated deployment fails, you can deploy manually:

```bash
# SSH to server
ssh user@server

# Run deployment script
cd /opt/sd-plandi
sudo bash scripts/deploy.sh

# Or manually:
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose ps
```

---

## Rollback Procedure

If a deployment breaks production:

```bash
# SSH to server
ssh user@server
cd /opt/sd-plandi

# Find previous working commit
git log --oneline -10

# Rollback to previous commit
git reset --hard <commit-hash>

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs --tail=50
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Webhooks Guide](https://docs.github.com/en/webhooks)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Systemd Service Configuration](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. View deployment logs
3. Create an issue on GitHub

---

**Last Updated**: 2026-01-08
**Maintained by**: SD Plandi DevOps Team
