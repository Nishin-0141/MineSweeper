# Minesweeper Web Application – システム設計書

## 1. 概要
本アプリケーションは、Next.js をフロントエンド、Go による AWS Lambda（ZIP デプロイ）をバックエンドとして構築した Web ベースのマインスイーパーゲームである。  
ランキング機能を備え、クリアタイムを DynamoDB に保存し、フロントエンドから API を通じて取得する。

---

## 2. アーキテクチャ概要


- **フロントエンド**：Next.js（TypeScript）
- **API**：AWS Lambda（Go）
- **API公開**：API Gateway
- **データベース**：DynamoDB
- **デプロイ方式**：Go Lambda は ZIP デプロイ
- **ホスティング**：Vercel または Amplify（フロント）

---

## 3. リポジトリ構成（モノレポ）


---

## 4. フロントエンド設計（Next.js）

### 4.1 使用技術
- Next.js 14+
- TypeScript
- React Hooks
- fetch API によるバックエンド通信

### 4.2 API 通信例
```ts
export async function getRanking() {
  const res = await fetch(
    "https://{api-id}.execute-api.ap-northeast-1.amazonaws.com/prod/ranking"
  );
  return res.json();
}
```

## 5. バックエンド設計（Go Lambda）
### 5.1 ランタイム

* Go 1.x

### 5.2 ハンドラー構成

```bash
backend/cmd/ranking/main.go
```

### 5.3 ハンドラー例
```go
func handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    data := []Rank{
        {"Alice", 32},
        {"Bob", 45},
    }

    body, _ := json.Marshal(data)
    return events.APIGatewayProxyResponse{
        StatusCode: 200,
        Body:       string(body),
        Headers: map[string]string{
            "Access-Control-Allow-Origin": "*",
        },
    }, nil
}
```

## 6. DynamoDB 設計
### 6.1 テーブル名

MinesweeperRanking

### 6.2 キー構成
| キー種別 | 名称 | 型 |
| -- | -- | -- |
| パーティションキー | UserId | String |
| ソートキー | Time | Number |
### 6.3 GSI（任意）
| 名称 | キー | 説明 |
| -- | -- | -- |
| TimeIndex | Time | クリアタイムが速い順に取得 |
## 7. API Gateway 設計
### 7.1 リソース
| メソッド | パス | 説明 |
| GET | /ranking | ランキング取得API |
### 7.2 CORS
```makefile
Access-Control-Allow-Origin: *
```
## 8. CI/CD（ZIP デプロイ）構成
### 8.1 GitHub Actions の流れ

1. コード checkout
2. Go ビルド（GOOS=linux / GOARCH=amd64）
3. ZIP 化
4. AWS CLI による Lambda 更新
5. 成功時 Slack or GitHub Status 通知（任意）

### 8.2 例：GitHub Actions（lambda-deploy.yml）
```yaml
name: Deploy Lambda

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Build binary
        run: |
          cd backend/cmd/ranking
          GOOS=linux GOARCH=amd64 go build -o main main.go

      - name: Zip it
        run: |
          cd backend/cmd/ranking
          zip function.zip main

      - name: Deploy to Lambda
        run: |
          aws lambda update-function-code \
            --function-name minesweeper-ranking \
            --zip-file fileb://backend/cmd/ranking/function.zip
```

## 9. セキュリティ

* CORS 制限（実運用ではオリジンを限定）
* DynamoDB へのアクセス権は最小限
* Lambda → DynamoDB の IAM ロールを作成する
* 環境変数は Parameter Store or Secrets Manager へ格納

## 10. 費用
### 10.1 無料枠で収まる構成
サービス	無料枠	費用	備考
Lambda	月100万リクエスト	ほぼ無料	ZIP デプロイなので追加費用なし
API Gateway	100万 REST API コール	無料枠内	
DynamoDB	25GB / RCU/WCU 無料枠	無料	ランキング程度なら十分
GitHub Actions	2,000 分/月	無料	ZIP デプロイは軽い
Vercel	Hobby	無料	フロント公開用
結論

この構成は実質0円で運用可能。

## 11. まとめ
* フロント → Next.js、無料でデプロイ可能
* バックエンド → Go Lambda（ZIP デプロイでコスト最小）
* API Gateway → シンプルな構成で運用
* DynamoDB → 高速かつ無料枠充実
* CI/CD → GitHub Actions で自動デプロイ可能
* 個人開発や学習用途に最適なサーバレス構成
