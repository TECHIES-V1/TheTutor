#!/bin/bash

BASE_URL="http://localhost:8000"
echo "=================================="
echo "Health Check"
echo "=================================="
curl -s $BASE_URL/health
echo -e "\n\n"

echo "=================================="
echo "GET All Courses"
echo "=================================="
curl -s "$BASE_URL/course"
echo -e "\n\n"

echo "=================================="
echo "Start Conversation"
echo "=================================="
RES1=$(curl -s -X POST $BASE_URL/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to learn machine learning"}')
echo "$RES1"
echo -e "\n\n"

# Extract Conversation ID
CONV_ID=$(echo "$RES1" | grep -o '"conversationId":"[^"]*' | cut -d '"' -f 4)

if [ -n "$CONV_ID" ] && [ "$CONV_ID" != "null" ]; then
  echo "Extracted conversation ID: $CONV_ID"
else
  echo "Could not extract conversationId. Using a fake ID."
  CONV_ID="65a1b2c3d4e5f6g7h8i9j0k1"
fi

echo "=================================="
echo "Continue Existing Conversation"
echo "=================================="
curl -s -X POST $BASE_URL/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am a complete beginner",
    "conversationId": "'$CONV_ID'"
  }'
echo -e "\n\n"

echo "=================================="
echo "Get Active Conversation"
echo "=================================="
curl -s "$BASE_URL/chat/conversation"
echo -e "\n\n"

echo "=================================="
echo "Get Specific Conversation"
echo "=================================="
curl -s "$BASE_URL/chat/conversation/$CONV_ID"
echo -e "\n\n"

echo "=================================="
echo "Confirm Subject"
echo "=================================="
curl -s -X POST $BASE_URL/chat/confirm-subject \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "'$CONV_ID'",
    "confirmed": true
  }'
echo -e "\n\n"

echo "=================================="
echo "Generate Course (SSE Stream limit 10s)"
echo "=================================="
curl -s -m 10 -X POST $BASE_URL/course/generate \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"conversationId": "'$CONV_ID'"}'
echo -e "\n\n"

echo "=================================="
echo "Get Generation Status"
echo "=================================="
curl -s "$BASE_URL/course/generation-status/$CONV_ID"
echo -e "\n\n"

echo "=================================="
echo "Restart Conversation"
echo "=================================="
curl -s -X POST $BASE_URL/chat/restart \
  -H "Content-Type: application/json" \
  -d '{}'
echo -e "\n\n"

# Suppose we just want to fetch some course ID we can derive from list of courses
COURSE_ID=$(curl -s "$BASE_URL/course" | grep -o '"id":"[^"]*' | head -1 | cut -d '"' -f 4)

if [ -n "$COURSE_ID" ]; then
  echo "=================================="
  echo "Get Specific Course"
  echo "=================================="
  curl -s "$BASE_URL/course/$COURSE_ID"
  echo -e "\n\n"

  echo "=================================="
  echo "Update Course Progress"
  echo "=================================="
  LESSON_ID=$(curl -s "$BASE_URL/course/$COURSE_ID" | grep -o '"id":"[^"]*' | tail -n+2 | head -1 | cut -d '"' -f 4)
  if [ -n "$LESSON_ID" ]; then
    curl -s -X PUT $BASE_URL/course/$COURSE_ID/progress \
      -H "Content-Type: application/json" \
      -d '{
        "lessonId": "'$LESSON_ID'",
        "completed": true
      }'
    echo -e "\n\n"
  fi
fi

echo "=================================="
echo "Test Script Done."
echo "=================================="
