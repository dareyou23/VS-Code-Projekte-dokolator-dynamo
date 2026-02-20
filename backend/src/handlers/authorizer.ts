import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  try {
    const token = event.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return {
        isAuthorized: false
      };
    }

    // Verify token with Cognito
    const command = new GetUserCommand({
      AccessToken: token
    });

    await cognitoClient.send(command);

    return {
      isAuthorized: true
    };
  } catch (error) {
    console.error('Authorization error:', error);
    return {
      isAuthorized: false
    };
  }
};
