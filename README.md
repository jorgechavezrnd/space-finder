# Space Finder

This project is a CDK application built from scratch without using the `cdk init` command, following a step-by-step manual setup approach as part of a CDK course.

## Steps followed to initialize the project

- Create folder
- `npm init -y`
- Install dependencies
- Create `Launcher.ts` file
- Create empty stack
- Create `cdk.json` file

## Commands used

```bash
# Install AWS CDK and core libraries
npm i -D aws-cdk aws-cdk-lib constructs

# Install TypeScript and tsx to run TypeScript files directly
npm i -D typescript tsx

# Install Node.js type definitions
# Note: it is recommended to check your Node.js version and install the matching types
# e.g. for Node 24: npm i -D @types/node@^24
npm i -D @types/node
```

## Debugging Lambda Functions

- 🐛 [Debugging TypeScript with IntelliJ (JetBrains)](https://www.jetbrains.com/help/idea/running-and-debugging-typescript.html#ws_ts_run_debug_server_side)
- 🐛 **VS Code**: The project includes a `launch.json` configuration (`Debug local file`) that allows debugging any TypeScript file directly using `tsx`, with the `AWS_REGION` and `TABLE_NAME` environment variables pre-configured. Since it uses `${relativeFile}`, make sure the file you want to debug is the **active file** in the editor before starting the debug session.
- 🐛 **Terminal**: Alternatively, you can debug/run a Lambda locally from the terminal using:
  ```bash
  npx tsx test/launcher.ts
  ```
  For this to work, the environment variables must be defined directly in `test/launcher.ts`:
  ```ts
  process.env.AWS_REGION = 'us-east-1';
  process.env.TABLE_NAME = 'SpaceTable-121b4872df75';
  ```

## Migration from ts-node to tsx

`ts-node` has not been actively maintained for over 2 years, so this project migrated to `tsx`, which is faster, simpler, and actively maintained.

### Steps followed to migrate

1. Uninstall `ts-node` and install `tsx`:
   ```bash
   npm uninstall ts-node && npm i -D tsx
   ```
2. Update `cdk.json` to use `tsx` instead of `ts-node`:
   ```json
   "app": "npx tsx src/infra/Launcher.ts"
   ```
3. Update `.vscode/launch.json` `runtimeArgs` to use `tsx`:
   ```json
   "runtimeArgs": ["--import", "tsx"]
   ```

## Getting a token to test spaces.http

The spaces endpoints are protected and require an authorization token. Before running any request in `spaces.http`, you must obtain a valid token by running:

```bash
npx tsx test/auth.test.ts
```

This will log in with the Cognito user (`barosuna`) and print the `idToken` in the terminal. Copy that token and paste it as the value of the `@token` variable at the top of `spaces.http`:

```http
@token = <paste your token here>
```

> ⚠️ Cognito tokens expire after 1 hour. If a request returns `401 Unauthorized`, run the command again to get a fresh token.

## Recommended test order for spaces.http

1. **Get all** - Verify the table is empty or has existing items
2. **Post** - Create a new space and capture the returned `id`
3. **Get one** - Verify the created space exists by `id`
4. **Put** - Update a field of the created space
5. **Get one** - Verify the update was applied correctly
6. **Get all** - Verify the updated space appears in the full list
7. **Delete** - Remove the created space by `id`
8. **Get one** - Verify the space no longer exists
9. **Get all** - Verify the table is back to its original state

## Cognito - Confirm a user manually

When a user is created in Cognito, its confirmation status may be `FORCE_CHANGE_PASSWORD` or `UNCONFIRMED`. To set it to `Confirmed` without going through the email verification flow, use the following AWS CLI command:

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_rgHoEDiOP \
  --username barosuna \
  --password "Barosuna@123#" \
  --permanent
```

## Deploying and saving stack outputs to a file

When deploying, CDK can save all stack output values (like User Pool IDs, API URLs, etc.) to a JSON file. This makes it easier to access them without having to look at the terminal or the AWS Console, and allows other applications (like a UI) to read them directly.

```bash
cdk deploy --all --outputs-file outputs.json
```

This generates an `outputs.json` file at the root of the project with the exported values of each stack. To simplify this command, a `deploy` script was added to `package.json`:

```bash
npm run deploy
```

## S3 BucketAccessControl.PUBLIC_READ workaround

Using `accessControl: BucketAccessControl.PUBLIC_READ` alone on an S3 bucket will cause the deployment to fail due to AWS's default "Block Public Access" settings. This is a known CDK issue (still present as of 2026). In this project, this applies to the `photosBucket` in `DataStack.ts`.

The workaround is to explicitly disable all public access blocks alongside the ACL:

```ts
// accessControl: BucketAccessControl.PUBLIC_READ, // currently not working
objectOwnership: ObjectOwnership.OBJECT_WRITER,
blockPublicAccess: {
  blockPublicAcls: false,
  blockPublicPolicy: false,
  ignorePublicAcls: false,
  restrictPublicBuckets: false
}
```

> ⚠️ Remember to add `ObjectOwnership` to your imports from `aws-cdk-lib/aws-s3`.

## UI Deployment - Prerequisites

For `UIDeploymentStack` to work correctly, the **space-finder-frontend** repository must be cloned at the same level as this project, and the `dist` folder must exist (i.e. the frontend must have been built first).

Expected path: `../space-finder-frontend/dist`

- 🖥️ [Frontend Repository](https://github.com/jorgechavezrnd/space-finder-frontend)

> ⚠️ If the `dist` folder is not found, the stack will log a warning and skip the UI deployment without throwing an error.

## Configure a Webhook in Slack

This webhook is required for the monitor Lambda function to send notifications to Slack. A CloudWatch alarm should be configured to trigger the monitor Lambda, which will then use this webhook to post messages to your Slack channel.

To set up a webhook in Slack for sending notifications, follow these steps:

1. **Navigate to Slack Apps**: Go to [api.slack.com/apps](https://api.slack.com/apps) and log in.
2. **Create an App**: Click **Create New App** and select **"From scratch"**.
3. **Name the App**: Name your app and select the workspace where you want the webhook.
4. **Enable Webhooks**: Click **Incoming Webhooks** in the features section and toggle **Activate Incoming Webhooks** to **"On"**.
5. **Add to Channel**: Click **Add New Webhook to Workspace** at the bottom of the page.
6. **Select Channel**: Choose the channel for the bot to post to, then click **Authorize**.
7. **Copy URL**: Copy the URL listed under **"Webhook URLs for Your Workspace"**. This URL is used to send messages to your Slack channel and should be configured in `monitor/handler.ts`.

> ⚠️ **Important**: It seems that when you push the webhook URL to GitHub, GitHub's push protection detects it as a secret and blocks the push. Even if you use GitHub's unblock link to authorize the push, it appears that the webhook URL may be invalidated or deleted by Slack afterward.

## Viewing CloudWatch Alarms

To view the structure of the alarms configured in your AWS account, you can use the following AWS CLI command:

```bash
aws cloudwatch describe-alarms
```

This command will return a detailed JSON structure of all the alarms in your account, including their configurations and current states.

## Monitoring with AWS X-Ray

This project integrates **AWS X-Ray** for distributed tracing and performance monitoring using the `aws-xray-sdk-core` package.

### Instrumenting AWS Clients

The `aws-xray-sdk-core` package provides the `captureAWSv3Client` function to automatically instrument AWS SDK clients. In `src/services/spaces/handler.ts`, the DynamoDB client is wrapped:

```typescript
import { captureAWSv3Client, getSegment } from 'aws-xray-sdk-core';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const ddbClient = captureAWSv3Client(new DynamoDBClient({}));
```

This instrumentation automatically traces all DynamoDB operations, recording latency, errors, and other metadata.

### Creating Custom Subsegments

The `getSegment()` function retrieves the current X-Ray segment, allowing you to create subsegments for tracking specific operations:

```typescript
const subSeg = getSegment()?.addNewSubsegment('MyLongCall');
await new Promise(resolve => { setTimeout(resolve, 3000) });
subSeg?.close();

const subSeg2 = getSegment()?.addNewSubsegment('MyShortCall');
await new Promise(resolve => { setTimeout(resolve, 500) });
subSeg2?.close();
```

**Benefits:**
- Trace individual operations within your Lambda functions
- Monitor performance bottlenecks
- Visualize service dependencies in the X-Ray console
- Correlate traces with CloudWatch logs and alarms

## Testing with Jest

This project uses **Jest** for unit testing TypeScript code. Since we're using `tsx` as our TypeScript runtime (instead of `ts-node`), the Jest setup requires a specific configuration.

### Installation

```bash
npm i -D jest @types/jest ts-jest
```

- **jest**: The testing framework
- **@types/jest**: TypeScript type definitions for Jest globals (`describe`, `it`, `expect`, etc.)
- **ts-jest**: Preset that enables Jest to understand and transpile TypeScript files

### TypeScript Configuration

Add `"jest"` to the `types` field in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["node", "jest"]
  }
}
```

This tells TypeScript to load Jest's type definitions globally, making functions like `describe`, `it`, `expect`, etc. available in all your test files without needing to import them.

### Jest Configuration

A `jest.config.ts` file has been created at the root of the project with the following configuration:

```typescript
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/test/infra/**/*test.ts'
  ]
};

export default config;
```

- **preset: 'ts-jest'**: Enables Jest to transpile TypeScript files
- **testEnvironment: 'node'**: Configures Jest to run tests in a Node.js environment
- **testMatch**: Specifies the pattern for test files (`test/infra/**/*test.ts`)

### Test Script

The `package.json` includes a test script:

```json
"test": "node --import tsx node_modules/.bin/jest"
```

### Why We Need `node --import tsx`

Jest needs to transpile TypeScript test files, but since we're using `tsx` instead of `ts-node`, we must explicitly import `tsx` as a Node.js loader via the `--import` flag. Here's why:

1. **Jest's default TypeScript handling** relies on `ts-node` or similar tools
2. **We're using `tsx`** instead because it's faster and actively maintained (ts-node hasn't been updated in years)
3. **`--import tsx`** registers `tsx` as an ESM loader for the Node process, allowing it to transpile TypeScript on-the-fly when Jest runs
4. The `jest.config.ts` uses the `ts-jest` preset, which works in combination with the tsx loader

## Testing CDK Stacks

This project uses a setup-act-assert pattern for testing CDK stacks using AWS CDK's built-in testing utilities.

### Testing Strategy

CDK stack tests follow a three-part structure:

1. **Setup**: Prepare the template by creating an App instance, instantiating the stack, and converting it to a Template for assertions
2. **Act**: Query the template for specific constructs and their properties
3. **Assert**: Verify that the constructs have the expected properties and configurations

### Example: MonitorStack Test

The `test/infra/MonitorStack.test.ts` file demonstrates this pattern. Here are the basic tests:

```typescript
import { App } from 'aws-cdk-lib';
import { MonitorStack } from '../../src/infra/stacks/MonitorStack';
import { Template } from 'aws-cdk-lib/assertions';

describe('Initial test suite', () => {

  let monitorStackTemplate: Template;

  beforeAll(() => {
    // Setup: Create the template
    const testApp = new App({
      outdir: 'cdk.out'
    });
    const monitorStack = new MonitorStack(testApp, 'MonitorStack');
    monitorStackTemplate = Template.fromStack(monitorStack);
  });

  test('Lambda properties', () => {
    // Act & Assert: Query and verify Lambda function properties
    monitorStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs24.x'
    });
  });

  test('Sns topic properties', () => {
    // Act & Assert: Query and verify SNS topic properties
    monitorStackTemplate.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'AlarmTopic',
      TopicName: 'AlarmTopic'
    });
  });

});
```

### Two Approaches for Testing Resource Properties

When testing more complex resource relationships, you have two options:

#### Approach 1: Using Matchers

Using `Match` helpers to validate properties with flexible matching patterns:

```typescript
test('Sns subscription properties - with matchers', () => {
  monitorStackTemplate.hasResourceProperties('AWS::SNS::Subscription',
    Match.objectEquals({
      Protocol: 'lambda',
      TopicArn: {
        Ref: Match.stringLikeRegexp('AlarmTopic')
      },
      Endpoint: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('webHookLambda'),
          'Arn'
        ]
      }
    })
  );
});
```

**Benefits**: Flexible pattern matching without needing to know exact resource names. Great for initial tests.

#### Approach 2: Using Exact Values

Using `findResources` to locate specific resources and then assert with their exact references:

```typescript
test('Sns subscription properties - with exact values', () => {
  const snsTopic = monitorStackTemplate.findResources('AWS::SNS::Topic');
  const snsTopicName = Object.keys(snsTopic)[0];

  const lambda = monitorStackTemplate.findResources('AWS::Lambda::Function');
  const lambdaName = Object.keys(lambda)[0];

  monitorStackTemplate.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'lambda',
      TopicArn: {
        Ref: snsTopicName
      },
      Endpoint: {
        'Fn::GetAtt': [
          lambdaName,
          'Arn'
        ]
      }
  });
});
```

**Benefits**: Precise assertions with exact resource references. Ensures resources are correctly connected and linked.

Both approaches are useful: use matchers for quick validation, and use exact values for strict verification of resource relationships.

#### Approach 3: Using Capture for Complex Assertions

The `Capture` object allows you to extract values from resources and perform advanced assertions on them using Jest's `expect` matchers (like `expect.stringMatching`):

```typescript
test('Alarm actions', () => {
  const alarmActionsCapture = new Capture();

  monitorStackTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
    AlarmActions: alarmActionsCapture
  });

  expect(alarmActionsCapture.asArray()).toEqual([{
    Ref: expect.stringMatching(/^AlarmTopic/)
  }]);
});
```

**Benefits**: Combines CDK template assertions with Jest's powerful `expect` matchers. Useful for validating complex properties, array contents, and regex patterns.

This approach uses Jest's `expect.stringMatching()` to perform regex pattern matching on the captured values, providing more sophisticated validation than the previous approaches.

#### Approach 4: Using Snapshots

Jest snapshots capture the entire structure of resources and compare them against future test runs. This is useful for regression testing and documenting expected CloudFormation templates:

```typescript
test('Monitor stack snapshot', () => {
  expect(monitorStackTemplate.toJSON()).toMatchSnapshot();
});

test('Lambda stack snapshot', () => {
  const lambda = monitorStackTemplate.findResources('AWS::Lambda::Function');
  expect(lambda).toMatchSnapshot();
});

test('SNS topic stack snapshot', () => {
  const snsTopic = monitorStackTemplate.findResources('AWS::SNS::Topic');
  expect(snsTopic).toMatchSnapshot();
});
```

**Benefits**: 
- Captures the full structure of templates or resources for regression testing
- Documents expected outputs of your CDK code
- Easily detects unintended changes to resource definitions
- First run creates a snapshot file; subsequent runs compare against it

**Note**: After making intentional changes to your stack, update snapshots by running `npm test -- -u`.

### Running Different Test Suites

The Jest configuration uses a `baseTestDir` variable to determine which tests to run. Update this in `jest.config.ts` to test different parts of your application:

**For Infrastructure Tests (CDK Stacks):**
```typescript
const baseTestDir = '<rootDir>/test/infra';
```

**For Service Tests (Lambda Functions):**
```typescript
const baseTestDir = '<rootDir>/test/services';
```

After changing `baseTestDir`, run `npm test` to execute the appropriate test suite.

## Testing Lambda Functions

When testing Lambda functions that make external API calls (like HTTP requests), **mocking** is essential to avoid making real network calls during tests. This project uses Jest **spies** to mock external dependencies.

### Mocking with Jest Spies

The `test/services/handler.test.ts` demonstrates how to mock the global `fetch` function:

```typescript
import { handler } from '../../src/services/monitor/handler';

describe('Monitor lambda tests', () => {

  const fetchSpy = jest.spyOn(global, 'fetch');
  fetchSpy.mockImplementation(() => Promise.resolve({} as any));

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('makes requests for records in SnsEvents', async () => {
    await handler({
      Records: [{
        Sns: {
          Message: 'Test message'
        }
      }]
    } as any, {});

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(expect.any(String), {
      method: 'POST',
      body: JSON.stringify({
        'text': 'Huston, we have a problem: Test message'
      })
    });
  });

  test('No sns records, no requests', async () => {
    await handler({
      Records: []
    } as any, {});

    expect(fetchSpy).not.toHaveBeenCalled();
  });

});
```

### How Mocking Works

1. **Creating a Spy**: `jest.spyOn(global, 'fetch')` creates a spy on the global `fetch` function
2. **Mocking the Implementation**: `mockImplementation()` replaces the real fetch with a mock that returns a resolved Promise
3. **Clearing Between Tests**: `jest.clearAllMocks()` in `afterEach` resets the mock state after each test
4. **Asserting Calls**: 
   - `toHaveBeenCalledTimes(1)` - verifies fetch was called exactly once
   - `toHaveBeenCalledWith()` - verifies fetch was called with the correct arguments
   - `not.toHaveBeenCalled()` - verifies fetch was never called

### Why Mock External Calls

- **Speed**: Tests run faster without network requests
- **Reliability**: Tests don't fail due to network issues or external service unavailability
- **Isolation**: Tests focus on your code logic, not external dependencies
- **Control**: You can simulate different responses and error scenarios

### Mocking AWS Service Clients

AWS provides the [`aws-sdk-client-mock`](https://aws.amazon.com/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/) package for mocking AWS SDK clients in tests. However, this project uses a simpler manual mocking approach with Jest's `jest.fn()` for more control and flexibility.

The `test/services/spaces/GetSpaces.test.ts` demonstrates how to mock AWS SDK clients for testing database operations:

```typescript
const ddbClientMock = {
  send: jest.fn()
};

// Setup: Mock return values for different test scenarios
ddbClientMock.send.mockResolvedValueOnce(someItems);

// Test the function
const getResult = await getSpaces({} as any, ddbClientMock as any);

// Assert: Verify the mock was called correctly
expect(ddbClientMock.send).toHaveBeenCalledWith(expect.any(GetItemCommand));
const getItemCommandInput = (ddbClientMock.send.mock.calls[0][0] as GetItemCommand).input;
expect(getItemCommandInput.Key).toEqual({
  id: {
    S: '123'
  }
});
```

**Key Points:**
- `jest.fn()` creates a mock function for the `send` method
- `mockResolvedValueOnce()` sets up return values for each test call
- `mock.calls` allows inspecting the exact arguments passed to the mock
- Test different scenarios: missing parameters, not found, success cases, etc.

### Mocking Entire Modules

For more complex dependencies, you can mock entire modules using `jest.mock()`. The `test/services/spaces/handler.test.ts` demonstrates this approach:

```typescript
jest.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockImplementation(() => {
          return {
            Items: someItems
          }
        })
      }
    }),
    ScanCommand: jest.fn()
  }
});

describe('Spaces handler test suite', () => {
  test('Returns spaces from dynamoDb', async () => {
    const result = await handler({
      httpMethod: 'GET'
    } as any, {} as any);

    expect(result.statusCode).toBe(200);
    expect(DynamoDBClient).toHaveBeenCalledTimes(1);
    expect(ScanCommand).toHaveBeenCalledTimes(1);
  });
});
```

**How It Works:**
- `jest.mock()` replaces the entire module before tests run
- Returns an object with mocked exports (DynamoDBClient, ScanCommand)
- Each mock is configured with its own behavior via `mockImplementation()`
- When the handler code imports and uses these classes, it gets the mocks instead

**Benefits:**
- Tests don't need actual AWS credentials or database connections
- Complete control over what each function returns
- Easy to verify that the correct classes and methods were called
- Simpler than manually creating mock objects for each test

## Resources

- 🎓 [Udemy Course](https://www.udemy.com/course/aws-typescript-cdk-serverless-react/?couponCode=MT260504G1)
- 📦 [Original Course Repository](https://github.com/alexhddev/CDK-course-resources)
