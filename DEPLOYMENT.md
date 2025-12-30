---
generated_by_sop: deploy-frontend-app
repo_name: conventionalcommits.org
app_name: ConventionalCommits
app_type: "Frontend Application"
branch: deploy-to-aws
created: 2025-12-30T16:43:31Z
last_updated: 2025-12-30T16:58:32Z
username: jairosp
description: Deployment plan for ConventionalCommits.org Hugo static site to AWS S3 + CloudFront
---

# Deployment Summary

Your app is deployed to AWS, and you now have a 'preview' URL (that doesn't change when you update GitHub), so you can share this link with others.

If you want to connect deployments to GitHub changes, you can ask your coding agent to `setup a AWS CodePipeline` which will use the AWS MCP server.

The Services used in this deployment are: **AWS CloudFormation**, **Amazon S3**, **Amazon CloudFront**, **AWS Lambda**, **AWS IAM**, **Amazon CloudWatch Logs**.

Questions? You can ask your Coding Agent follow-up questions like:
 - What resources were deployed to AWS?
 - How do I update my site after making changes?
 - How do I deploy to production?
 - How do I set up a custom domain?
 - How do I monitor my application?

---

# ConventionalCommits Deployment Guide

## Quick Access

**Website URL:** https://d34lfyp508h3dr.cloudfront.net

**Deploy Command:**
```bash
./scripts/deploy.sh
```

## Deployment Details

### CloudFront Distribution
- Distribution ID: E2VYBQSAIR7OD9
- Domain: d34lfyp508h3dr.cloudfront.net
- Security: Managed security headers policy
- SSL/TLS: TLS 1.2+ enforced
- HTTP Version: HTTP/2 and HTTP/3 enabled

### S3 Buckets
- **Content Bucket:** conventionalcommitsfrontend-preview-jairosp-644722646588
- **S3 Access Logs:** conventionalcommitsfrontend-preview-jairosp-s3logs-644722646588
- **CloudFront Logs:** conventionalcommitsfrontend-preview-jairosp-cflogs-644722646588

### Infrastructure
- **Stack Name:** ConventionalCommitsFrontend-preview-jairosp
- **AWS Region:** us-east-1
- **AWS Account:** 644722646588
- **Build Command:** `hugo`
- **Output Directory:** `public/`

## Common Operations

### Deploy Updates

```bash
# Deploy to preview environment (default)
./scripts/deploy.sh

# Deploy to dev environment
./scripts/deploy.sh dev

# Deploy to production
./scripts/deploy.sh prod

# Deploy without updating assets (infrastructure only)
WITH_ASSETS=false ./scripts/deploy.sh
```

### Invalidate CloudFront Cache

After making content changes, invalidate the cache for immediate updates:

```bash
aws cloudfront create-invalidation \
  --distribution-id E2VYBQSAIR7OD9 \
  --paths "/*"
```

### View Deployment Logs

```bash
aws cloudformation describe-stack-events \
  --stack-name ConventionalCommitsFrontend-preview-jairosp
```

### Rollback Deployment

```bash
cd infra
npx cdk destroy ConventionalCommitsFrontend-preview-jairosp
```

## Development Workflow

1. **Make Changes:** Edit content in `./content/` or themes
2. **Test Locally:** Run `docker-compose up` or `hugo server`
3. **Build:** Run `hugo` to generate static files in `public/`
4. **Deploy:** Run `./scripts/deploy.sh` to deploy to AWS

## Production Readiness

When deploying to production environments, consider these additional improvements:

1. **Enable WAF Protection**: Configure AWS WAF with managed rules for your public endpoints to protect against common exploits
2. **Enable Content Security Policy header**: Add CSP headers in CloudFront to restrict resource loading and prevent cross-site scripting (XSS) attacks
3. **Custom Domain**: Set up a custom domain using Route 53 and ACM SSL certificate
4. **Monitoring**: Configure CloudWatch alarms for CloudFront metrics

## Environment Reference

```
AWS Region: us-east-1
AWS Account: 644722646588
CDK Stack: ConventionalCommitsFrontend-preview-jairosp
CloudFront Distribution: E2VYBQSAIR7OD9
S3 Bucket: conventionalcommitsfrontend-preview-jairosp-644722646588
S3 Log Bucket: conventionalcommitsfrontend-preview-jairosp-s3logs-644722646588
CloudFront Log Bucket: conventionalcommitsfrontend-preview-jairosp-cflogs-644722646588

IAM Permissions Required:
- CDK deployment permissions (CloudFormation, S3, CloudFront, IAM)
- Secrets Manager read/write (if using secrets)

Secrets Management:
- Store sensitive data in AWS Secrets Manager: conventionalcommits/[environment]/secrets
- Never commit secrets to git or include in deployment plan
```

## Troubleshooting

### Build Errors

If Hugo build fails, check:
- Hugo version: `hugo version` (requires v0.152.2+)
- Content syntax errors in markdown files
- Theme configuration in `config.yaml`

### CloudFront 403 Errors

The CloudFrontToS3 construct automatically configures Origin Access Control (OAC) and S3 bucket policy. If issues persist:
- Verify the construct created the OAC
- Ensure bucket is private (enforced by construct)
- Check CloudFormation events for policy creation errors

### Stale Content

If updates aren't reflected:
1. Verify build completed successfully: `hugo`
2. Check deployment completed: `./scripts/deploy.sh`
3. Invalidate CloudFront cache: `aws cloudfront create-invalidation --distribution-id E2VYBQSAIR7OD9 --paths "/*"`

## Deployment History

### Session 1 - 2025-12-30T16:43:31Z - 2025-12-30T16:58:32Z

**Agent:** Claude (Sonnet 4.5)

**Actions Taken:**
- Created deploy branch (deploy-to-aws)
- Initialized CDK infrastructure with TypeScript
- Generated CDK stack for Hugo static site
- Fixed Response Headers Policy quota limit by using AWS managed policy
- Successfully deployed to AWS S3 + CloudFront
- Configured security headers, logging, and access controls
- Created deployment scripts and documentation

**Issues Resolved:**
- CloudFront Response Headers Policy quota limit: Switched from custom policy to AWS managed security headers policy (ID: 67f7725c-6f97-4210-82d7-5512b31e9d03)

**Result:** ✅ Deployment successful
