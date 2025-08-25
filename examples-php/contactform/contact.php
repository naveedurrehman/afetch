<?php

sleep(1);

header('Content-Type: application/javascript');

echo <<<TXT
    $("#error").hide();
    $("#sucess").hide();
TXT;

// Collect required fields
$name    = isset($_POST['name'])    ? trim($_POST['name'])    : '';
$email   = isset($_POST['email'])   ? trim($_POST['email'])   : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

$error = "";

// Validate required fields
if (empty($error) && $name === '') {
    $error = "Name is required.";
}

if (empty($error) && $email === '') {
    $error  = "Email is required.";
}

if (empty($error) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $error  = "Invalid email format.";
}
if (empty($error) && $message === '') {
    $error  = "Message is required.";
}

// If there are validation errors, return an error response
if (!empty($error)) {
    echo <<<TXT
        $('#error').text('Error: $error');
        $("#error").show();
    TXT;
    exit;
}

// If everything is valid, return success response
echo <<<TXT
        $('#success').text('Form submitted successfully! Name: $name Email: $email Message: $message');
        $("#success").show();
        $("#contactForm").hide();
TXT;
