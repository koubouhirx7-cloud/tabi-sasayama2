<?php
// XServer用 PDFアップロード処理
// Vercel環境ではこのファイルは無視され、エックスサーバー(PHP環境)でのみ動作します。
require_once __DIR__ . '/../api-php/_common.php';

// 認証チェック
require_basic_auth();

// 許可する拡張子とMIMEタイプ
$allowed_extensions = ['pdf'];
$allowed_mimes = ['application/pdf'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['message' => 'Method Not Allowed'], 405);
}
$raw_data = file_get_contents("php://input");
$data = json_decode($raw_data, true);

if (!$data || !isset($data['imageBase64'])) {
    json_response(['message' => 'Base64 data is missing'], 400);
}

$base64Str = $data['imageBase64'];
$filename = isset($data['filename']) ? basename($data['filename']) : 'document_' . time() . '.pdf';

// 拡張子チェック
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
if (!in_array($ext, $allowed_extensions)) {
    json_response(['message' => 'Only PDF files are allowed.'], 400);
}

// ユニークなファイル名にする
$unique_filename = time() . '_' . bin2hex(random_bytes(8)) . '.pdf';

// 保存先ディレクトリ
$save_dir = __DIR__ . '/../pdf/';
if (!file_exists($save_dir)) {
    mkdir($save_dir, 0755, true);
}

$save_path = $save_dir . $unique_filename;

// data:application/pdf;base64,..... からデータを抽出
if (preg_match('/^data:([a-zA-Z0-9\/\+\-]+);base64,(.+)$/', $base64Str, $matches)) {
    $file_data = base64_decode($matches[2]);
    if ($file_data === false) {
        json_response(['message' => 'Failed to decode Base64 data'], 400);
    }

    // サイズチェック (最大10MB)
    if (strlen($file_data) > 10 * 1024 * 1024) {
        json_response(['message' => 'File size is too large (max 10MB)'], 400);
    }

    // 実際のMIMEタイプを検証
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $real_mime = $finfo->buffer($file_data);
    if (!in_array($real_mime, $allowed_mimes)) {
        json_response(['message' => 'Invalid file format. Only actual PDF files are allowed.'], 400);
    }

    if (file_put_contents($save_path, $file_data)) {
        // 保存成功。URLを返す（ルート相対パス /pdf/ファイル名）
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'];
        $url = $protocol . $host . '/pdf/' . $unique_filename;

        echo json_encode(['success' => true, 'data' => ['url' => $url]]);
    } else {
        json_response(['message' => 'Failed to save file to server disk'], 500);
    }
} else {
    json_response(['message' => 'Invalid base64 format'], 400);
}
