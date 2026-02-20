import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Spieltag, Game } from '../types/game';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.GAMES_TABLE || 'DokolatorGames';

// Helper: Response Headers mit CORS
const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id'
};

// Helper: Handle OPTIONS requests
const handleOptions = (): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: responseHeaders,
  body: ''
});

// Helper: Get HTTP method from event
const getHttpMethod = (event: any): string => {
  return event.requestContext?.http?.method || event.httpMethod || 'GET';
};

// Helper: Extract User ID from Cognito token
const getUserIdFromEvent = (event: APIGatewayProxyEvent): string | null => {
  // TODO: Extract from Cognito authorizer context
  // For now, use header or default
  return event.headers['x-user-id'] || event.headers['X-User-Id'] || 'default-user';
};

/**
 * POST /spieltage - Neuen Spieltag erstellen
 */
export const createSpieltag = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (getHttpMethod(event) === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    
    const spieltag: Spieltag = {
      spieltagId: `spieltag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date: body.date || new Date().toISOString(),
      startgeld: body.startgeld || 10.00,
      punktwert: body.punktwert || 0.05,
      playerNames: body.playerNames || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: `SPIELTAG#${spieltag.spieltagId}`,
        ...spieltag,
        entityType: 'SPIELTAG'
      }
    }));

    return {
      statusCode: 201,
      headers: responseHeaders,
      body: JSON.stringify(spieltag)
    };
  } catch (error) {
    console.error('Error creating spieltag:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to create spieltag' })
    };
  }
};

/**
 * GET /spieltage - Alle Spieltage eines Users
 */
export const listSpieltage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (getHttpMethod(event) === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'SPIELTAG#'
      },
      ScanIndexForward: false // Neueste zuerst
    }));

    const spieltage = (result.Items || []).map(item => {
      const { PK, SK, entityType, ...spieltag } = item;
      return spieltag as Spieltag;
    });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ spieltage })
    };
  } catch (error) {
    console.error('Error listing spieltage:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to list spieltage' })
    };
  }
};

/**
 * GET /spieltage/{spieltagId} - Einzelnen Spieltag mit allen Spielen
 */
export const getSpieltag = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (getHttpMethod(event) === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const spieltagId = event.pathParameters?.spieltagId;
    if (!spieltagId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Missing spieltagId' })
      };
    }

    // Spieltag laden
    const spieltagResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `SPIELTAG#${spieltagId}`
      }
    }));

    if (!spieltagResult.Item) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Spieltag not found' })
      };
    }

    const { PK, SK, entityType, ...spieltag } = spieltagResult.Item;

    // Alle Spiele des Spieltags laden
    const gamesResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SPIELTAG#${spieltagId}`,
        ':sk': 'GAME#'
      },
      ScanIndexForward: true // Älteste zuerst (gameNumber aufsteigend)
    }));

    const games = (gamesResult.Items || []).map(item => {
      const { PK, SK, entityType, ...game } = item;
      return game as Game;
    });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        spieltag: spieltag as Spieltag,
        games
      })
    };
  } catch (error) {
    console.error('Error getting spieltag:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to get spieltag' })
    };
  }
};

/**
 * PUT /spieltage/{spieltagId}/complete - Spieltag abschließen
 */
export const completeSpieltag = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (getHttpMethod(event) === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const spieltagId = event.pathParameters?.spieltagId;
    if (!spieltagId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Missing spieltagId' })
      };
    }

    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `SPIELTAG#${spieltagId}`
      },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':updatedAt': new Date().toISOString()
      }
    }));

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Spieltag completed' })
    };
  } catch (error) {
    console.error('Error completing spieltag:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to complete spieltag' })
    };
  }
};
