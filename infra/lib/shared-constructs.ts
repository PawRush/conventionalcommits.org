import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

/**
 * CodeBuild IAM Role with configurable permissions
 */
export interface CodeBuildRoleProps {
  allowSecretsManager?: boolean;
  allowS3Artifacts?: boolean;
  allowCloudFormation?: boolean;
  allowCdkBootstrap?: boolean;
  additionalPolicies?: iam.PolicyStatement[];
}

export class CodeBuildRole extends Construct {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: CodeBuildRoleProps = {}) {
    super(scope, id);

    // Create base role for CodeBuild
    this.role = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      description: `CodeBuild role for ${id}`,
    });

    // Allow CloudWatch Logs
    this.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      }),
    );

    // Allow Secrets Manager
    if (props.allowSecretsManager) {
      this.role.addToPrincipalPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret",
          ],
          resources: ["arn:aws:secretsmanager:*:*:secret:*"],
        }),
      );
    }

    // Allow S3 Artifacts
    if (props.allowS3Artifacts) {
      this.role.addToPrincipalPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:GetBucketVersioning",
            "s3:GetBucketLocation",
          ],
          resources: ["arn:aws:s3:::*"],
        }),
      );
    }

    // Allow CloudFormation
    if (props.allowCloudFormation) {
      this.role.addToPrincipalPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "cloudformation:DescribeStacks",
            "cloudformation:DescribeStackEvents",
            "cloudformation:DescribeStackResources",
            "cloudformation:GetTemplate",
          ],
          resources: ["*"],
        }),
      );
    }

    // Allow CDK Bootstrap (for cdk synth and deploy)
    if (props.allowCdkBootstrap) {
      this.role.addToPrincipalPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "iam:GetRole",
            "iam:GetPolicy",
            "iam:CreateRole",
            "iam:PutRolePolicy",
            "iam:PassRole",
          ],
          resources: ["*"],
        }),
      );

      // S3 bucket for CDK bootstrap artifacts
      this.role.addToPrincipalPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "s3:CreateBucket",
            "s3:ListBucket",
            "s3:GetBucketVersioning",
            "s3:PutBucketVersioning",
            "s3:GetBucketLocation",
            "s3:PutObject",
            "s3:GetObject",
          ],
          resources: ["arn:aws:s3:::cdktoolkit-*", "arn:aws:s3:::cdktoolkit-*/*"],
        }),
      );

      // ECR for CDK bootstrap
      this.role.addToPrincipalPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "ecr:CreateRepository",
            "ecr:DescribeRepositories",
            "ecr:GetDownloadUrlForLayer",
            "ecr:PutImage",
            "ecr:InitiateLayerUpload",
            "ecr:UploadLayerPart",
            "ecr:CompleteLayerUpload",
          ],
          resources: ["*"],
        }),
      );
    }

    // Add custom policies
    if (props.additionalPolicies) {
      props.additionalPolicies.forEach((policy) => {
        this.role.addToPrincipalPolicy(policy);
      });
    }
  }
}

/**
 * S3 bucket for pipeline artifacts with lifecycle rules and encryption
 */
export class ArtifactsBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const account = cdk.Stack.of(this).account;

    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: `conventionalcommits-pipeline-artifacts-${account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: "DeleteOldArtifacts",
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });
  }
}
