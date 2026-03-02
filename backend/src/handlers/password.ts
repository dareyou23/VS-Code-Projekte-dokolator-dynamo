import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: z.string().min(8).max(100)
});

const AdminResetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8).max(100)
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (event.httpMethod === 'POST' && event.path.endsWith('/change-password')) {
      return await handleChangePassword(event);
    }
    
    if (event.httpMethod === 'POST' && event.path.endsWith('/admin-reset-password')) {
      return await handleAdminResetPassword(event);
    }
    
    return errorResponse('Route not found', 404);
  } catch (error) {
    console.error('Password error:', error);
    return errorResponse('Internal server error', 500);
  }
}

async function handleChangePassword(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body required');
  }
  
  try {
    const body = ChangePasswordSchema.parse(JSON.parse(event.body));
    const userId = event.requestContext.authorizer?.userId;
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Get user
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.GAMES_TABLE,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'PROFILE',
      },
    }));
    
    if (!result.Items || result.Items.length === 0) {
      return errorResponse('User not found', 404);
    }
    
    const user = result.Items[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(body.currentPassword, user.password);
    if (!isValidPassword) {
      return errorResponse('Current password is incorrect', 401);
    }
    
    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(body.newPassword, user.password);
    if (isSamePassword) {
      return errorResponse('New password must be different from current password', 400);
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    
    // Update password
    await docClient.send(new UpdateCommand({
      TableName: process.env.GAMES_TABLE,
      Key: {
        PK: user.PK,
        SK: user.SK,
      },
      UpdateExpression: 'SET password = :password, passwordChangeRequired = :required, updatedAt = :updated',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':required': false,
        ':updated': new Date().toISOString(),
      },
    }));
    
    return successResponse({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid input: ' + error.issues.map((e: any) => e.message).join(', '), 400);
    }
    throw error;
  }
}

async function handleAdminResetPassword(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body required');
  }
  
  try {
    const body = AdminResetPasswordSchema.parse(JSON.parse(event.body));
    
    // Extract rolle from JWT token
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];
    let rolle = 'user';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
        const decoded = jwt.verify(token, jwtSecret) as any;
        rolle = decoded.rolle || 'user';
      } catch (err) {
        console.error('JWT verification failed:', err);
      }
    }
    
    // Check if user is admin
    if (rolle !== 'admin') {
      return errorResponse('Forbidden: Admin access required', 403);
    }
    
    // Get target user
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.GAMES_TABLE,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${body.userId}`,
        ':sk': 'PROFILE',
      },
    }));
    
    if (!result.Items || result.Items.length === 0) {
      return errorResponse('User not found', 404);
    }
    
    const user = result.Items[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    
    // Update password and set passwordChangeRequired
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
      message: 'Password reset successfully',
      email: user.email
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid input: ' + error.issues.map((e: any) => e.message).join(', '), 400);
    }
    throw error;
  }
}
