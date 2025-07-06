# GitHub Actions Setup Guide

This guide explains how to set up the GitHub Actions workflows for automated Docker Hub deployment.

## 🔧 Required Secrets

You need to configure the following secrets in your GitHub repository:

### 1. Navigate to Repository Settings
1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Docker Hub Secrets

Click **New repository secret** and add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Your Docker Hub username | `mrorbitman` |
| `DOCKER_PASSWORD` | Your Docker Hub password or access token | `dckr_pat_abc123...` |

**⚠️ Security Recommendation:** Use a Docker Hub Access Token instead of your password:
1. Go to [Docker Hub Account Settings](https://hub.docker.com/settings/security)
2. Click **New Access Token**
3. Give it a name like "GitHub Actions"
4. Copy the token and use it as `DOCKER_PASSWORD`

## 🚀 Workflow Overview

### 1. **docker-deploy.yml** - Main Deployment
**Triggers:**
- Push to `main`/`master` branch
- New tags (e.g., `v1.0.0`)
- Manual dispatch

**Actions:**
- Builds multi-architecture image (amd64, arm64)
- Pushes to `mrorbitman/jpc-sonic`
- Updates Docker Hub description
- Runs security scan

### 2. **release.yml** - Release Management
**Triggers:**
- GitHub releases
- Manual dispatch with version input

**Actions:**
- Creates versioned releases
- Tags as `latest` for stable releases
- Generates release notes

### 3. **test.yml** - Pull Request Testing
**Triggers:**
- Pull requests to `main`/`master`
- Manual dispatch

**Actions:**
- Builds image without pushing
- Runs local tests
- Security vulnerability scan

## 📋 Setup Checklist

- [ ] Add `DOCKER_USERNAME` secret
- [ ] Add `DOCKER_PASSWORD` secret (preferably access token)
- [ ] Verify Docker Hub repository `mrorbitman/jpc-sonic` exists
- [ ] Test workflows by creating a pull request
- [ ] Verify deployment by pushing to main branch

## 🏷️ Tagging Strategy

The workflows support multiple tagging strategies:

### Automatic Tags
- `latest` - Latest stable release
- `main` - Latest main branch build
- `pr-123` - Pull request builds
- `main-abc1234` - Commit SHA builds

### Version Tags
Create releases using semantic versioning:
```bash
git tag v1.0.0
git push origin v1.0.0
```

This creates:
- `v1.0.0` - Exact version
- `1.0` - Minor version
- `1` - Major version
- `latest` - If not a pre-release

### Pre-release Tags
For beta/alpha releases:
```bash
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

This creates:
- `v1.0.0-beta.1` - Exact version
- Does NOT update `latest` tag

## 🔍 Monitoring Deployments

### GitHub Actions Tab
1. Go to your repository
2. Click **Actions** tab
3. Monitor workflow runs and logs

### Docker Hub
1. Visit [mrorbitman/jpc-sonic](https://hub.docker.com/r/mrorbitman/jpc-sonic)
2. Check tags and build status
3. View automated description updates

### Security Scans
- Vulnerability reports appear in **Security** tab
- Critical/High severity issues will fail builds
- View detailed reports in workflow logs

## 🚨 Troubleshooting

### Authentication Errors
```
Error: Cannot perform an interactive login from a non TTY device
```
**Solution:** Check that `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets are set correctly.

### Build Failures
```
Error: buildx failed with: ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully
```
**Solution:** Check that all dependencies are properly defined in `package.json` and the build works locally.

### Permission Denied
```
Error: denied: requested access to the resource is denied
```
**Solution:** 
1. Verify Docker Hub repository exists
2. Check that `DOCKER_USERNAME` has push access to `mrorbitman/jpc-sonic`
3. Ensure access token has write permissions

### Multi-architecture Build Issues
```
Error: multiple platforms feature is currently not supported for docker driver
```
**Solution:** The workflow uses `docker/setup-buildx-action` which should resolve this automatically.

## 🔄 Manual Deployment

### Deploy Specific Version
1. Go to **Actions** tab
2. Click **Release** workflow
3. Click **Run workflow**
4. Enter version tag (e.g., `v1.2.3`)
5. Choose if it's a pre-release

### Force Rebuild
1. Go to **Actions** tab
2. Click **Build and Deploy to Docker Hub** workflow
3. Click **Run workflow**
4. Select branch to deploy

## 📊 Workflow Status Badges

Add these badges to your README.md:

```markdown
[![Docker Build](https://github.com/mrorbitman/jpc-sonic-app/actions/workflows/docker-deploy.yml/badge.svg)](https://github.com/mrorbitman/jpc-sonic-app/actions/workflows/docker-deploy.yml)
[![Test Build](https://github.com/mrorbitman/jpc-sonic-app/actions/workflows/test.yml/badge.svg)](https://github.com/mrorbitman/jpc-sonic-app/actions/workflows/test.yml)
[![Release](https://github.com/mrorbitman/jpc-sonic-app/actions/workflows/release.yml/badge.svg)](https://github.com/mrorbitman/jpc-sonic-app/actions/workflows/release.yml)
```

## 🎯 Best Practices

1. **Test First**: Always test changes in pull requests before merging
2. **Semantic Versioning**: Use proper version tags (v1.0.0, v1.1.0, etc.)
3. **Security**: Regularly update base images and dependencies
4. **Documentation**: Keep Docker Hub description updated via DOCKER.md
5. **Monitoring**: Watch for security vulnerabilities in scans

## 🔗 Useful Links

- [Docker Hub Repository](https://hub.docker.com/r/mrorbitman/jpc-sonic)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Semantic Versioning](https://semver.org/)

## 📞 Support

If you encounter issues:
1. Check the workflow logs in GitHub Actions
2. Verify all secrets are configured correctly
3. Test Docker build locally first
4. Check Docker Hub repository permissions
