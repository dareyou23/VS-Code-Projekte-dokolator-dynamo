import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  RespondToAuthChallengeCommand
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

// Helper: CORS Headers
const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id'
};

// Sign up with phone number
export const signUp = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { phoneNumber, password } = body;

    if (!phoneNumber || !password) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'phoneNumber and password are required' })
      };
    }

    const command = new SignUpCommand({
      ClientId: process.env.CLIENT_ID!,
      Username: phoneNumber,
      Password: password,
      UserAttributes: [
        {
          Name: 'phone_number',
          Value: phoneNumber
        }
      ]
    });

    const result = await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        message: 'Verification code sent to your phone',
        userSub: result.UserSub
      })
    };
  } catch (error: any) {
    console.error('SignUp error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: error.message || 'Failed to sign up' })
    };
  }
};

// Confirm sign up with verification code
export const confirmSignUp = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'phoneNumber and code are required' })
      };
    }

    const command = new ConfirmSignUpCommand({
      ClientId: process.env.CLIENT_ID!,
      Username: phoneNumber,
      ConfirmationCode: code
    });

    await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Phone number verified successfully' })
    };
  } catch (error: any) {
    console.error('ConfirmSignUp error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: error.message || 'Failed to confirm sign up' })
    };
  }
};

// Sign in with phone number
export const signIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { phoneNumber, password } = body;

    if (!phoneNumber || !password) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'phoneNumber and password are required' })
      };
    }

    const command = new InitiateAuthCommand({
      ClientId: process.env.CLIENT_ID!,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: phoneNumber,
        PASSWORD: password
      }
    });

    const result = await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        accessToken: result.AuthenticationResult?.AccessToken,
        idToken: result.AuthenticationResult?.IdToken,
        refreshToken: result.AuthenticationResult?.RefreshToken,
        expiresIn: result.AuthenticationResult?.ExpiresIn
      })
    };
  } catch (error: any) {
    console.error('SignIn error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: error.message || 'Failed to sign in' })
    };
  }
};
