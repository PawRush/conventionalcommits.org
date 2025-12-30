#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { execSync } from "child_process";
import { FrontendStack } from "../lib/stacks/frontend-stack";
import { PipelineStack } from "../lib/stacks/pipeline-stack";

const app = new cdk.App();

const getDefaultEnvironment = (): string => {
  try {
    const username = process.env.USER || execSync('whoami').toString().trim();
    return `preview-${username}`;
  } catch {
    return 'preview-local';
  }
};

const environment = app.node.tryGetContext("environment") || getDefaultEnvironment();
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || "us-east-1";

const buildOutputPath = app.node.tryGetContext("buildPath") || "../public";

// Get context values for pipeline
const codeConnectionArn = app.node.tryGetContext("codeConnectionArn");
const repositoryName = app.node.tryGetContext("repositoryName") || "PawRush/conventionalcommits.org";
const branchName = app.node.tryGetContext("branchName") || "deploy-to-aws";
const pipelineOnly = app.node.tryGetContext("pipelineOnly") === "true";

// Create infrastructure stacks only if not pipeline-only mode
if (!pipelineOnly) {
  new FrontendStack(app, `ConventionalCommitsFrontend-${environment}`, {
    env: { account, region },
    environment,
    buildOutputPath,
    description: `ConventionalCommits.org static website hosting - ${environment}`,
    terminationProtection: environment === "prod",
  });
}

// Create pipeline stack (only if CodeConnection ARN is provided)
if (codeConnectionArn) {
  new PipelineStack(app, "ConventionalCommitsPipelineStack", {
    env: { account, region },
    description: "CI/CD Pipeline for ConventionalCommits.org",
    codeConnectionArn,
    repositoryName,
    branchName,
    terminationProtection: true,
  });
} else if (pipelineOnly) {
  console.warn("⚠️  CodeConnection ARN not provided. Pipeline stack will not be created.");
  console.warn("   Usage: --context codeConnectionArn=arn:aws:codeconnections:...");
}

cdk.Tags.of(app).add("Project", "ConventionalCommits");
cdk.Tags.of(app).add("ManagedBy", "CDK");
cdk.Tags.of(app).add("Environment", environment);
