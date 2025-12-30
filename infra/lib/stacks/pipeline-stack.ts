import * as cdk from "aws-cdk-lib";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { ArtifactsBucket, CodeBuildRole } from "../constructs/shared-constructs";

export interface PipelineStackProps extends cdk.StackProps {
  codeConnectionArn: string;
  repositoryName: string;
  branchName: string;
}

export class PipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactsBucket: s3.Bucket;
  private readonly props: PipelineStackProps;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    this.props = props;

    // Create artifacts bucket with lifecycle rules
    this.artifactsBucket = new ArtifactsBucket(this, "ArtifactsBucket").bucket;

    // Create SNS topic for notifications
    const notificationTopic = new sns.Topic(this, "PipelineNotifications", {
      displayName: "ConventionalCommits Pipeline Notifications",
    });

    // Create CodeBuild roles
    const buildRole = new CodeBuildRole(this, "BuildRole", {
      allowSecretsManager: false,
      allowS3Artifacts: true,
      allowCloudFormation: true,
      allowCdkBootstrap: true,
      additionalPolicies: [
        // Read-only CloudFront permissions for cdk synth/diff
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "cloudfront:GetDistribution",
            "cloudfront:GetDistributionConfig",
          ],
          resources: ["*"],
        }),
      ],
    });

    const deployRole = new CodeBuildRole(this, "DeployRole", {
      allowSecretsManager: false,
      allowS3Artifacts: true,
      allowCloudFormation: true,
      allowCdkBootstrap: true,
      additionalPolicies: [
        // S3 permissions for frontend deployment (aws s3 sync)
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "s3:ListBucket",
            "s3:GetBucketLocation",
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
          ],
          resources: [
            `arn:aws:s3:::conventionalcommitsfrontend-*`,
            `arn:aws:s3:::conventionalcommitsfrontend-*/*`,
          ],
        }),
        // CloudFront invalidation permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "cloudfront:CreateInvalidation",
            "cloudfront:GetInvalidation",
            "cloudfront:GetDistribution",
            "cloudfront:GetDistributionConfig",
          ],
          resources: ["*"],
        }),
      ],
    });

    // Create CodeBuild projects
    const frontendBuildProject = this.createFrontendBuildProject(buildRole.role);
    const deployFrontendProject = this.createDeployFrontendProject(deployRole.role);

    // Define pipeline artifacts
    const artifacts = {
      source: new codepipeline.Artifact("SourceOutput"),
      frontendBuild: new codepipeline.Artifact("FrontendBuildOutput"),
    };

    const [owner, repo] = props.repositoryName.split("/");

    // Define pipeline stages
    const stages: codepipeline.StageProps[] = [
      {
        stageName: "Source",
        actions: [
          new codepipeline_actions.CodeStarConnectionsSourceAction({
            actionName: "Source",
            owner,
            repo,
            branch: props.branchName,
            connectionArn: props.codeConnectionArn,
            output: artifacts.source,
            triggerOnPush: true,
          }),
        ],
      },
      {
        stageName: "Build",
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: "FrontendBuild",
            project: frontendBuildProject,
            input: artifacts.source,
            outputs: [artifacts.frontendBuild],
          }),
        ],
      },
      {
        stageName: "DeployProd",
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: "DeployFrontendProd",
            project: deployFrontendProject,
            input: artifacts.source,
            extraInputs: [artifacts.frontendBuild],
            environmentVariables: {
              ENVIRONMENT: { value: "prod" },
            },
            runOrder: 1,
          }),
        ],
      },
    ];

    // Create pipeline
    this.pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "ConventionalCommitsPipeline",
      pipelineType: codepipeline.PipelineType.V2,
      artifactBucket: this.artifactsBucket,
      stages,
    });

    // Subscribe to notifications
    this.pipeline.notifyOnExecutionStateChange(
      "PipelineExecutionNotifications",
      notificationTopic
    );

    // Outputs
    new cdk.CfnOutput(this, "PipelineName", {
      value: this.pipeline.pipelineName,
      description: "CodePipeline Name",
    });

    new cdk.CfnOutput(this, "PipelineUrl", {
      value: `https://${this.region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${this.pipeline.pipelineName}/view`,
      description: "CodePipeline Console URL",
    });

    // Critical: Export role ARNs for bootstrap script
    new cdk.CfnOutput(this, "BuildRoleArn", {
      value: buildRole.role.roleArn,
      description: "CodeBuild Build Role ARN (for CDK bootstrap trust)",
      exportName: `${this.stackName}-BuildRoleArn`,
    });

    new cdk.CfnOutput(this, "DeployRoleArn", {
      value: deployRole.role.roleArn,
      description: "CodeBuild Deploy Role ARN (for CDK bootstrap trust)",
      exportName: `${this.stackName}-DeployRoleArn`,
    });

    cdk.Tags.of(this).add("Stack", "Pipeline");
    cdk.Tags.of(this).add("aws-mcp:deploy:type", "ci-cd");
  }

  private createFrontendBuildProject(role: iam.Role): codebuild.PipelineProject {
    return new codebuild.PipelineProject(this, "FrontendBuildProject", {
      projectName: "ConventionalCommits-FrontendBuild",
      role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename(
        "buildspecs/frontend_build.yml"
      ),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE),
    });
  }

  private createDeployFrontendProject(role: iam.Role): codebuild.PipelineProject {
    return new codebuild.PipelineProject(this, "DeployFrontendProject", {
      projectName: "ConventionalCommits-DeployFrontend",
      role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename(
        "buildspecs/deploy_frontend.yml"
      ),
    });
  }
}
