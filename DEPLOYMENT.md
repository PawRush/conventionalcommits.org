# Deployment Guide: ConventionalCommits.org

This guide covers the complete deployment setup for ConventionalCommits.org, including both the AWS infrastructure and CI/CD pipeline.

## Overview

ConventionalCommits.org is deployed on AWS using:
- **Frontend**: Hugo static site → S3 + CloudFront
- **CI/CD**: AWS CodePipeline with automatic deployments
- **Infrastructure**: AWS CDK (TypeScript)

## Deployment Architecture

```
GitHub (deploy-to-aws)
    ↓ (CodeConnection)
CodePipeline
    ↓ Source
    ↓ Build (Hugo)
    ↓ DeployProd (CDK + S3 sync + CloudFront invalidation)
Production Site
```

## AWS Resources

### Production Environment
- **Stack Name**: ConventionalCommitsFrontend-prod
- **Website URL**: https://d1wli9ledumf0a.cloudfront.net
- **CloudFront Distribution**: E257EW6BRDW7Q4
- **S3 Bucket**: conventionalcommitsfrontend-prod-v2-644722646588
- **Region**: us-east-1

### CI/CD Pipeline
- **Stack Name**: ConventionalCommitsPipelineStack
- **Pipeline Name**: ConventionalCommitsPipeline
- **Pipeline URL**: https://us-east-1.console.aws.amazon.com/codesuite/codepipeline/pipelines/ConventionalCommitsPipeline/view
- **Repository**: PawRush/conventionalcommits.org
- **Branch**: deploy-to-aws
- **CodeConnection**: arn:aws:codeconnections:us-east-1:644722646588:connection/4376c89e-c7b1-40df-9e0d-ecc34457b801

## Pipeline Stages

### 1. Source
Triggers on push to `deploy-to-aws` branch via CodeConnection.

### 2. Build
- Installs Hugo v0.152.2
- Runs `hugo` to generate static site
- Outputs `public/` directory as artifact

### 3. DeployProd
- Deploys CDK stack (ConventionalCommitsFrontend-prod)
- Syncs files to S3 bucket
- Creates CloudFront invalidation
- Waits for invalidation to complete

## Local Development

### Prerequisites
- Node.js (v22+)
- Hugo Extended v0.152.2
- AWS CLI configured
- AWS CDK CLI (`npm install -g aws-cdk`)

### Running Hugo Locally
```bash
hugo server -D
# Site available at http://localhost:1313
```

### Building Hugo Site
```bash
hugo
# Output in public/ directory
```

## Infrastructure Deployment

### Deploy Preview Environment
```bash
cd infra
npm install
npm run deploy:preview
# Creates stack: ConventionalCommitsFrontend-preview-{username}
```

### Deploy Production (via Pipeline)
1. Commit changes to `deploy-to-aws` branch
2. Push to GitHub
3. Pipeline automatically triggers
4. Monitor at: [Pipeline Console](https://us-east-1.console.aws.amazon.com/codesuite/codepipeline/pipelines/ConventionalCommitsPipeline/view)

### Manual Production Deploy (if needed)
```bash
cd infra
npm install
npm run deploy:prod
```

## Pipeline Management

### Viewing Pipeline Status
```bash
aws codepipeline get-pipeline-state --name ConventionalCommitsPipeline
```

### Manually Triggering Pipeline
```bash
aws codepipeline start-pipeline-execution --name ConventionalCommitsPipeline
```

### Viewing Build Logs
```bash
# List recent builds
aws codebuild list-builds-for-project --project-name ConventionalCommits-FrontendBuild

# Get build logs
aws logs tail /aws/codebuild/ConventionalCommits-FrontendBuild --follow
```

## CDK Bootstrap

The CDK bootstrap has been configured with trust for pipeline roles:
- **BuildRole**: arn:aws:iam::644722646588:role/ConventionalCommitsPipelineStack-BuildRoleA9A369DE-9aYKplElR4r6
- **DeployRole**: arn:aws:iam::644722646588:role/ConventionalCommitsPipelineStack-DeployRole8C803698-4VUOdvhkNFO6

If you need to re-bootstrap:
```bash
./scripts/bootstrap-cdk.sh ConventionalCommitsPipelineStack
```

## Troubleshooting

### Pipeline Fails at Build
- Check Hugo version matches v0.152.2
- Verify buildspec: `buildspecs/frontend_build.yml`
- View logs: `aws logs tail /aws/codebuild/ConventionalCommits-FrontendBuild`

### Pipeline Fails at Deploy
- Verify CDK bootstrap trust is configured
- Check deploy role has necessary permissions
- View logs: `aws logs tail /aws/codebuild/ConventionalCommits-DeployFrontend`

### CloudFront Not Updating
- Check if invalidation was created successfully
- Manual invalidation: `aws cloudfront create-invalidation --distribution-id E257EW6BRDW7Q4 --paths "/*"`
- Invalidations can take 5-15 minutes

### Stack Drift
```bash
cd infra
npm run diff
```

## Cost Considerations

Estimated monthly costs (based on moderate traffic):
- **CloudFront**: $1-10 (depending on traffic)
- **S3**: $0.50-2 (storage + requests)
- **CodePipeline**: $1 (1 pipeline)
- **CodeBuild**: $0-5 (compute time)
- **Total**: ~$2.50-18/month

## Security

- All S3 buckets have public access blocked
- CloudFront uses Origin Access Control (OAC)
- AWS managed security headers policy applied
- All logs stored in dedicated S3 buckets
- Pipeline roles follow least-privilege principle

## Maintenance

### Updating Hugo Version
1. Edit `buildspecs/frontend_build.yml`
2. Change Hugo version in download URL
3. Commit and push to trigger pipeline

### Updating Dependencies
```bash
cd infra
npm update
npm audit fix
```

### Destroying Resources

**Warning**: This permanently deletes all resources.

```bash
# Destroy pipeline
cd infra
npm run destroy:pipeline

# Destroy production frontend (manual - pipeline stack protects it)
aws cloudformation delete-stack --stack-name ConventionalCommitsFrontend-prod

# Destroy preview environments
npm run destroy
```

## Deployment History

### Initial Setup (2025-12-30)
- Created FrontendStack with S3 + CloudFront
- Fixed Response Headers Policy quota issue by using AWS managed policy
- Initial manual deployment to preview environment
- Production URL: https://d3sx0nbuon3n4b.cloudfront.net

### Pipeline Setup (2025-12-30)
- Created ConventionalCommitsPipelineStack
- Configured 3-stage pipeline: Source → Build → DeployProd
- Fixed buildspec path issues for CodeBuild environment
- Changed npm ci to npm install (project excludes package-lock.json)
- First successful automated deployment
- Production URL: https://d3sx0nbuon3n4b.cloudfront.net

### Pipeline Completion and Production Deployment (2026-01-06)
- Configured CDK bootstrap with trust for pipeline roles
- Fixed S3 bucket naming conflicts by adding v2 suffix
- Successfully deployed prod stack via automated pipeline
- New production URL: https://d1wli9ledumf0a.cloudfront.net
- CloudFront Distribution: E257EW6BRDW7Q4
- All pipeline stages (Source → Build → DeployProd) executing successfully

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Hugo Documentation](https://gohugo.io/documentation/)
- [AWS CodePipeline User Guide](https://docs.aws.amazon.com/codepipeline/)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)

## Support

For deployment issues:
1. Check pipeline status in AWS Console
2. Review CloudWatch logs for build/deploy stages
3. Run `npm run diff` to check for infrastructure drift
4. Consult this documentation and AWS documentation
