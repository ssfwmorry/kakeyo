package main // VS Code だとエラーがでるが、'go run main.go' で正常実行可能

import (
	"bufio"

	// "log"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

var (
  inputFiles []string= []string{"functions.md", "settings.md", "tables.md", "data.md"}
)

const (
    sortLabelTag = "-- migration-sort: "
    outputDir = "/migration/output"
    codeEnd = "```"
)

func main(){
    curDir, err := os.Getwd()
    if err != nil {
        panic(err)
    }
    // log.Print(dir)
    databaseDir := strings.TrimSuffix(curDir, "migration")
    nowComment := "-- now: " + time.Now().Format("2006-01-02 15:04") + "\n"

    for _, inputFile := range inputFiles {
      mdFile := databaseDir  + inputFile

      file, err := os.Open(mdFile)
      if err != nil {
        panic(err)
      }

      // ファイル読み取り
      queryMap := map[int]string{} // あとでソートするための、コードブロック内のクエリを格納
      querySortArr := []int{} // queryMap のソート順を格納
      inQuery := false
      query := ""
      num := 0
      scanner := bufio.NewScanner(file)
      for scanner.Scan() {
          line := scanner.Text()

          // strings.ToLower(line) == "```sql" では見ない
          if strings.HasPrefix(line, sortLabelTag) {
              inQuery = true

              numStr := strings.TrimPrefix(line, sortLabelTag)
              num, err = strconv.Atoi(numStr)
              if err != nil {
                  panic(err)
              }

              continue
          }

          if inQuery && line != codeEnd {
              query += line + "\n"
          }

          if line == codeEnd {
              queryMap[num] = query
              querySortArr = append(querySortArr, num)

              inQuery = false
              query = ""
          }
      }

      // 順序配列ソート
      sort.Slice(querySortArr, func(i, j int) bool {
        return querySortArr[i] < querySortArr[j]
      })

      // ファイル生成 (全部クエリを格納)
      queries := nowComment
      for _, val := range querySortArr {
          queries += sortLabelTag + strconv.Itoa(val) + "\n"
          queries += queryMap[val] + "\n"
      }

      outputFile := filepath.Join(databaseDir, outputDir, strings.TrimSuffix(inputFile, ".md") + ".sql")
      err = os.WriteFile(outputFile, []byte(queries), 0644)
      if err != nil {
          panic(err)
      }
    }
}
