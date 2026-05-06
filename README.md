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

# Install TypeScript and ts-node to run TypeScript files directly
npm i -D typescript ts-node

# Install Node.js type definitions
# Note: it is recommended to check your Node.js version and install the matching types
# e.g. for Node 24: npm i -D @types/node@^24
npm i -D @types/node
```

## Debugging Lambda Functions

- 🐛 [Debugging TypeScript with IntelliJ (JetBrains)](https://www.jetbrains.com/help/idea/running-and-debugging-typescript.html#ws_ts_run_debug_server_side)
- 🐛 **VS Code**: The project includes a `launch.json` configuration (`Debug local file`) that allows debugging any TypeScript file directly using `ts-node`, with the `AWS_REGION` and `TABLE_NAME` environment variables pre-configured. Since it uses `${relativeFile}`, make sure the file you want to debug is the **active file** in the editor before starting the debug session.
- 🐛 **Terminal**: Alternatively, you can debug/run a Lambda locally from the terminal using:
  ```bash
  npx ts-node test/launcher.ts
  ```
  For this to work, the environment variables must be defined directly in `test/launcher.ts`:
  ```ts
  process.env.AWS_REGION = 'us-east-1';
  process.env.TABLE_NAME = 'SpaceTable-121b4872df75';
  ```

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

## Resources

- 🎓 [Udemy Course](https://www.udemy.com/course/aws-typescript-cdk-serverless-react/?couponCode=MT260504G1)
- 📦 [Original Course Repository](https://github.com/alexhddev/CDK-course-resources)
