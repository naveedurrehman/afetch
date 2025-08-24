<?php
echo "<hr/>";
echo "<h1>Output:</h1>";

if (!empty($_GET)) {
    echo '<h2>$_GET</h2>';
    echo json_encode($_GET);
}

$rawData = file_get_contents("php://input");
if (!empty($rawData)) {
    echo '<h2>Raw Data</h2>';
    echo json_encode($rawData);
}

if (!empty($_POST)) {
    echo '<h2>$_POST</h2>';
    echo json_encode($_POST);
}

if (!empty($_COOKIE)) {
    echo '<h2>$_COOKIE</h2>';
    echo json_encode($_COOKIE);
}

if (!empty($_FILES)) {
    echo '<h2>$_FILES</h2>';
    echo json_encode($_FILES);
}
