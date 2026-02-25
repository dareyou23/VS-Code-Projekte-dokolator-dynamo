import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(100)
});

const ResetPasswordSchema = z.object({
  email: z.string().email().max(255)
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Handle OPTIONS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        body: '',
      };
    }
    
    const path = event.path;
    
    if (path.endsWith('/login')) {
      return await handleLogin(event);
    }
    
    if (path.endsWith('/logout')) {
      return await handleLogout(event);
    }
    
    if (path.endsWith('/reset-password')) {
      return await handlePasswordReset(event);
    }
    
    if (path.endsWith('/refresh')) {
      return await handleRefreshToken(event);
    }
    
    return errorResponse('Route not found', 404);
  } catch (error) {
    console.error('Auth error:', error);
    return errorResponse('Internal server error', 500);
  }
}

async function handleLogin(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body required');
  }
  
  try {
    const body = LoginSchema.parse(JSON.parse(event.body));
    
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.GAMES_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :email',
      ExpressionAttributeValues: {
        ':email': `EMAIL#${body.email.toLowerCase()}`,
      },
    }));
    
    if (!result.Items || result.Items.length === 0) {
      return errorResponse('Invalid credentials', 401);
    }
    
    const user = result.Items[0];
    
    if (!user.password) {
      return errorResponse('Invalid credentials', 401);
    }
    
    const isValidPassword = await bcrypt.compare(body.password, user.password);
    if (!isValidPassword) {
      return errorResponse('Invalid credentials', 401);
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        rolle: user.rolle 
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        rolle: user.rolle,
        type: 'refresh'
      },
      jwtSecret,
      { expiresIn: '30d' }
    );
    
    return successResponse({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        rolle: user.rolle,
        aktiv: user.aktiv,
        passwordChangeRequired: user.passwordChangeRequired,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid input: ' + error.issues.map((e: any) => e.message).join(', '), 400);
    }
    throw error;
  }
}

async function handleRefreshToken(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body required');
  }
  
  try {
    const body = RefreshTokenSchema.parse(JSON.parse(event.body));
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    
    const decoded = jwt.verify(body.refreshToken, jwtSecret) as any;
    
    if (decoded.type !== 'refresh') {
      return errorResponse('Invalid refresh token', 401);
    }
    
    const accessToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email,
        rolle: decoded.rolle 
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
    
    return successResponse({ accessToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid input: ' + error.issues.map((e: any) => e.message).join(', '), 400);
    }
    return errorResponse('Invalid or expired refresh token', 401);
  }
}

async function handleLogout(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return successResponse({ message: 'Logged out successfully' });
}

async function handlePasswordReset(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body required');
  }
  
  try {
    const body = ResetPasswordSchema.parse(JSON.parse(event.body));
    
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.GAMES_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :email',
      ExpressionAttributeValues: {
        ':email': `EMAIL#${body.email.toLowerCase()}`,
      },
    }));
    
    if (!result.Items || result.Items.length === 0) {
      return successResponse({ 
        message: 'Falls ein Account mit dieser E-Mail existiert, wurde das Passwort zurückgesetzt.',
        temporaryPassword: null
      });
    }
    
    const user = result.Items[0];
    const currentYear = new Date().getFullYear();
    const temporaryPassword = `Tennis${currentYear}`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    await docClient.send(new UpdateCommand({
      TableName: process.env.GAMES_TABLE,
      Key: {
        PK: user.PK,
        SK: user.SK,
      },
      UpdateExpression: 'SET password = :password, passwordChangeRequired = :required, updatedAt = :updated',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':required': true,
        ':updated': new Date().toISOString(),
      },
    }));
    
    return successResponse({
      message: 'Passwort wurde zurückgesetzt',
      temporaryPassword,
      email: body.email,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid input: ' + error.issues.map((e: any) => e.message).join(', '), 400);
    }
    throw error;
  }
}
