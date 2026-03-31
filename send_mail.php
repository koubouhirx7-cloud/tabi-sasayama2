<?php
// 文字化け対策
mb_language("Japanese");
mb_internal_encoding("UTF-8");

// POSTリクエストかどうかチェック
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    // 不正アクセス時はトップへリダイレクト
    header("Location: index.html");
    exit;
}

// ロボットチェック（チェックが入っていない場合はエラーで止める）
if (empty($_POST['not_a_robot']) || $_POST['not_a_robot'] !== 'yes') {
    die("スパム判定エラー：チェックボックスが選択されていません。ブラウザの「戻る」ボタンで前の画面に戻り、チェックを入れてから再度送信してください。");
}

// フォームデータの受け取りとエスケープ（XSS対策）
function h($str) {
    if ($str === null) return '';
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

$name     = h($_POST['name'] ?? '');
$kana     = h($_POST['kana'] ?? '');
$tel      = h($_POST['tel'] ?? '');
$email    = h($_POST['email'] ?? '');
$date1    = h($_POST['date1'] ?? '');
$date2    = h($_POST['date2'] ?? '');
$duration = h($_POST['duration'] ?? '');
$people   = h($_POST['people'] ?? '');
$budget   = h($_POST['budget'] ?? '');
$message  = h($_POST['message'] ?? '');

// ===== メールの送信設定 =====
// 宛先メールアドレス（要件通り設定）
$to = "tour@withsasayama.jp";

// メールの件名
$subject = "【ウイズささやま】Webサイトからのお問い合わせ（カスタマイズ相談）";

// メールの本文（管理者が受け取る内容）
$body = "Webサイトのカスタマイズ相談フォームより、以下の内容でお問い合わせがありました。\n\n";
$body .= "■ お名前\n{$name} ({$kana})\n\n";
$body .= "■ 電話番号\n{$tel}\n\n";
$body .= "■ メールアドレス\n{$email}\n\n";
$body .= "■ 第1希望日\n{$date1}\n\n";
$body .= "■ 第2希望日\n{$date2}\n\n";
$body .= "■ 所要時間\n{$duration}\n\n";
$body .= "■ 想定人数\n{$people}\n\n";
$body .= "■ ご予算\n{$budget}\n\n";
$body .= "■ その他ご要望\n{$message}\n\n";
$body .= "--------------------------------------------------------\n";
$body .= "送信元IPアドレス: {$_SERVER['REMOTE_ADDR']}\n";
$body .= "--------------------------------------------------------\n";

// メールヘッダー設定
// ※サーバーのスパム規制を避けるため、Fromはサイトのドメインのアドレスに設定
$headers = "From: " . mb_encode_mimeheader("ウイズささやま Webサイト") ." <info@withsasayama.jp>\r\n";
// 返信先（Reply-To）をお客様のメールアドレスに設定することで、返信ボタンで直接お客様へ返信可能になります
$headers .= "Reply-To: {$email}\r\n";

// 送信実行
$is_success = mb_send_mail($to, $subject, $body, $headers);

?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>送信結果 | 一般社団法人ウイズささやま</title>
<!-- 既存のCSSを読み込む -->
<link rel="stylesheet" href="./style.css">
<style>
  body {
    background: var(--color-background, #f8f7f5);
    font-family: var(--font-base, 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif);
    margin: 0;
    padding: 0;
  }
  .thanks-container {
    max-width: 600px;
    margin: 10vh auto;
    background: white;
    padding: 40px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid #eaeaea;
  }
  .thanks-title {
    color: var(--color-primary, #5a7e5a);
    font-family: var(--font-display, serif);
    font-size: 1.5rem;
    margin-bottom: 20px;
    border-bottom: 2px solid var(--color-primary, #5a7e5a);
    padding-bottom: 15px;
    display: inline-block;
  }
  .error-title {
    color: #e74c3c;
    font-family: var(--font-display, serif);
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
  .desc {
    color: #555;
    line-height: 1.8;
    margin-bottom: 30px;
  }
  .btn-primary {
    display: inline-block;
    background: var(--color-primary, #5a7e5a);
    color: white;
    padding: 15px 40px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: bold;
    transition: 0.3s;
  }
  .btn-primary:hover {
    background: #466646;
  }
</style>
</head>
<body>
  <div class="thanks-container">
    <?php if($is_success): ?>
        <h2 class="thanks-title">送信が完了いたしました</h2>
        <p class="desc">
            お問い合わせいただき、誠にありがとうございます。<br>
            ご入力いただいた内容を確認のうえ、担当者（tour@withsasayama.jp）より<br>
            折り返しご連絡させていただきます。<br>
            今しばらくお待ちくださいませ。
        </p>
    <?php else: ?>
        <h2 class="error-title">送信に失敗しました</h2>
        <p class="desc">
            申し訳ございません。システムエラーにより正常に送信できませんでした。<br>
            お手数ですが、しばらく経ってから再度お試しいただくか、<br>
            直接お電話や手動メール（tour@withsasayama.jp）にてお問い合わせください。
        </p>
    <?php endif; ?>
    <div>
        <a href="index.html" class="btn-primary">トップページへ戻る</a>
    </div>
  </div>
</body>
</html>
