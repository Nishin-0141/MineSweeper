## ディレクトリ構成（モノリポジトリ）
```
/minesweeper-app
├── frontend/            # Next.js
│   ├── pages/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/             # Go Lambda
│   ├── cmd/
│   │   └── ranking/     # Lambda ハンドラーごとに分ける
│   │       └── main.go
│   ├── internal/        # Go のロジックをここにまとめる
│   │   ├── db/
│   │   └── ranking/
│   ├── go.mod
│   └── go.sum
│
├── infra/               # Terraform / CDK / SAM / CloudFormation
│   ├── cdk/             # AWS CDK を使う場合
│   ├── sam/             # SAM を使う場合
│   └── terraform/       # Terraform ならここ
│
├── docs/                # 設計書・構成図など（任意）
│
├── .gitignore
├── README.md
└── LICENSE
```

## 🚀 Next.js（フロント）＋ Go Lambda（バックエンド）＋ DynamoDB
構築手順（画像なし版）
### 🧱 Step 1：フロントエンド準備（Next.js）
1. Next.js プロジェクトを作成
```
npx create-next-app@latest minesweeper
cd minesweeper
```

2. TypeScript を有効化（未設定なら）
```
touch tsconfig.json
npm install --save-dev typescript @types/react @types/node
```

3. ゲーム画面（/pages/index.tsx）を作る

後で API を叩くため、以下のような最低限の fetch() も用意する。
```
useEffect(() => {
  fetch("https://YOUR_API_ID.execute-api.ap-northeast-1.amazonaws.com/prod/ranking")
    .then(r => r.json())
    .then(setRanking);
}, []);
```

### 🧱 Step 2：バックエンド（Go）Lambda を作る
1. Go モジュール作成
```
mkdir backend
cd backend
go mod init minesweeper-api
```

2. Lambda Handler を作る（例：ランキング取得）
```
main.go

package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Rank struct {
	Name string `json:"name"`
	Time int    `json:"time"`
}

func handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	data := []Rank{
		{"Alice", 32},
		{"Bob", 45},
	}

	body, _ := json.Marshal(data)

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(body),
		Headers:    map[string]string{"Access-Control-Allow-Origin": "*"},
	}, nil
}

func main() {
	lambda.Start(handler)
}
```

### 🧱 Step 3：Go Lambda をデプロイ
1. GOOS/GOARCH を Lambda 用に変更してビルド
```
GOOS=linux GOARCH=amd64 go build -o main main.go
```

2. ZIP に圧縮
```
zip function.zip main
```

3. AWS Console → Lambda → 関数作成

ランタイム：Go

アーキテクチャ：x86_64

コードアップロード：zip をアップロード

### 🧱 Step 4：DynamoDB（ランキングテーブル）作成
テーブル設計（例）

テーブル名：MinesweeperRanking

パーティションキー：UserId（String）

ソートキー：Time（Number）

※ 上位10件だけ取りたいので、後で GSI を作るのもアリ

GSI：TimeIndex（Time をキーにして昇順）

### 🧱 Step 5：API Gateway を作成し Lambda を公開
1. API Gateway → REST API → 新規作成

リソース /ranking

メソッド：GET

Lambda 関数を紐づける

2. CORS 有効化
3. API をデプロイする

ステージ名：prod

4. URL 取得
```
https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/ranking
```

### 🧱 Step 6：Next.js から API を叩く
```
const res = await fetch("https://xxxxx.amazonaws.com/prod/ranking");
const data = await res.json();
```

### 🧱 Step 7：Next.js を無料で公開（Vercel）
1. GitHub に push
```
git remote add origin https://github.com/you/minesweeper.git
git push -u origin main
```

2. Vercel にログイン
```
https://vercel.com
```

3. "Import Project" → GitHub から読み込む

→ 自動的にビルド・デプロイされる
→ 無料で公開完了

```
cd backend/cmd/ranking
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
```