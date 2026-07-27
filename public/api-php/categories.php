<?php
require_once __DIR__ . '/_common.php';

$file_path = __DIR__ . '/../../stay-categories.json';

// Default categories
$default_categories = ["2026-27年限定", "通年", "募集中", "季節限定"];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($file_path)) {
        $content = file_get_contents($file_path);
        $data = json_decode($content, true);
        if (is_array($data)) {
            json_response($data);
            exit;
        }
    }
    json_response($default_categories);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_basic_auth();
    $body = get_request_body();
    if (!isset($body['categories']) || !is_array($body['categories'])) {
        json_response(['message' => 'Invalid categories format'], 400);
    }

    // Sanitize values
    $categories = array_map(function($val) {
        return trim(strip_tags((string)$val));
    }, $body['categories']);
    $categories = array_values(array_filter($categories)); // remove empty

    if (file_put_contents($file_path, json_encode($categories, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) === false) {
        json_response(['message' => 'Failed to save categories'], 500);
    }

    json_response(['success' => true, 'categories' => $categories]);
    exit;
}

json_response(['message' => 'Method Not Allowed'], 405);
