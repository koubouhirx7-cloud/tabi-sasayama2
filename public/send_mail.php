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

// ハニーポット（スパムボット対策）
if (!empty($_POST['website_url'])) {
    // 隠しフィールドに入力がある場合はボットとみなす
    die("スパム判定エラー：不正なリクエストです。");
}

// フォームデータの受け取りとエスケープ（XSS対策）
function h($str) {
    if ($str === null) return '';
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

$tour_name    = h($_POST['tour_name'] ?? '');
$count_adult  = h($_POST['count_adult'] ?? '0');
$count_child  = h($_POST['count_child'] ?? '0');
$count_infant = h($_POST['count_infant'] ?? '0');
$name_kanji   = h($_POST['name_kanji'] ?? '');
$name_kana    = h($_POST['name_kana'] ?? '');
$email        = h($_POST['email'] ?? '');
// メールヘッダインジェクション対策（改行コードの除去）
$email        = str_replace(array("\r", "\n"), '', $email);
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("エラー：不正なメールアドレス形式です。ブラウザの「戻る」ボタンで前の画面に戻り、正しいメールアドレスを入力してください。");
}
$phone        = h($_POST['phone'] ?? '');
$birthday     = h($_POST['birthday'] ?? '');
$zipcode      = h($_POST['zipcode'] ?? '');
$address      = h($_POST['address'] ?? '');
$allergy      = h($_POST['allergy'] ?? '');

// ===== メールの送信設定 =====
// 宛先メールアドレス（要件通り設定）
$to = "tour@withsasayama.jp";

// メールの件名
$subject = "【ウイズささやま】体験プログラムお申し込み（{$tour_name}）";

// メールの本文（管理者が受け取る内容）
$body = "Webサイトのプログラムお申し込みフォームより、以下の内容でお申し込みがありました。\n\n";
$body .= "■ お申し込みプログラム\n{$tour_name}\n\n";
$body .= "■ 申し込み人数\n";
$body .= "・大人（12歳以上）：{$count_adult} 名\n";
$body .= "・子供（5〜12歳）：{$count_child} 名\n";
$body .= "・幼児（5歳以下）：{$count_infant} 名\n\n";
$body .= "■ 代表者情報\n";
$body .= "・お名前（漢字）：{$name_kanji}\n";
$body .= "・お名前（ふりがな）：{$name_kana}\n";
$body .= "・メールアドレス：{$email}\n";
$body .= "・携帯番号：{$phone}\n";
$body .= "・生年月日：{$birthday}\n";
$body .= "・ご住所：〒{$zipcode} {$address}\n\n";
$body .= "■ アレルギー情報\n" . ($allergy ?: '特になし') . "\n\n";
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
