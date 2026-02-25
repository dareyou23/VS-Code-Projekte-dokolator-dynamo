import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: z.string().min(8).max(100)
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (event.httpMethod === 'POST' && event.path.endsWith('/change-password')) {
      return await handleChangePassword(event);
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
