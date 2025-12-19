#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { execSync } from "child_process";
import { FrontendStack } from "../lib/stacks/frontend-stack";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

// Get context values
const codeConnectionArn = app.node.tryGetContext("codeConnectionArn");
const repositoryName = app.node.tryGetContext("repositoryName") || "PawRush/conventionalcommits.org";
const branchName = app.node.tryGetContext("branchName") || "deploy-to-aws";
const pipelineOnly = app.node.tryGetContext("pipelineOnly") === "true";

// Environment detection
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

// Create infrastructure stacks only if not pipeline-only mode
if (!pipelineOnly) {
  // Detect build output path for Hugo
  const buildOutputPath = app.node.tryGetContext("buildPath") || "../public";

  // Create frontend stack
  new FrontendStack(app, `ConventionalCommitsFrontend-${environment}`, {
    env: { account, region },
    environment,
    buildOutputPath,
    description: `Static website hosting - ${environment}`,
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
  });
} else {
  if (!pipelineOnly) {
    console.warn(
      "⚠️  CodeConnection ARN not provided. Pipeline stack will not be created.",
    );
  }
}

// Global tags
cdk.Tags.of(app).add("Project", "ConventionalCommits");
cdk.Tags.of(app).add("ManagedBy", "CDK");
cdk.Tags.of(app).add("Environment", environment);
