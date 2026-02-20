import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Game, Spieltag, PlayerStats } from '../types/game';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.GAMES_TABLE || 'DokolatorGames';

// Helper: CORS Headers
const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
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
  return event.headers['x-user-id'] || 'default-user';
};

/**
 * GET /stats - Statistiken über alle Spieltage eines Users
 * 
 * Berechnet:
 * - Gesamtpunkte pro Spieler
 * - Gesamtgeld (Gewinn/Verlust)
 * - Durchschnittspunkte
 * - Anzahl Spieltage
 */
export const getStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    // Alle Spieltage des Users laden
    const spieltageResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'SPIELTAG#'
      }
    }));

    const spieltage = (spieltageResult.Items || []).map(item => {
      const { PK, SK, entityType, ...spieltag } = item;
      return spieltag as Spieltag;
    });

    // Für jeden Spieltag alle Spiele laden
    const allGames: Game[] = [];
    const spieltagMap = new Map<string, Spieltag>();

    for (const spieltag of spieltage) {
      spieltagMap.set(spieltag.spieltagId, spieltag);

      const gamesResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `SPIELTAG#${spieltag.spieltagId}`,
          ':sk': 'GAME#'
        }
      }));

      const games = (gamesResult.Items || []).map(item => {
        const { PK, SK, entityType, ...game } = item;
        return game as Game;
      });

      allGames.push(...games);
    }

    // Statistiken berechnen
    const statsMap = new Map<string, PlayerStats>();

    allGames.forEach(game => {
      const spieltag = spieltagMap.get(game.spieltagId);
      if (!spieltag) return;

      Object.entries(game.players).forEach(([playerName, playerData]) => {
        if (!statsMap.has(playerName)) {
          statsMap.set(playerName, {
            playerName,
            totalGames: 0,
            totalPoints: 0,
            totalMoney: 0,
            averagePoints: 0,
            spieltageCount: 0,
            lastPlayed: game.date
          });
        }

        const stats = statsMap.get(playerName)!;
        stats.totalGames++;
        stats.totalPoints += playerData.points;

        // Geldberechnung: Startgeld + (Punkte * Punktwert)
        // Aber nur für abgeschlossene Spieltage
        if (spieltag.status === 'completed') {
          const money = spieltag.startgeld + (playerData.points * spieltag.punktwert);
          stats.totalMoney += (money - spieltag.startgeld); // Nur Gewinn/Verlust
        }

        // Letztes Spieldatum aktualisieren
        if (new Date(game.date) > new Date(stats.lastPlayed)) {
          stats.lastPlayed = game.date;
        }
      });
    });

    // Spieltage pro Spieler zählen
    spieltage.forEach(spieltag => {
      spieltag.playerNames.forEach(playerName => {
        const stats = statsMap.get(playerName);
        if (stats) {
          stats.spieltageCount++;
        }
      });
    });

    // Durchschnitte berechnen
    statsMap.forEach(stats => {
      stats.averagePoints = stats.totalGames > 0 
        ? Math.round((stats.totalPoints / stats.totalGames) * 100) / 100 
        : 0;
    });

    // Nach totalPoints sortieren (beste zuerst)
    const sortedStats = Array.from(statsMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        stats: sortedStats,
        totalSpieltage: spieltage.length,
        totalGames: allGames.length,
        activeSpieltage: spieltage.filter(s => s.status === 'active').length,
        completedSpieltage: spieltage.filter(s => s.status === 'completed').length
      })
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to get stats' })
    };
  }
};

/**
 * GET /spieltage/{spieltagId}/stats - Statistiken für einen einzelnen Spieltag
 * 
 * Berechnet die Abrechnung wie im Frontend (Abrechnung.tsx)
 */
export const getSpieltagStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
    const spieltagResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': `SPIELTAG#${spieltagId}`
      }
    }));

    if (!spieltagResult.Items || spieltagResult.Items.length === 0) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Spieltag not found' })
      };
    }

    const { PK, SK, entityType, ...spieltag } = spieltagResult.Items[0];
    const spieltagData = spieltag as Spieltag;

    // Alle Spiele laden
    const gamesResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SPIELTAG#${spieltagId}`,
        ':sk': 'GAME#'
      }
    }));

    const games = (gamesResult.Items || []).map(item => {
      const { PK, SK, entityType, ...game } = item;
      return game as Game;
    });

    // Abrechnung berechnen (wie in Abrechnung.tsx)
    const finalScores: Record<string, { points: number; money: number; gewinnVerlust: number }> = {};

    // Alle Spieler sammeln
    const allPlayers = new Set<string>();
    games.forEach(game => {
      Object.keys(game.players).forEach(name => allPlayers.add(name));
    });

    // Für jeden Spieler Punkte summieren
    allPlayers.forEach(playerName => {
      const totalPoints = games.reduce((sum, game) => {
        return sum + (game.players[playerName]?.points || 0);
      }, 0);

      const money = spieltagData.startgeld + (totalPoints * spieltagData.punktwert);
      const gewinnVerlust = money - spieltagData.startgeld;

      finalScores[playerName] = {
        points: totalPoints,
        money: Math.round(money * 100) / 100,
        gewinnVerlust: Math.round(gewinnVerlust * 100) / 100
      };
    });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        spieltag: spieltagData,
        games,
        finalScores,
        totalGames: games.length
      })
    };
  } catch (error) {
    console.error('Error getting spieltag stats:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to get spieltag stats' })
    };
  }
};
