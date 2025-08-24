<?php
if ($_GET['sendme'] == 'json') {
    header('Content-Type: application/json');
    echo json_encode(['time' => time()]);
}

if ($_GET['sendme'] == 'text') {
    header('Content-Type: text/plain');
    echo date(" j F Y h:i:sa");
}

if ($_GET['sendme'] == 'blob') {
    // Path to the image file
    $file = '../logo.png';
    header('Content-Type: image/png');
    header('Content-Length: ' . filesize($file));
    readfile($file);
}

if ($_GET['sendme'] == 'js') {
    header('Content-Type: text/javascript');
    echo 'alert("hi!");';
}

if ($_GET['sendme'] == 'wrongjson') {
    header('Content-Type: application/json');
    echo md5(rand());
}
