#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { execSync } from "child_process";
import { FrontendStack } from "../lib/stacks/frontend-stack";

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

new FrontendStack(app, `ConventionalCommitsFrontend-${environment}`, {
  env: { account, region },
  environment,
  buildOutputPath,
  description: `ConventionalCommits.org static website hosting - ${environment}`,
  terminationProtection: environment === "prod",
});

cdk.Tags.of(app).add("Project", "ConventionalCommits");
cdk.Tags.of(app).add("ManagedBy", "CDK");
cdk.Tags.of(app).add("Environment", environment);
