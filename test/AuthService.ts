import { Amplify } from 'aws-amplify';
import { SignInOutput, fetchAuthSession, signIn } from '@aws-amplify/auth';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

const awsRegion = 'us-east-1';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_rgHoEDiOP',
      userPoolClientId: '6n43ln8r0vudv3d2sjtptq03bn',
      identityPoolId: 'us-east-1:8d2ddcad-078b-4ed1-9f4a-1461cfc52543'
    }
  }
});

export class AuthService {
  public async login(userName: string, password: string) {
    const signInOutput: SignInOutput = await signIn({
      username: userName,
      password: password,
      options: {
        authFlowType: 'USER_PASSWORD_AUTH'
      }
    });

    return signInOutput;
  }

  /**
   * call only after login
   */
  public async getIdToken() {
    const authSession = await fetchAuthSession();

    return authSession.tokens?.idToken?.toString();
  }

  public async generateTemporaryCredentials() {
    const idToken = await this.getIdToken();
    const cognitoIdentityPool = `cognito-idp.${awsRegion}.amazonaws.com/us-east-1_rgHoEDiOP`;
    const cognitoIdentity = new CognitoIdentityClient({
      credentials: fromCognitoIdentityPool({
        identityPoolId: 'us-east-1:8d2ddcad-078b-4ed1-9f4a-1461cfc52543',
        'logins': {
          [cognitoIdentityPool]: idToken!
        }
      })
    });

    const credentials = await cognitoIdentity.config.credentials();
    return credentials;
  }
}
