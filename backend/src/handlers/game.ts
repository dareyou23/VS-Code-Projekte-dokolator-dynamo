import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Game } from '../types/game';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.GAMES_TABLE || 'DokolatorGames';

// Helper: CORS Headers
const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-user-id',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

// Helper: Handle OPTIONS
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
  return event.headers['x-user-id'] || event.headers['X-User-Id'] || 'default-user';
};

/**
 * POST /spieltage/{spieltagId}/games - Spiel zu Spieltag hinzufügen
 * 
 * Body entspricht EXAKT dem Frontend-Datenmodell:
 * {
 *   gameValue: number,
 *   bockTrigger: boolean,
 *   players: {
 *     "Alice": { roles: ["Re"], points: 1 },
 *     "Bob": { roles: ["Kontra"], points: -1 }
 *   }
 * }
 */
export const addGame = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    const body = JSON.parse(event.body || '{}');

    // Validierung
    if (!body.players || typeof body.players !== 'object') {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Invalid players data' })
      };
    }

    if (typeof body.gameValue !== 'number') {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Invalid gameValue' })
      };
    }

    // Anzahl der Spiele im Spieltag ermitteln (für gameNumber)
    // ABER: Wenn gameNumber im Body übergeben wird (z.B. für Hochzeit), verwenden wir diese
    let gameNumber: number;
    
    if (body.gameNumber && typeof body.gameNumber === 'number') {
      // Manuelle gameNumber (z.B. für Hochzeit-Zeile 2)
      gameNumber = body.gameNumber;
    } else {
      // Automatische gameNumber: Höchste vorhandene gameNumber + 1
      const existingGames = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `SPIELTAG#${spieltagId}`,
          ':sk': 'GAME#'
        }
      }));
      
      // Höchste gameNumber finden
      const maxGameNumber = (existingGames.Items || []).reduce((max, item) => {
        return Math.max(max, item.gameNumber || 0);
      }, 0);
      
      gameNumber = maxGameNumber + 1;
    }

    // Game-Objekt erstellen (EXAKT wie Frontend-Datenmodell)
    const game: Game = {
      gameId: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      spieltagId,
      gameNumber,
      gameValue: body.gameValue,
      bockTrigger: body.bockTrigger || false,
      players: body.players, // DIREKT übernehmen, KEINE Transformation!
      hochzeitPhase: body.hochzeitPhase, // Optional: 'suche', 'mit_partner', 'solo'
      date: new Date().toISOString(),
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In DynamoDB speichern
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `SPIELTAG#${spieltagId}`,
        SK: `GAME#${game.gameId}`,
        ...game,
        entityType: 'GAME'
      }
    }));

    return {
      statusCode: 201,
      headers: responseHeaders,
      body: JSON.stringify(game)
    };
  } catch (error) {
    console.error('Error adding game:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to add game' })
    };
  }
};

/**
 * GET /spieltage/{spieltagId}/games - Alle Spiele eines Spieltags
 */
export const listGames = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SPIELTAG#${spieltagId}`,
        ':sk': 'GAME#'
      },
      ScanIndexForward: true // Älteste zuerst (gameNumber aufsteigend)
    }));

    const games = (result.Items || []).map(item => {
      const { PK, SK, entityType, ...game } = item;
      return game as Game;
    });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ games })
    };
  } catch (error) {
    console.error('Error listing games:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to list games' })
    };
  }
};
