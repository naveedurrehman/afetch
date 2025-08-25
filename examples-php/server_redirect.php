<?php
header('Content-Type: text/javascript');
$url = ['https://www.google.com', 'https://www.yahoo.com'][rand(0, 1)];
echo <<<TXT

    window.location="$url";
    
TXT;
