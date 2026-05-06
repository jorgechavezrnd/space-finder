import { handler } from '../src/services/spaces/handler';

process.env.AWS_REGION = 'us-east-1';
process.env.TABLE_NAME = 'SpaceTable-0eeeec61044d';

handler({
  httpMethod: 'GET',
  queryStringParameters: {
    id: '918f3c8a-0975-4bde-b6f7-e4acf2318e3d'
  },
  // body: JSON.stringify({
  //   location: 'Dublin updated'
  // })
} as any, {} as any).then(result => {
  console.log(result);
});
