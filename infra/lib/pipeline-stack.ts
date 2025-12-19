import * as cdk from "aws-cdk-lib";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { ArtifactsBucket, CodeBuildRole } from "./shared-constructs";

export interface PipelineStackProps extends cdk.StackProps {
  codeConnectionArn: string;
  repositoryName: string;
  branchName: string;
}

export class PipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactsBucket: cdk.aws_s3.Bucket;
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
    const qualityRole = new CodeBuildRole(this, "QualityRole", {
      allowSecretsManager: true,
      allowS3Artifacts: true,
    }).role;

    const buildRole = new CodeBuildRole(this, "BuildRole", {
      allowSecretsManager: true,
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
    }).role;

    const deployRole = new CodeBuildRole(this, "DeployRole", {
      allowSecretsManager: true,
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
            "arn:aws:s3:::*-frontend-*",
            "arn:aws:s3:::*-frontend-*/*",
          ],
        }),
        // CloudFront invalidation
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["cloudfront:CreateInvalidation"],
          resources: ["*"],
        }),
      ],
    }).role;

    // Create CodeBuild projects
    const lintTypeProject = this.createLintTypeProject(qualityRole);
    const unitTestsProject = this.createUnitTestsProject(qualityRole);
    const frontendBuildProject = this.createFrontendBuildProject(buildRole);
    const deployFrontendProject = this.createDeployFrontendProject(deployRole);

    // Define pipeline artifacts
    const artifacts = {
      source: new codepipeline.Artifact("SourceOutput"),
      lint: new codepipeline.Artifact("LintTypeOutput"),
      unit: new codepipeline.Artifact("UnitTestsOutput"),
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
        stageName: "Quality",
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: "LintType",
            project: lintTypeProject,
            input: artifacts.source,
            outputs: [artifacts.lint],
          }),
          new codepipeline_actions.CodeBuildAction({
            actionName: "UnitTests",
            project: unitTestsProject,
            input: artifacts.source,
            outputs: [artifacts.unit],
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

    // Subscribe to notifications (disabled due to CodeStarNotifications API issues)
    // this.pipeline.notifyOnExecutionStateChange(
    //   "PipelineExecutionNotifications",
    //   notificationTopic,
    // );

    // Outputs
    new cdk.CfnOutput(this, "PipelineName", {
      value: this.pipeline.pipelineName,
      description: "CodePipeline Name",
      exportName: `${this.stackName}-PipelineName`,
    });

    new cdk.CfnOutput(this, "ArtifactsBucketName", {
      value: this.artifactsBucket.bucketName,
      description: "S3 artifacts bucket name",
      exportName: `${this.stackName}-ArtifactsBucket`,
    });

    new cdk.CfnOutput(this, "BuildRoleArn", {
      value: buildRole.roleArn,
      description: "CodeBuild Build Role ARN",
      exportName: `${this.stackName}-BuildRoleArn`,
    });

    new cdk.CfnOutput(this, "DeployRoleArn", {
      value: deployRole.roleArn,
      description: "CodeBuild Deploy Role ARN",
      exportName: `${this.stackName}-DeployRoleArn`,
    });

    cdk.Tags.of(this).add("Stack", "Pipeline");
    cdk.Tags.of(this).add("aws-mcp:deploy:type", "ci-cd");
  }

  private createLintTypeProject(role: iam.Role): codebuild.PipelineProject {
    return new codebuild.PipelineProject(this, "LintTypeProject", {
      projectName: "ConventionalCommits-LintType",
      role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename(
        "buildspecs/lint_type.yml",
      ),
    });
  }

  private createUnitTestsProject(role: iam.Role): codebuild.PipelineProject {
    return new codebuild.PipelineProject(this, "UnitTestsProject", {
      projectName: "ConventionalCommits-UnitTests",
      role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename(
        "buildspecs/unit_tests.yml",
      ),
    });
  }

  private createFrontendBuildProject(
    role: iam.Role,
  ): codebuild.PipelineProject {
    return new codebuild.PipelineProject(this, "FrontendBuildProject", {
      projectName: "ConventionalCommits-FrontendBuild",
      role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename(
        "buildspecs/frontend_build.yml",
      ),
    });
  }

  private createDeployFrontendProject(
    role: iam.Role,
  ): codebuild.PipelineProject {
    return new codebuild.PipelineProject(this, "DeployFrontendProject", {
      projectName: "ConventionalCommits-DeployFrontend",
      role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename(
        "buildspecs/deploy_frontend.yml",
      ),
    });
  }
}
