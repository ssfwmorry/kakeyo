# マイグレーションの生成方法

- md ファイルの中にあるクエリが抽出される
- `-- migration-sort: N` の N 順番に従って、`output/{filename}.sql` に自動生成する
- 実行コマンドは以下
  ```bash
  go run ./main.go
  ```
