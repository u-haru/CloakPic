# CloakPic

黒背景と白背景での見え方の差を利用して、Twitter/Xのタイムラインではマスクだけ、画像ビューアで開くと本体が見えるPNGを作るローカルツール。
処理はすべてブラウザ内で完結し、マスク画像や設定はローカルストレージに保存される。

## 使い方

1. [https://u-haru.github.io/CloakPic/](https://u-haru.github.io/CloakPic/)にアクセスする。
2. マスクしたい画像をアップロードする（PNG/JPG）。
3. 必要ならマスク画像を変更する（未設定なら自動生成マスクを使用）。
4. カスタマイズを調整する（任意）。
5. プレビューを確認して保存する（PNGで出力）。

## カスタマイズ項目

- マスク画像の変更  
  マスク画像をアップロードして差し替え可能。未設定の場合は自動生成マスクを使用する。
- グレイスケール変換  
  変換後の画像をグレイスケールにする（デフォルトで有効）。
- 解像度制限  
  変換後の最大幅・高さを指定できる（デフォルト864px）。スイッチで有効/無効を切り替える。
- マスク強度  
  マスクの明るさの反映度合いを調整する。低いほど白背景で薄く、高いほどマスクがくっきり出る。

マスク画像は元画像のサイズに合わせてアスペクト比を維持したまま拡大・縮小され、全体を覆うように描画される（`object-fit: cover`相当）。

## ソフトウェア構成

- フロントエンド: React Router + React + TypeScript + Vite
- 画像処理: HTML5 Canvas API
- スタイリング: Material UI (MUI)
- 状態管理: React hooks + localStorage
- テスト: Vitest
- デプロイ: GitHub Pages（.github/workflows/ci.yml）

## 型チェック

型チェックはTypeScriptによって行われる。`npm run typecheck`で`react-router typegen`と`tsc`が実行される。

## テスト

`test_data/`にサンプル画像があり、`tests/`でマスク処理のユニットテストを行う。
`npm test`でVitestが動作する。
