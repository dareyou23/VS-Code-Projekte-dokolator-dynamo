import { DynamoDBClient, CreateBackupCommand, ListBackupsCommand, DeleteBackupCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.GAMES_TABLE!;
const MAX_SPIELTAG_BACKUPS = 10;

type BackupType = 'temp' | 'spieltag';

export async function handler(event: any) {
  try {
    console.log('Backup triggered:', JSON.stringify(event));
    
    let backupType: BackupType;
    
    // Determine backup type based on trigger
    if (event.source === 'spieltag.created') {
      // New spieltag started: create permanent backup, delete all temp backups
      console.log('New spieltag started: creating permanent backup');
      backupType = 'spieltag';
      
      // Create permanent backup
      const backupName = `dokolator-spieltag-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      await client.send(new CreateBackupCommand({
        TableName: tableName,
        BackupName: backupName
      }));
      console.log('Permanent backup created:', backupName);
      
      // Delete all temporary backups
      await deleteAllTempBackups();
      
      // Keep only last 10 spieltag backups
      await cleanupSpieltagBackups();
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Spieltag backup created, temp backups deleted', backupName })
      };
    }
    else if (event.source === 'aws.events') {
      // Scheduled check every 2 hours
      const lastActivityTime = await getLastActivityTime();
      
      if (!lastActivityTime) {
        console.log('No activity found, skipping backup');
        return { statusCode: 200, body: 'No activity, backup skipped' };
      }
      
      const hoursSinceActivity = (Date.now() - new Date(lastActivityTime).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceActivity >= 3) {
        // 3+ hours of inactivity: create permanent backup, delete temp backups
        console.log(`${hoursSinceActivity.toFixed(1)}h inactivity: creating permanent backup`);
        backupType = 'spieltag';
        
        const backupName = `dokolator-spieltag-${new Date().toISOString().replace(/[:.]/g, '-')}`;
        await client.send(new CreateBackupCommand({
          TableName: tableName,
          BackupName: backupName
        }));
        console.log('Permanent backup created after inactivity:', backupName);
        
        // Delete all temporary backups
        await deleteAllTempBackups();
        
        // Keep only last 10 spieltag backups
        await cleanupSpieltagBackups();
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Spieltag backup created after inactivity', backupName })
        };
      }
      else if (hoursSinceActivity < 2) {
        // Recent activity (< 2h): create temporary backup
        console.log(`${hoursSinceActivity.toFixed(1)}h since activity: creating temp backup`);
        backupType = 'temp';
        
        const backupName = `dokolator-temp-${new Date().toISOString().replace(/[:.]/g, '-')}`;
        await client.send(new CreateBackupCommand({
          TableName: tableName,
          BackupName: backupName
        }));
        console.log('Temporary backup created:', backupName);
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Temporary backup created', backupName })
        };
      }
      else {
        // Between 2-3 hours: wait for 3h threshold
        console.log(`${hoursSinceActivity.toFixed(1)}h since activity: waiting for 3h threshold`);
        return { statusCode: 200, body: 'Waiting for 3h inactivity threshold' };
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Backup handler completed' })
    };
  } catch (error) {
    console.error('Backup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Backup failed' })
    };
  }
}

async function getLastActivityTime(): Promise<string | null> {
  // Check for most recent spieltag activity
  const result = await docClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': 'SPIELTAG'
    },
    ScanIndexForward: false, // Most recent first
    Limit: 1
  }));
  
  if (result.Items && result.Items.length > 0) {
    return result.Items[0].updatedAt || result.Items[0].createdAt || null;
  }
  
  return null;
}

async function deleteAllTempBackups(): Promise<void> {
  const backups = await client.send(new ListBackupsCommand({
    TableName: tableName,
    BackupType: 'USER'
  }));
  
  if (!backups.BackupSummaries) {
    return;
  }
  
  // Find all temp backups
  const tempBackups = backups.BackupSummaries.filter(b => 
    b.BackupName?.startsWith('dokolator-temp-')
  );
  
  // Delete all temp backups
  for (const backup of tempBackups) {
    if (backup.BackupArn) {
      await client.send(new DeleteBackupCommand({
        BackupArn: backup.BackupArn
      }));
      console.log('Deleted temp backup:', backup.BackupName);
    }
  }
}

async function cleanupSpieltagBackups(): Promise<void> {
  const backups = await client.send(new ListBackupsCommand({
    TableName: tableName,
    BackupType: 'USER'
  }));
  
  if (!backups.BackupSummaries) {
    return;
  }
  
  // Find all spieltag backups
  const spieltagBackups = backups.BackupSummaries
    .filter(b => b.BackupName?.startsWith('dokolator-spieltag-'))
    .sort((a, b) => (b.BackupCreationDateTime?.getTime() || 0) - (a.BackupCreationDateTime?.getTime() || 0)); // Newest first
  
  if (spieltagBackups.length <= MAX_SPIELTAG_BACKUPS) {
    return;
  }
  
  // Delete oldest spieltag backups (keep only 10 most recent)
  const toDelete = spieltagBackups.slice(MAX_SPIELTAG_BACKUPS);
  
  for (const backup of toDelete) {
    if (backup.BackupArn) {
      await client.send(new DeleteBackupCommand({
        BackupArn: backup.BackupArn
      }));
      console.log('Deleted old spieltag backup:', backup.BackupName);
    }
  }
}
