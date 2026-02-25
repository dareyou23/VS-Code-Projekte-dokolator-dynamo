import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';

export function getUserIdFromToken(event: APIGatewayProxyEvent): string | null {
  try {
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid Authorization header found');
      return null;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Return userId if available, otherwise use email as fallback
    return decoded.userId || decoded.email || null;
  } catch (error) {
    console.error('Error extracting userId from token:', error);
    return null;
  }
}
