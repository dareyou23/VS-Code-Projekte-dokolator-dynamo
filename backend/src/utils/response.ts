import { APIGatewayProxyResult } from 'aws-lambda';

const getCorsHeaders = () => {
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'false',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
};

export function successResponse(data: any, statusCode: number = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify({ success: true, data }),
  };
}

export function errorResponse(error: string, statusCode: number = 400): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify({ success: false, error }),
  };
}
