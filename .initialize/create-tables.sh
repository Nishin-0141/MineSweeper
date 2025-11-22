#!/bin/bash

ENDPOINT="http://localhost:8000"

echo "🔧 Creating DynamoDB Tables in Local..."

##########################################
# 1. Users Table
##########################################
echo "➡️ Creating Users table..."

aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions \
      AttributeName=UserId,AttributeType=S \
  --key-schema \
      AttributeName=UserId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url $ENDPOINT

echo "✅ Users table created."


##########################################
# 2. Scores Table + GSI (TimeIndex)
##########################################
echo "➡️ Creating Scores table..."

aws dynamodb create-table \
  --table-name Scores \
  --attribute-definitions \
      AttributeName=UserId,AttributeType=S \
      AttributeName=Timestamp,AttributeType=N \
      AttributeName=Level,AttributeType=S \
      AttributeName=Time,AttributeType=N \
  --key-schema \
      AttributeName=UserId,KeyType=HASH \
      AttributeName=Timestamp,KeyType=RANGE \
  --global-secondary-indexes \
      '[
          {
              "IndexName": "TimeIndex",
              "KeySchema": [
                  {"AttributeName":"Level","KeyType":"HASH"},
                  {"AttributeName":"Time","KeyType":"RANGE"}
              ],
              "Projection": {"ProjectionType":"ALL"},
              "ProvisionedThroughput": {
                  "ReadCapacityUnits": 5,
                  "WriteCapacityUnits": 5
              }
          }
      ]' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url $ENDPOINT

echo "✅ Scores table created."

##########################################
# 3. List created tables
##########################################
echo "📋 Available Tables:"
aws dynamodb list-tables --endpoint-url $ENDPOINT

echo "🎉 All tables created successfully!"

echo "💡 Remember to set the DYNAMODB_ENDPOINT environment variable in your application:"
export DYNAMODB_ENDPOINT=http://localhost:8000