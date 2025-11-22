package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"minesweeper-backend/internal/db"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func main() {
	ctx := context.TODO()

	client, err := db.NewDynamoClient(ctx)
	if err != nil {
		log.Fatal("DynamoDB client error:", err)
	}

	// PutItem テスト（Users テーブル）
	item := map[string]types.AttributeValue{
		"UserId":      &types.AttributeValueMemberS{Value: "test-user-001"},
		"DisplayName": &types.AttributeValueMemberS{Value: "Tester"},
		"CreatedAt":   &types.AttributeValueMemberS{Value: time.Now().UTC().Format(time.RFC3339)},
	}

	_, err = client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: awsString("Users"),
		Item:      item,
	})

	if err != nil {
		log.Fatal("PutItem error:", err)
	}

	jsonData, _ := json.MarshalIndent(item, "", "  ")
	fmt.Println("PutItem Successful:", string(jsonData))
}

func awsString(s string) *string {
	return &s
}
