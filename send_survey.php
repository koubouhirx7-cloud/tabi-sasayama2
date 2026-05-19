<?php
// 文字化け対策
mb_language("Japanese");
mb_internal_encoding("UTF-8");

// POST以外のアクセスはトップへ
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: survey.html");
    exit;
}

// スパムチェック
if (empty($_POST['not_a_robot']) || $_POST['not_a_robot'] !== 'yes') {
    die("スパム判定エラー。ブラウザの「戻る」ボタンで前の画面に戻り、チェックを入れてから再度送信してください。");
}

// フォームデータ受け取りとエスケープ
function h($str) {
    if ($str === null) return '';
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

$age          = h($_POST['age'] ?? '');
$gender       = h($_POST['gender'] ?? '');
$from_origin  = h($_POST['from_origin'] ?? '');
$stay_program = h($_POST['stay_program'] ?? '');
$purpose      = h($_POST['purpose'] ?? '');
$comment      = h($_POST['comment'] ?? '');

// 必須バリデーション
if (!$age || !$gender || !$from_origin || !$stay_program || !$purpose || !$comment) {
    die("必須項目が未入力です。ブラウザの「戻る」ボタンで前の画面に戻り、すべての項目を入力してください。");
}

// ===== 送信先メールアドレス =====
$to = "tour@withsasayama.jp";

// 件名
$subject = "【旅のアンケート】" . $from_origin . "・" . $age . "・" . $gender;

// 本文
$body  = "ウイズささやまの旅アンケートが届きました。\n";
$body .= "以下の内容をご確認ください。\n\n";
$body .= "========================================\n";
$body .= "■ 年代\n{$age}\n\n";
$body .= "■ 性別\n{$gender}\n\n";
$body .= "■ お住まいの地域\n{$from_origin}\n\n";
$body .= "■ 参加されたプラン\n{$stay_program}\n\n";
$body .= "■ 参加の目的\n{$purpose}\n\n";
$body .= "■ 旅の感想\n{$comment}\n\n";
$body .= "========================================\n";
$body .= "送信日時: " . date("Y-m-d H:i:s") . "\n";
$body .= "送信元IP: " . $_SERVER['REMOTE_ADDR'] . "\n";

// ヘッダー
$headers  = "From: " . mb_encode_mimeheader("ウイズささやま アンケートフォーム") . " <info@withsasayama.jp>\r\n";
$headers .= "Reply-To: info@withsasayama.jp\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// 送信
$is_success = mb_send_mail($to, $subject, $body, $headers);

?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo $is_success ? '送信完了' : '送信エラー'; ?> | ウイズささやま</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500&family=Noto+Sans+JP:wght@300;400&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans JP', sans-serif;
      background: #F1F0EB;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: #fff;
      border: 1px solid #E8E6E1;
      padding: 4rem 3rem;
      max-width: 560px;
      width: 100%;
      text-align: center;
    }
    .icon { font-size: 3.5rem; margin-bottom: 1.5rem; }
    h1 {
      font-family: 'Noto Serif JP', serif;
      font-size: 1.5rem;
      font-weight: 400;
      color: <?php echo $is_success ? '#8C806A' : '#c0392b'; ?>;
      margin-bottom: 1.5rem;
      letter-spacing: 0.08em;
    }
    p { color: #6B6B6B; line-height: 1.9; font-size: 0.95rem; margin-bottom: 2rem; }
    .btn {
      display: inline-block;
      background: #1A1A1A;
      color: #fff;
      padding: 0.9rem 2.5rem;
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 0.9rem;
      letter-spacing: 0.08em;
      text-decoration: none;
      transition: background 0.3s;
    }
    .btn:hover { background: #333; }
  </style>
</head>
<body>
  <div class="card">
    <?php if ($is_success): ?>
      <div class="icon">🌿</div>
      <h1>ありがとうございました</h1>
      <p>
        アンケートのご回答、誠にありがとうございます。<br>
        いただいたご意見は今後のプログラム改善に<br>
        大切に活用させていただきます。<br><br>
        またいつか、丹波篠山でお会いしましょう。
      </p>
      <a href="index.html" class="btn">トップページへ</a>
    <?php else: ?>
      <div class="icon">⚠️</div>
      <h1>送信に失敗しました</h1>
      <p>
        申し訳ございません。システムエラーが発生しました。<br>
        恐れ入りますが、しばらく経ってから再度お試しいただくか、<br>
        直接メール（tour@withsasayama.jp）にてご連絡ください。
      </p>
      <a href="survey.html" class="btn">アンケートに戻る</a>
    <?php endif; ?>
  </div>
</body>
</html>
