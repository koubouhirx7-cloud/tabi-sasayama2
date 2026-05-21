<?php
mb_language("Japanese");
mb_internal_encoding("UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: contact.html");
    exit;
}

function h($str) {
    if ($str === null) return '';
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

$name    = h($_POST['name'] ?? '');
$kana    = h($_POST['kana'] ?? '');
$tel     = h($_POST['tel'] ?? '');
$email   = h($_POST['email'] ?? '');
// メールヘッダインジェクション対策（改行コードの除去）
$email   = str_replace(array("\r", "\n"), '', $email);
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("エラー：不正なメールアドレス形式です。ブラウザの「戻る」ボタンで前の画面に戻り、正しいメールアドレスを入力してください。");
}
$purpose = isset($_POST['purpose']) ? implode('、', array_map('h', (array)$_POST['purpose'])) : '';
$date    = h($_POST['date'] ?? '');
$people  = h($_POST['people'] ?? '');
$budget  = h($_POST['budget'] ?? '');
$message = h($_POST['message'] ?? '');

$to      = "tour@withsasayama.jp";
$subject = "【ウイズささやま】Webサイトからのお問い合わせ";

$body  = "Webサイトのお問い合わせフォームより、以下の内容でご連絡がありました。\n\n";
$body .= "■ お名前\n{$name} ({$kana})\n\n";
$body .= "■ 電話番号\n{$tel}\n\n";
$body .= "■ メールアドレス\n{$email}\n\n";
$body .= "■ ご希望の体験内容\n" . ($purpose ?: '未選択') . "\n\n";
$body .= "■ 希望日程 / 時期\n" . ($date ?: '未入力') . "\n\n";
$body .= "■ 想定人数\n" . ($people ?: '未入力') . "\n\n";
$body .= "■ ご予算（お一人様）\n" . ($budget ?: '未選択') . "\n\n";
$body .= "■ 自由記入・その他ご要望\n{$message}\n\n";
$body .= "--------------------------------------------------------\n";
$body .= "送信元IPアドレス: {$_SERVER['REMOTE_ADDR']}\n";
$body .= "--------------------------------------------------------\n";

$headers  = "From: " . mb_encode_mimeheader("ウイズささやま Webサイト") . " <info@withsasayama.jp>\r\n";
$headers .= "Reply-To: {$email}\r\n";

$is_success = mb_send_mail($to, $subject, $body, $headers);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>送信結果 | 一般社団法人ウイズささやま</title>
<link rel="stylesheet" href="./style.css">
<style>
  body { background: var(--color-background, #f8f7f5); font-family: var(--font-base, sans-serif); margin: 0; padding: 0; }
  .thanks-container { max-width: 600px; margin: 10vh auto; background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #eaeaea; }
  .thanks-title { color: var(--color-primary, #5a7e5a); font-family: var(--font-display, serif); font-size: 1.5rem; margin-bottom: 20px; border-bottom: 2px solid var(--color-primary, #5a7e5a); padding-bottom: 15px; display: inline-block; }
  .error-title { color: #e74c3c; font-size: 1.5rem; margin-bottom: 20px; }
  .desc { color: #555; line-height: 1.8; margin-bottom: 30px; }
  .btn-primary { display: inline-block; background: var(--color-primary, #5a7e5a); color: white; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; }
</style>
</head>
<body>
  <div class="thanks-container">
    <?php if ($is_success): ?>
      <h2 class="thanks-title">送信が完了いたしました</h2>
      <p class="desc">
        お問い合わせいただき、誠にありがとうございます。<br>
        ご入力いただいた内容を確認のうえ、担当者より折り返しご連絡いたします。<br>
        今しばらくお待ちくださいませ。
      </p>
    <?php else: ?>
      <h2 class="error-title">送信に失敗しました</h2>
      <p class="desc">
        申し訳ございません。システムエラーにより送信できませんでした。<br>
        直接 <strong>tour@withsasayama.jp</strong> までご連絡ください。
      </p>
    <?php endif; ?>
    <a href="index.html" class="btn-primary">トップページへ戻る</a>
  </div>
</body>
</html>
