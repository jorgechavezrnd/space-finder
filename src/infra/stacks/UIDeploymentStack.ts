import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { getSuffixFromStack } from '../Utils';
import { join } from 'path';
import { existsSync } from 'fs';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AccessLevel, Distribution } from 'aws-cdk-lib/aws-cloudfront';

export class UIDeploymentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const suffix = getSuffixFromStack(this);

    const deploymentBucket = new Bucket(this, 'UIDeploymentBucket', {
      bucketName: `space-finder-frontend-${suffix}`
    });

    const uiDir = join(__dirname, '..', '..', '..', '..', 'space-finder-frontend', 'dist');
    if (!existsSync(uiDir)) {
      console.warn('UI dir not found: ' + uiDir);
      return;
    }

    new BucketDeployment(this, 'SpacesFinderDeployment', {
      destinationBucket: deploymentBucket,
      sources: [Source.asset(uiDir)]
    });

    const s3Origin = S3BucketOrigin.withOriginAccessControl(deploymentBucket, {
      originAccessLevels: [AccessLevel.READ]
    });

    const distribution = new Distribution(this, 'SpacesFinderDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: s3Origin
      }
    });

    new CfnOutput(this, 'SpaceFinderUrl', {
      value: distribution.distributionDomainName
    });
  }
}
