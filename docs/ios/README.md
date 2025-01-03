# iOS アプリ開発

## 概要

WebView を用いる。

以下では単純な表示のみであるが、以下が必要そう。

- 上部からのスワイプにより、ページリロードを行う(TODO)

## XCode プロジェクト設定

1. [App] の雛形で作成
2. 以下記事を参考に、 _{プロジェクト名}.xcodeproj_ の `Framework` に `WebKit` を追加
   1. [https://mo-gu-mo-gu.com/ios-wkwebview-tutorial/](https://mo-gu-mo-gu.com/ios-wkwebview-tutorial/)
3. _ContentView.swift_ を編集

   ```swift
    import SwiftUI

    var urlString = "https://ssfwmorry-kakeibo.web.app"
    struct ContentView: View {
        var body: some View {
            WebView(urlString: urlString).onAppear {
                print("appear")
            }.onDisappear {
                print("disapper")
            }
        }
    }

    struct ContentView_Previews: PreviewProvider {
        static var previews: some View {
            ContentView()
        }
    }
   ```

4. _ContentView.swift_ と同階層に _WebView.swift_ を追加し、以下を記載

   ```swift
   import SwiftUI
   import WebKit
   struct WebView: UIViewRepresentable {
       var urlString: String
       func makeUIView(context: Context) -> WKWebView {
           let config = WKWebViewConfiguration()
           return WKWebView(frame: .zero, configuration: config)
       }
       func updateUIView(_ uiView: WKWebView, context: Context) {
           guard let url = URL(string: urlString) else {
               return
           }
           uiView.load(URLRequest(url: url))
       }
   }
   ```
