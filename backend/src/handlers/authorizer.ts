import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  rolle: string;
}

export async function handler(event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> {
  try {
    const token = event.authorizationToken?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    return {
      principalId: decoded.userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn
          }
        ]
      },
      context: {
        userId: decoded.userId,
        email: decoded.email,
        rolle: decoded.rolle
      }
    };
  } catch (error) {
    console.error('Authorization error:', error);
    throw new Error('Unauthorized');
  }
}
