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

## Resources

- 🎓 [Udemy Course](https://www.udemy.com/course/aws-typescript-cdk-serverless-react/?couponCode=MT260504G1)
- 📦 [Original Course Repository](https://github.com/alexhddev/CDK-course-resources)
