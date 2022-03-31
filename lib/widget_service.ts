import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class WidgetService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const bucket = new s3.Bucket(this, 'WidgetStore');

    const handler = new lambda.Function(this, 'WidgetHandler', {
      runtime: lambda.Runtime.NODEJS_14_X, // So we can use async in widget.js
      code: lambda.Code.fromAsset('resources'),
      handler: 'widgets.main',
      environment: {
        BUCKET: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(handler); // was: handler.role);

    const api = new apigateway.RestApi(this, 'widgets-api', {
      restApiName: 'Widget Service',
      description: 'This service serves widgets.',
    });

    const getWidgetsIntegration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    api.root.addMethod('GET', getWidgetsIntegration); // GET /

    const widget = api.root.addResource('{id}');

    // Add new widget to bucket with: POST /{id}
    const postWidgetIntegration = new apigateway.LambdaIntegration(handler);

    // Get a specific widget from bucket with: GET /{id}
    const getWidgetIntegration = new apigateway.LambdaIntegration(handler);

    // Remove a specific widget from the bucket with: DELETE /{id}
    const deleteWidgetIntegration = new apigateway.LambdaIntegration(handler);

    widget.addMethod('POST', postWidgetIntegration); // POST /{id}
    widget.addMethod('GET', getWidgetIntegration); // GET /{id}
    widget.addMethod('DELETE', deleteWidgetIntegration); // DELETE /{id}
  }
}
