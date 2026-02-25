import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  rolle: z.enum(['admin', 'user'])
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const path = event.path;
    
    // Extract rolle from JWT token (since Authorizer is disabled)
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];
    let rolle = 'user'; // default
    
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
    
    if (method === 'POST' && path === '/users') {
      return await createUser(event);
    }
    
    if (method === 'GET' && path === '/users') {
      return await listUsers(event);
    }
    
    if (method === 'PUT' && path.match(/^\/users\/[^/]+$/)) {
      return await updateUser(event);
    }
    
    if (method === 'DELETE' && path.startsWith('/users/')) {
      return await deleteUser(event);
    }
    
    return errorResponse('Route not found', 404);
  } catch (error) {
    console.error('User management error:', error);
    return errorResponse('Internal server error', 500);
  }
}

async function createUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body required');
  }
  
  try {
    const body = CreateUserSchema.parse(JSON.parse(event.body));
    
    // Check if email already exists
    const existingUser = await docClient.send(new QueryCommand({
      TableName: process.env.GAMES_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :email',
      ExpressionAttributeValues: {
        ':email': `EMAIL#${body.email.toLowerCase()}`,
      },
    }));
    
    if (existingUser.Items && existingUser.Items.length > 0) {
      return errorResponse('Email already exists', 400);
    }
    
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const now = new Date().toISOString();
    
    const user = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      GSI1PK: `EMAIL#${body.email.toLowerCase()}`,
      GSI1SK: 'USER',
      id: userId,
      email: body.email.toLowerCase(),
      password: hashedPassword,
      rolle: body.rolle,
      aktiv: true,
      passwordChangeRequired: true,
      createdAt: now,
      updatedAt: now,
      entityType: 'USER'
    };
    
    await docClient.send(new PutCommand({
      TableName: process.env.GAMES_TABLE,
      Item: user,
    }));
    
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        rolle: user.rolle,
        aktiv: user.aktiv,
        createdAt: user.createdAt,
      }
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid input: ' + error.issues.map((e: any) => e.message).join(', '), 400);
    }
    throw error;
  }
}

async function listUsers(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const rolleFilter = event.queryStringParameters?.rolle;
  
  const result = await docClient.send(new ScanCommand({
    TableName: process.env.GAMES_TABLE,
    FilterExpression: 'entityType = :type',
    ExpressionAttributeValues: {
      ':type': 'USER',
    },
  }));
  
  let users = result.Items || [];
  
  if (rolleFilter && (rolleFilter === 'admin' || rolleFilter === 'user')) {
    users = users.filter(u => u.rolle === rolleFilter);
  }
  
  const userList = users.map(u => ({
    id: u.id || u.userId, // Fallback für alte User mit userId statt id
    email: u.email,
    rolle: u.rolle,
    aktiv: u.aktiv,
    createdAt: u.createdAt,
  }));
  
  return successResponse({ users: userList });
}

async function updateUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.pathParameters?.userId;
  
  if (!userId) {
    return errorResponse('User ID required', 400);
  }
  
  if (!event.body) {
    return errorResponse('Request body required', 400);
  }
  
  try {
    const body = JSON.parse(event.body);
    const { email } = body;
    
    if (!email || typeof email !== 'string') {
      return errorResponse('Valid email required', 400);
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400);
    }
    
    // Check if new email already exists (for different user)
    const existingUser = await docClient.send(new QueryCommand({
      TableName: process.env.GAMES_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :email',
      ExpressionAttributeValues: {
        ':email': `EMAIL#${email.toLowerCase()}`,
      },
    }));
    
    if (existingUser.Items && existingUser.Items.length > 0) {
      const existingUserId = existingUser.Items[0].id || existingUser.Items[0].userId;
      if (existingUserId !== userId) {
        return errorResponse('Email already in use by another user', 400);
      }
    }
    
    // Get current user
    const currentUser = await docClient.send(new QueryCommand({
      TableName: process.env.GAMES_TABLE,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'PROFILE',
      },
    }));
    
    if (!currentUser.Items || currentUser.Items.length === 0) {
      return errorResponse('User not found', 404);
    }
    
    const user = currentUser.Items[0];
    const now = new Date().toISOString();
    
    // Update user with new email
    await docClient.send(new PutCommand({
      TableName: process.env.GAMES_TABLE,
      Item: {
        ...user,
        email: email.toLowerCase(),
        GSI1PK: `EMAIL#${email.toLowerCase()}`,
        updatedAt: now,
      },
    }));
    
    return successResponse({
      user: {
        id: user.id || user.userId,
        email: email.toLowerCase(),
        rolle: user.rolle,
        aktiv: user.aktiv,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse('Failed to update user', 500);
  }
}

async function deleteUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.pathParameters?.userId;
  
  if (!userId) {
    return errorResponse('User ID required', 400);
  }
  
  // Check if this is the last admin
  const allUsers = await docClient.send(new ScanCommand({
    TableName: process.env.GAMES_TABLE,
    FilterExpression: 'entityType = :type',
    ExpressionAttributeValues: {
      ':type': 'USER',
    },
  }));
  
  const userToDelete = allUsers.Items?.find(u => (u.id || u.userId) === userId);
  if (!userToDelete) {
    return errorResponse('User not found', 404);
  }
  
  if (userToDelete.rolle === 'admin') {
    const adminCount = allUsers.Items?.filter(u => u.rolle === 'admin').length || 0;
    if (adminCount <= 1) {
      return errorResponse('Cannot delete the last admin user', 400);
    }
  }
  
  await docClient.send(new DeleteCommand({
    TableName: process.env.GAMES_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
    },
  }));
  
  return successResponse({ message: 'User deleted successfully' });
}
