<?php
require_once __DIR__ . '/_common.php';

$config_file = __DIR__ . '/data/analytics-config.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = file_exists($config_file)
        ? (json_decode(file_get_contents($config_file), true) ?? [])
        : ['dashboardUrl' => ''];
    json_response(['success' => true, 'data' => $data]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_basic_auth();

    $body = get_request_body();
    $url  = trim($body['dashboardUrl'] ?? '');

    $data_dir = __DIR__ . '/data';
    if (!is_dir($data_dir)) {
        mkdir($data_dir, 0755, true);
    }

    $written = file_put_contents(
        $config_file,
        json_encode(['dashboardUrl' => $url], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
    );

    if ($written === false) {
        json_response(['message' => '設定の保存に失敗しました'], 500);
    }

    json_response(['success' => true]);
}

json_response(['message' => 'Method Not Allowed'], 405);
