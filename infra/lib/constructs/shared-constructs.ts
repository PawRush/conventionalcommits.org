import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

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

    this.role = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      description: `CodeBuild role for ${id}`,
    });

    // CloudWatch Logs permissions
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:log-group:/aws/codebuild/*"],
      })
    );

    // S3 artifacts permissions
    if (props.allowS3Artifacts) {
      this.role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:GetObjectVersion",
            "s3:ListBucket",
          ],
          resources: [
            "arn:aws:s3:::*-pipeline-artifacts-*",
            "arn:aws:s3:::*-pipeline-artifacts-*/*",
          ],
        })
      );
    }

    // Secrets Manager permissions
    if (props.allowSecretsManager) {
      this.role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["secretsmanager:GetSecretValue"],
          resources: ["arn:aws:secretsmanager:*:*:secret:*"],
        })
      );
    }

    // CloudFormation permissions
    if (props.allowCloudFormation) {
      this.role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "cloudformation:DescribeStacks",
            "cloudformation:DescribeStackEvents",
            "cloudformation:DescribeStackResources",
            "cloudformation:GetTemplate",
            "cloudformation:ListStacks",
            "cloudformation:CreateStack",
            "cloudformation:UpdateStack",
            "cloudformation:DeleteStack",
            "cloudformation:CreateChangeSet",
            "cloudformation:ExecuteChangeSet",
            "cloudformation:DescribeChangeSet",
            "cloudformation:DeleteChangeSet",
          ],
          resources: ["*"],
        })
      );
    }

    // CDK Bootstrap permissions
    if (props.allowCdkBootstrap) {
      this.role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "sts:AssumeRole",
            "iam:PassRole",
          ],
          resources: [
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/cdk-*`,
          ],
        })
      );

      this.role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "ssm:GetParameter",
          ],
          resources: [
            `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/cdk-bootstrap/*`,
          ],
        })
      );
    }

    // Additional custom policies
    if (props.additionalPolicies) {
      props.additionalPolicies.forEach((policy) => {
        this.role.addToPolicy(policy);
      });
    }
  }
}

export class ArtifactsBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const account = cdk.Stack.of(this).account;

    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: `conventionalcommits-pipeline-artifacts-${account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: "DeleteOldArtifacts",
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: "AbortIncompleteMultipartUpload",
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });
  }
}
