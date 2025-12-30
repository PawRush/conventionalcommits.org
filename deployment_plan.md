---
generated_by_sop: deploy-frontend-app
repo_name: conventionalcommits.org
app_name: ConventionalCommits
app_type: "Frontend Application"
branch: deploy-to-aws
created: 2025-12-30T16:43:31Z
last_updated: 2025-12-30T16:43:31Z
username: jairosp
description: Deployment plan for ConventionalCommits.org Hugo static site to AWS S3 + CloudFront
---

# Deployment Plan: ConventionalCommits

<!-- AGENT_INSTRUCTIONS
Read this file first when continuing deployment.
Complete ALL phases (Phase 1 AND Phase 2).
Only stop between phases if context >80% used.
Update timestamps and session log after each substep.

SECURITY: Never log credentials, secrets, or sensitive data. Store secrets in AWS Secrets Manager only.
-->

## ➡️ Phase 1: Frontend Deployment

```
Status: ➡️ In Progress
Build Command: hugo (Hugo static site generator)
Output Directory: public/
Stack Name: ConventionalCommitsFrontend-preview-jairosp
Deployment URL: [To be determined after deployment]
```

### Phase 1 Substeps

<!-- AGENT_INSTRUCTIONS
Update each substep with status icons: 🕣 → ➡️ → ✅ → ❌
SUCCESS CRITERIA: All substeps must be ✅ Complete before proceeding to Phase 2
-->

- ✅ 1.1: Create deploy branch (deploy-to-aws)
- ➡️ 1.2: Create deployment_plan.md and AGENTS.md
- 🕣 1.3: Commit deployment plan
- 🕣 1.4: Initialize CDK foundation (infra/ directory, dependencies)
- 🕣 1.5: Generate CDK stack (frontend-stack.ts, infra.ts)
- 🕣 1.6: Create deployment script (scripts/deploy.sh)
- 🕣 1.7: Commit CDK infrastructure
- 🕣 1.8: Build Hugo site
- 🕣 1.9: Execute CDK deployment
- 🕣 1.10: Capture deployment outputs (URL, Distribution ID, Bucket names)
- 🕣 1.11: Update deployment_plan.md with deployment details

### Checkpoint for Phase 1

<!-- AGENT_INSTRUCTIONS
MANDATORY: Continue to Phase 2 unless context >80% used.
If stopping: Update status, inform user to continue with: 'Continue my ./deployment_plan.md'
-->

---

## 🕣 Phase 2: Documentation

```
Status: 🕣 Pending
```

**CRITICAL**: This phase is MANDATORY. The deployment is incomplete without documentation.

Complete deployment documentation with essential information. Keep guidance light - prompt customer to ask follow-up questions for additional details.

### Phase 2 Tasks
- 🕣 2.1: Update deployment_plan.md with final deployment information
  - Deployment URL, stack names, distribution details
  - Mark Phase 1 as ✅ Complete, Phase 2 as ✅ Complete
  - Final session log entry with completion timestamp
- 🕣 2.2: Add simple deployment section to README.md
  - Deployment URL for accessing the application
  - Basic deploy command: `./scripts/deploy.sh`
  - Reference to DEPLOYMENT.md for full details
- 🕣 2.3: Finalize deployment documentation
  - Rename deployment_plan.md to DEPLOYMENT.md
  - Remove all AGENT_INSTRUCTIONS comment blocks
  - Add completion summary with actions taken
  - Include follow-up questions that customers may choose to ask for more details
  - Commit finalized documentation

<!-- AGENT_INSTRUCTIONS
MANDATORY: Complete ALL Phase 2 tasks before declaring deployment complete.
Update each task as completed with ✅
Include deployment URL, monitoring links, and essential commands
-->

---

## Supporting data

### Recovery Guide

```bash
# Rollback
cd infra && npx cdk destroy ConventionalCommitsFrontend-preview-jairosp

# Redeploy
hugo && ./scripts/deploy.sh

# View logs
aws cloudformation describe-stack-events --stack-name ConventionalCommitsFrontend-preview-jairosp

# Invalidate cache
aws cloudfront create-invalidation --distribution-id [id] --paths "/*"
```

### Environment Reference

```
AWS Region: us-east-1
AWS Account: 644722646588
CDK Stack: ConventionalCommitsFrontend-preview-jairosp
CloudFront Distribution: [To be determined]
S3 Bucket: [To be determined]
Log Bucket: [To be determined]

IAM Permissions Required:
- CDK deployment permissions (CloudFormation, S3, CloudFront, IAM)
- Secrets Manager read/write (if using secrets)

Secrets Management:
- Store sensitive data in AWS Secrets Manager: conventionalcommits/[environment]/secrets
- Never commit secrets to git or include in deployment plan
```

---

## Session Log

### Session 1 - 2025-12-30T16:43:31Z
```
Agent: Claude (Sonnet 4.5)
Completed:
- Step 1.1: Created deploy branch
- Step 1.2: Creating deployment_plan.md and AGENTS.md
Stopped at: In progress - creating deployment plan
Notes: Hugo static site detected, proceeding with deployment to AWS S3 + CloudFront
```
