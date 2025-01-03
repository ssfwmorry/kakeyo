# Android アプリ開発

## 概要

WebView を用いる。

以下では単純な表示のみであるが、以下が必要そう。

- 上部からのスワイプにより、ページリロードを行う

## Android Studio プロジェクト設定

1. [Empty Activity] の雛形で作成
2. _activity_main.xml_ を作成
   1. `/app/src/main/res/layout` を作成する
   2. 作ったディレクトリ内に [File] → [New] → [XML] → [Layout XML File] にて、[Layout File Name] を 「activity_main」、 [Root Tag] を 「LinearLayout」 とする
3. _activity_main.xml_ を編集
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
       android:layout_width="match_parent"
       android:layout_height="match_parent">
       <WebView
           android:id="@+id/webView"
           android:layout_width="match_parent"
           android:layout_height="match_parent"/>
   </LinearLayout>
   ```
4. `/app/src/java/{ドットつなぎのプロジェクト名}` 内 _MainActivity.kt_ を編集

   ```kotlin
   class MainActivity : ComponentActivity() {
       override fun onCreate(savedInstanceState: Bundle?) {
           super.onCreate(savedInstanceState)
           setContentView(R.layout.activity_main)

           var webView: WebView = findViewById<View>(R.id.webView) as WebView;
           webView.settings.javaScriptEnabled = true;
           webView.settings.domStorageEnabled = true; // 不要かも
           webView.loadUrl("https://ssfwmorry-kakeibo.web.app/");
           webView.requestFocus();
       }
   }
   ```

5. `/app/src/main/` 内 _AndroidManifest.xml_ を編集
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <manifest xmlns:android="http://schemas.android.com/apk/res/android"
       xmlns:tools="http://schemas.android.com/tools">
       <uses-permission android:name="android.permission.INTERNET"/>
       <application
           android:allowBackup="true"
           android:dataExtractionRules="@xml/data_extraction_rules"
           android:fullBackupContent="@xml/backup_rules"
           android:icon="@mipmap/ic_launcher"
           android:label="@string/app_name"
           android:roundIcon="@mipmap/ic_launcher_round"
           android:supportsRtl="true"
           android:theme="@style/Theme.KakeboApp"
           tools:targetApi="31">
           <activity
               android:name=".MainActivity"
               android:exported="true"
               android:label="@string/app_name"
               android:theme="@style/Theme.KakeboApp">
               <intent-filter>
                   <action android:name="android.intent.action.MAIN" />
                   <category android:name="android.intent.category.LAUNCHER" />
               </intent-filter>
           </activity>
       </application>
   </manifest>
   ```

## デバッグ

[Chrome の機能](chrome://inspect/#devices) を使う

## 実機インストール

APK ファイルを作成し、実機にインストールした。手順は以下。

- [Build] → [Generate Signed Bundle or APK] → [APK]
- [Key store path] では、[Create new key] を選択。パスワードは全て「111111」とし、[Certificate](どれか一つは必ず必要らしい)は[Countory Code] を「JP」とした
- その後 APK ファイルを生成し、ドラックアンドドロップとかで、実機に移動させる
- 実機では、APK ファイルを実行?(ファイルマネージャーソフトなどで)するとインストールが始まる
