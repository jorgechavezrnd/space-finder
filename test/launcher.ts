import { handler } from '../src/services/spaces/handler';

process.env.AWS_REGION = 'us-east-1';
process.env.TABLE_NAME = 'SpaceTable-121b4872df75';

handler({
  httpMethod: 'POST',
  // queryStringParameters: {
  //   id: '1b89b945-0805-4fdc-bcdb-87ea127be1e6'
  // },
  body: JSON.stringify({
    location: 'Dublin updated'
  })
} as any, {} as any).then(result => {
  console.log(result);
});
