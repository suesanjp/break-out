# ブロック崩しゲーム

JavaScriptで実装されたブロック崩しゲームです。

<https://break-out-roo.netlify.app/>

## 特徴

- 4色のブロックとカラーマッチングシステム
- 3種類のパワーアップアイテム
- カスタマイズ可能な設定
  - ボールスピード調整
  - パドルの幅調整
  - 色の数調整

## 操作方法

- A/D: パドルを左右に移動
- スペース: ボールを発射
- K: パドルの色を変更

## アイテム

- 貫通弾: ブロックを貫通します(15秒間)
- スロー: バー付近でボール速度が0.7倍になります(15秒間)
- レインボー: どの色のボールでも跳ね返せます(15秒間)

## ゲームルール

1. 同じ色のボールのみパドルで跳ね返すことができます
2. ボールがブロックに当たると、そのブロックの色に変化します
3. ブロックを破壊すると、確率でアイテムが出現します
4. すべてのブロックを破壊するとクリアです
5. ボールを落とすとゲームオーバーです

## 技術仕様

- 純粋なJavaScript (ES6+)を使用
- Canvas APIでのレンダリング
- オブジェクト指向プログラミングによる実装
- Web Audio APIによる効果音

## 開発者向け情報

プロジェクトは以下のような構造で実装されています:

- `game.js`: メインのゲームロジック
  - Game: メインのゲームクラス
  - Ball: ボールの挙動を管理
  - Paddle: パドルの挙動を管理
  - Block: ブロックの状態を管理
  - Item: アイテムの挙動を管理
  - EffectManager: アイテム効果の管理
  - UIManager: 画面表示の管理
  - CollisionManager: 衝突判定の管理
- `index.html`: ゲームのHTML構造
- `style.css`: スタイリング