package db

import (
	"context"
	"net/url"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	transport "github.com/aws/smithy-go/endpoints"
)

// endpointResolverV2 は dynamodb の EndpointResolverV2 インターフェースを満たす実装です。
// パッケージスコープで定義する必要があります（メソッドは関数外で定義するため）。
type endpointResolverV2 struct{ url string }

func (r endpointResolverV2) ResolveEndpoint(ctx context.Context, params dynamodb.EndpointParameters) (transport.Endpoint, error) {
	u, err := url.Parse(r.url)
	if err != nil {
		return transport.Endpoint{}, err
	}
	return transport.Endpoint{URI: *u}, nil
}

// DynamoDB クライアントを返す
func NewDynamoClient(ctx context.Context) (*dynamodb.Client, error) {

	// 環境変数でローカル or 本番を切り替え
	endpoint := os.Getenv("DYNAMODB_ENDPOINT")

	// ローカル DynamoDB を使う場合はカスタムエンドポイントとダミー認証情報を使って
	// cfg を作成する（ローカル環境向けの簡易設定）。
	if endpoint != "" {
		cfg, err := config.LoadDefaultConfig(ctx,
			config.WithRegion("ap-northeast-1"),
			config.WithCredentialsProvider(
				aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
					return aws.Credentials{
						AccessKeyID:     "dummy",
						SecretAccessKey: "dummy",
						SessionToken:    "",
						Source:          "LocalDynamoDB",
					}, nil
				}),
			),
		)
		if err != nil {
			return nil, err
		}

		// EndpointResolverV2 の実装を渡すことで非推奨のグローバル設定を避ける
		client := dynamodb.NewFromConfig(cfg, func(o *dynamodb.Options) {
			o.EndpointResolverV2 = endpointResolverV2{url: endpoint}
		})
		return client, nil
	}

	// デフォルト（AWS 環境）の設定をロード
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}
	return dynamodb.NewFromConfig(cfg), nil
}
