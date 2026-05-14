<?php
// XServer用 PDFアップロード処理
// Vercel環境ではこのファイルは無視され、エックスサーバー(PHP環境)でのみ動作します。
header('Content-Type: application/json');

// 許可する拡張子
$allowed_extensions = ['pdf'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}

$raw_data = file_get_contents("php://input");
$data = json_decode($raw_data, true);

if (!$data || !isset($data['imageBase64'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Base64 data is missing']);
    exit;
}

$base64Str = $data['imageBase64'];
$filename = isset($data['filename']) ? basename($data['filename']) : 'document_' . time() . '.pdf';

// 拡張子チェック
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
if (!in_array($ext, $allowed_extensions)) {
    http_response_code(400);
    echo json_encode(['message' => 'Only PDF files are allowed.']);
    exit;
}

// ユニークなファイル名にする (日本語ファイル名等を考慮してタイムスタンプ+ランダム文字列)
$unique_filename = time() . '_' . rand(1000, 9999) . '.pdf';

// 保存先ディレクトリ (apiフォルダの1つ上の pdf フォルダ)
// エックスサーバー環境を想定: public_html/api/upload_pdf.php -> public_html/pdf/
$save_dir = __DIR__ . '/../pdf/';

if (!file_exists($save_dir)) {
    mkdir($save_dir, 0777, true);
}

$save_path = $save_dir . $unique_filename;

// data:application/pdf;base64,..... からデータを抽出
if (preg_match('/^data:([a-zA-Z0-9\/\+\-]+);base64,(.+)$/', $base64Str, $matches)) {
    $file_data = base64_decode($matches[2]);
    if ($file_data === false) {
        http_response_code(400);
        echo json_encode(['message' => 'Failed to decode Base64 data']);
        exit;
    }

    if (file_put_contents($save_path, $file_data)) {
        // 保存成功。URLを返す（ルート相対パス /pdf/ファイル名）
        // ※CMSからの読み込み時にフルURLが必要かどうかに応じて調整
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'];
        $url = $protocol . $host . '/pdf/' . $unique_filename;

        echo json_encode(['success' => true, 'data' => ['url' => $url]]);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to save file to server disk']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid base64 format']);
}
?>
