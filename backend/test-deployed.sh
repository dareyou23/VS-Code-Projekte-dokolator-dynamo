#!/bin/bash

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Deployed Lambda Functions ===${NC}\n"

# URLs aus dem CloudFormation Stack holen
CREATE_URL=$(aws cloudformation describe-stacks --stack-name dokolator-dynamo --query "Stacks[0].Outputs[?OutputKey=='CreateGameUrl'].OutputValue" --output text)
LIST_URL=$(aws cloudformation describe-stacks --stack-name dokolator-dynamo --query "Stacks[0].Outputs[?OutputKey=='ListGamesUrl'].OutputValue" --output text)
STATS_URL=$(aws cloudformation describe-stacks --stack-name dokolator-dynamo --query "Stacks[0].Outputs[?OutputKey=='GetStatsUrl'].OutputValue" --output text)

echo -e "${GREEN}1. Creating a test game...${NC}"
curl -X POST "$CREATE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "players": [
      {"name": "Alice", "score": 0},
      {"name": "Bob", "score": 0},
      {"name": "Charlie", "score": 0},
      {"name": "Diana", "score": 0}
    ],
    "rounds": [
      {"roundNumber": 1, "winner": ["Alice", "Bob"], "points": 2},
      {"roundNumber": 2, "winner": ["Charlie", "Diana"], "points": 2, "soloPlayer": "Charlie", "soloType": "Herz-Solo"}
    ],
    "finalScores": {
      "Alice": 2,
      "Bob": 2,
      "Charlie": 4,
      "Diana": 4
    }
  }'

echo -e "\n\n${GREEN}2. Listing all games...${NC}"
curl "$LIST_URL"

echo -e "\n\n${GREEN}3. Getting player statistics...${NC}"
curl "$STATS_URL"

echo -e "\n\n${BLUE}=== Tests completed ===${NC}"
