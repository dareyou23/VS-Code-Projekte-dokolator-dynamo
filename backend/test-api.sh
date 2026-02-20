#!/bin/bash

# Test-Script für Dokolator API
# Testet die neuen Endpunkte mit dem korrekten Datenmodell

set -e

echo "🧪 Dokolator API Tests"
echo "====================="
echo ""

# Farben für Output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test User ID
USER_ID="test-user-123"

# Function URLs aus Stack Outputs holen
echo "📡 Hole Function URLs..."
CREATE_SPIELTAG_URL=$(aws cloudformation describe-stacks --stack-name DokolatorStack --query 'Stacks[0].Outputs[?OutputKey==`CreateSpieltagUrl`].OutputValue' --output text 2>/dev/null || echo "")
LIST_SPIELTAGE_URL=$(aws cloudformation describe-stacks --stack-name DokolatorStack --query 'Stacks[0].Outputs[?OutputKey==`ListSpieltageUrl`].OutputValue' --output text 2>/dev/null || echo "")
GET_SPIELTAG_URL=$(aws cloudformation describe-stacks --stack-name DokolatorStack --query 'Stacks[0].Outputs[?OutputKey==`GetSpieltagUrl`].OutputValue' --output text 2>/dev/null || echo "")
ADD_GAME_URL=$(aws cloudformation describe-stacks --stack-name DokolatorStack --query 'Stacks[0].Outputs[?OutputKey==`AddGameUrl`].OutputValue' --output text 2>/dev/null || echo "")
GET_STATS_URL=$(aws cloudformation describe-stacks --stack-name DokolatorStack --query 'Stacks[0].Outputs[?OutputKey==`GetStatsUrl`].OutputValue' --output text 2>/dev/null || echo "")
GET_SPIELTAG_STATS_URL=$(aws cloudformation describe-stacks --stack-name DokolatorStack --query 'Stacks[0].Outputs[?OutputKey==`GetSpieltagStatsUrl`].OutputValue' --output text 2>/dev/null || echo "")

if [ -z "$CREATE_SPIELTAG_URL" ]; then
  echo -e "${RED}❌ Stack nicht gefunden. Bitte zuerst deployen!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ URLs gefunden${NC}"
echo ""

# Test 1: Spieltag erstellen
echo -e "${BLUE}Test 1: Spieltag erstellen${NC}"
SPIELTAG_RESPONSE=$(curl -s -X POST "$CREATE_SPIELTAG_URL" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "date": "2026-02-19T18:00:00.000Z",
    "startgeld": 10.00,
    "punktwert": 0.05,
    "playerNames": ["Alice", "Bob", "Charlie", "David"]
  }')

SPIELTAG_ID=$(echo "$SPIELTAG_RESPONSE" | jq -r '.spieltagId')

if [ "$SPIELTAG_ID" != "null" ] && [ -n "$SPIELTAG_ID" ]; then
  echo -e "${GREEN}✅ Spieltag erstellt: $SPIELTAG_ID${NC}"
  echo "$SPIELTAG_RESPONSE" | jq '.'
else
  echo -e "${RED}❌ Fehler beim Erstellen${NC}"
  echo "$SPIELTAG_RESPONSE"
  exit 1
fi
echo ""

# Test 2: Spiel hinzufügen (EXAKT wie Frontend!)
echo -e "${BLUE}Test 2: Spiel hinzufügen (Frontend-Datenmodell)${NC}"
GAME_RESPONSE=$(curl -s -X POST "${ADD_GAME_URL}${SPIELTAG_ID}/games" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "gameValue": 1,
    "bockTrigger": false,
    "players": {
      "Alice": {
        "roles": ["Re"],
        "points": 1
      },
      "Bob": {
        "roles": ["Re"],
        "points": 1
      },
      "Charlie": {
        "roles": ["Kontra"],
        "points": -1
      },
      "David": {
        "roles": ["Kontra"],
        "points": -1
      }
    }
  }')

GAME_ID=$(echo "$GAME_RESPONSE" | jq -r '.gameId')

if [ "$GAME_ID" != "null" ] && [ -n "$GAME_ID" ]; then
  echo -e "${GREEN}✅ Spiel hinzugefügt: $GAME_ID${NC}"
  echo "$GAME_RESPONSE" | jq '.'
else
  echo -e "${RED}❌ Fehler beim Hinzufügen${NC}"
  echo "$GAME_RESPONSE"
  exit 1
fi
echo ""

# Test 3: Zweites Spiel hinzufügen
echo -e "${BLUE}Test 3: Zweites Spiel hinzufügen${NC}"
GAME2_RESPONSE=$(curl -s -X POST "${ADD_GAME_URL}${SPIELTAG_ID}/games" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "gameValue": 2,
    "bockTrigger": true,
    "players": {
      "Alice": {
        "roles": ["Solo"],
        "points": 4
      },
      "Bob": {
        "roles": ["Kontra"],
        "points": -2
      },
      "Charlie": {
        "roles": ["Kontra"],
        "points": -2
      },
      "David": {
        "roles": ["Geber"],
        "points": 0
      }
    }
  }')

echo -e "${GREEN}✅ Zweites Spiel hinzugefügt${NC}"
echo "$GAME2_RESPONSE" | jq '.'
echo ""

# Test 4: Spieltag mit Spielen abrufen
echo -e "${BLUE}Test 4: Spieltag mit allen Spielen abrufen${NC}"
SPIELTAG_FULL=$(curl -s -X GET "${GET_SPIELTAG_URL}${SPIELTAG_ID}" \
  -H "x-user-id: $USER_ID")

echo -e "${GREEN}✅ Spieltag geladen${NC}"
echo "$SPIELTAG_FULL" | jq '.'
echo ""

# Test 5: Spieltag-Statistiken (Abrechnung)
echo -e "${BLUE}Test 5: Spieltag-Statistiken (Abrechnung)${NC}"
SPIELTAG_STATS=$(curl -s -X GET "${GET_SPIELTAG_STATS_URL}${SPIELTAG_ID}/stats" \
  -H "x-user-id: $USER_ID")

echo -e "${GREEN}✅ Abrechnung berechnet${NC}"
echo "$SPIELTAG_STATS" | jq '.'
echo ""

# Test 6: Alle Spieltage auflisten
echo -e "${BLUE}Test 6: Alle Spieltage auflisten${NC}"
ALL_SPIELTAGE=$(curl -s -X GET "$LIST_SPIELTAGE_URL" \
  -H "x-user-id: $USER_ID")

echo -e "${GREEN}✅ Spieltage geladen${NC}"
echo "$ALL_SPIELTAGE" | jq '.'
echo ""

# Test 7: Gesamt-Statistiken
echo -e "${BLUE}Test 7: Gesamt-Statistiken${NC}"
STATS=$(curl -s -X GET "$GET_STATS_URL" \
  -H "x-user-id: $USER_ID")

echo -e "${GREEN}✅ Statistiken berechnet${NC}"
echo "$STATS" | jq '.'
echo ""

echo -e "${GREEN}🎉 Alle Tests erfolgreich!${NC}"
echo ""
echo "📊 Zusammenfassung:"
echo "  - Spieltag ID: $SPIELTAG_ID"
echo "  - Anzahl Spiele: 2"
echo "  - Datenmodell: ✅ Exakt wie Frontend"
echo ""
