<?php

declare(strict_types=1);

$config = require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

function json_response(bool $ok, string $message, int $status = 200)
{
    http_response_code($status);
    echo json_encode([
        'ok' => $ok,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Método no permitido.', 405);
}

// Honeypot sencillo contra bots.
if (!empty($_POST['website'])) {
    json_response(true, 'Consulta recibida.');
}

$nombre  = trim((string)($_POST['nombre'] ?? ''));
$email   = trim((string)($_POST['email'] ?? ''));
$motivo  = trim((string)($_POST['motivo'] ?? ''));
$mensaje = trim((string)($_POST['mensaje'] ?? ''));

if ($nombre === '' || $email === '' || $motivo === '' || $mensaje === '') {
    json_response(false, 'Completá todos los campos antes de enviar.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(false, 'El email ingresado no es válido.', 422);
}

if (mb_strlen($nombre) > 120 || mb_strlen($mensaje) > 5000) {
    json_response(false, 'La consulta supera el límite permitido.', 422);
}

$motivos = [
    'socios' => 'Consulta de socios',
    'beneficios' => 'Beneficios y descuentos',
    'partidos' => 'Partidos e ingreso',
    'otro' => 'Otra consulta',
];
$motivoTexto = $motivos[$motivo] ?? 'Otra consulta';

$nombreSafe  = htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');
$emailSafe   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$motivoSafe  = htmlspecialchars($motivoTexto, ENT_QUOTES, 'UTF-8');
$mensajeSafe = nl2br(htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8'));

$bannerPath = __DIR__ . '/assets/images/mail-talleres-banner.jpg';
$bannerCid = 'talleres-banner-' . md5(__FILE__);

/**
 * Envía un HTML con el banner de Talleres embebido como CID para que funcione
 * también cuando el cliente de correo bloquea imágenes externas.
 */
function send_html_mail(string $to, string $subject, string $html, string $from, string $replyTo, string $bannerPath, string $bannerCid): bool
{
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'From: ' . $from;
    $headers[] = 'Reply-To: ' . $replyTo;
    $headers[] = 'X-Mailer: PHP/' . PHP_VERSION;

    if (is_file($bannerPath) && is_readable($bannerPath)) {
        $boundaryRelated = '=_related_' . bin2hex(random_bytes(12));
        $mime = 'image/jpeg';
        $image = chunk_split(base64_encode((string)file_get_contents($bannerPath)));

        $headers[] = 'Content-Type: multipart/related; boundary="' . $boundaryRelated . '"';
        $body  = '--' . $boundaryRelated . "\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $html . "\r\n\r\n";
        $body .= '--' . $boundaryRelated . "\r\n";
        $body .= 'Content-Type: ' . $mime . "\r\n";
        $body .= 'Content-Transfer-Encoding: base64' . "\r\n";
        $body .= 'Content-ID: <' . $bannerCid . '>' . "\r\n";
        $body .= 'Content-Disposition: inline; filename="talleres-banner.jpg"' . "\r\n\r\n";
        $body .= $image . "\r\n";
        $body .= '--' . $boundaryRelated . "--\r\n";
    } else {
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $body = $html;
    }

    return mail($to, $encodedSubject, $body, implode("\r\n", $headers));
}

function build_email_html(string $title, string $intro, string $content, string $bannerCid, string $clubName): string
{
    return '<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body style="margin:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#10213a;">'
        . '<div style="max-width:680px;margin:0 auto;background:#ffffff;">'
        . '<img src="cid:' . htmlspecialchars($bannerCid, ENT_QUOTES, 'UTF-8') . '" alt="Club Atlético Talleres" style="display:block;width:100%;height:auto;max-height:170px;object-fit:cover;">'
        . '<div style="padding:34px 34px 28px;">'
        . '<div style="font-size:12px;font-weight:800;letter-spacing:2px;color:#1458b8;text-transform:uppercase;margin-bottom:10px;">ATENCIÓN AL SOCIO</div>'
        . '<h1 style="margin:0 0 14px;font-size:28px;line-height:1.05;color:#08244a;">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</h1>'
        . '<p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#607087;">' . $intro . '</p>'
        . $content
        . '</div>'
        . '<div style="background:#061a33;padding:22px 30px;text-align:center;">'
        . '<div style="font-size:13px;font-weight:800;letter-spacing:1px;color:#fff;">' . htmlspecialchars($clubName, ENT_QUOTES, 'UTF-8') . '</div>'
        . '<div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,.68);">Barrio Jardín · Córdoba, Argentina · Desde 1913</div>'
        . '<div style="margin-top:12px;font-size:10px;color:rgba(255,255,255,.48);">El más grande de la Docta</div>'
        . '</div></div></body></html>';
}

// Base oficial que la IA puede utilizar. Si la respuesta no está acá, debe derivar.
$knowledgeBase = <<<'KB'
Sos el asistente virtual de atención al socio del Club Atlético Talleres de Córdoba.
Respondé siempre en español argentino, con tono amable, institucional, claro y breve.
NO inventes precios, horarios, requisitos, fechas, promociones, links ni políticas.
Usá únicamente la información de esta base. Si la consulta requiere información que no aparece acá, decí que la consulta será revisada por Atención al Socio y que responderán por email.

INFORMACIÓN OFICIAL DISPONIBLE EN LA WEB:
- Para asociarse: https://www.clubtalleres.com.ar/asociat/
- Plataforma de socios para consultar y gestionar la cuota: https://socios.clubtalleres.com.ar/
- Atención al Socio por WhatsApp: 351 226 8833.
- Email de Atención al Socio: socios@clubtalleres.com.ar.
- Sede Social: Rosario de Santa Fe 15, Córdoba.
- Para ingresar a partidos, la cuota debe estar al día y, cuando corresponda, puede ser necesario reservar la ubicación. Las condiciones pueden variar según cada partido.
- Categorías/valores de ubicaciones que aparecen actualmente en la página: Platea Ardiles, Platea Gasparini y Popular Willington, con diferentes valores según categoría de socio. Si el usuario pide un valor exacto, aclarar que debe verificarse en la web oficial porque puede cambiar.
KB;

function ask_openai(string $apiKey, string $model, string $knowledgeBase, string $nombre, string $motivo, string $mensaje): ?string
{
    if ($apiKey === '' || !function_exists('curl_init')) {
        return null;
    }

    $prompt = $knowledgeBase
        . "\n\nCONSULTA RECIBIDA:\n"
        . "Nombre: " . $nombre . "\n"
        . "Motivo: " . $motivo . "\n"
        . "Mensaje: " . $mensaje . "\n\n"
        . "Redactá únicamente la respuesta que recibirá el socio. No menciones que sos una IA. No agregues información que no esté en la base. Si no podés responder con certeza, indicá que Atención al Socio revisará la consulta. La respuesta debe ser cordial y de máximo 180 palabras.";

    $payload = [
        'model' => $model,
        'input' => $prompt,
        'max_output_tokens' => 300,
    ];

    $ch = curl_init('https://api.openai.com/v1/responses');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_TIMEOUT => 25,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);

    $raw = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $httpCode < 200 || $httpCode >= 300) {
        return null;
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return null;
    }

    if (!empty($data['output_text']) && is_string($data['output_text'])) {
        return trim($data['output_text']);
    }

    // Compatibilidad con respuestas donde el texto viene dentro de output[].
    $parts = [];
    foreach (($data['output'] ?? []) as $item) {
        foreach (($item['content'] ?? []) as $content) {
            if (isset($content['text']) && is_string($content['text'])) {
                $parts[] = $content['text'];
            }
        }
    }

    return $parts ? trim(implode("\n", $parts)) : null;
}

// 1) Aviso interno a Atención al Socio.
$adminContent = '<div style="background:#f5f7fa;border-left:4px solid #1458b8;padding:18px 20px;margin:0 0 20px;">'
    . '<div style="font-size:12px;font-weight:800;color:#6a778a;letter-spacing:1px;">DATOS DEL CONTACTO</div>'
    . '<p style="margin:10px 0 4px;"><strong>Nombre:</strong> ' . $nombreSafe . '</p>'
    . '<p style="margin:4px 0;"><strong>Email:</strong> ' . $emailSafe . '</p>'
    . '<p style="margin:4px 0;"><strong>Motivo:</strong> ' . $motivoSafe . '</p>'
    . '</div>'
    . '<div style="font-size:14px;line-height:1.7;color:#35445a;"><strong>Consulta:</strong><br>' . $mensajeSafe . '</div>';

$adminHtml = build_email_html(
    'Nueva consulta de ' . $nombre,
    'Llegó una nueva consulta desde el formulario de la web.',
    $adminContent,
    $bannerCid,
    $config['club_name']
);

$adminSent = send_html_mail(
    $config['admin_email'],
    'Nueva consulta web · ' . $motivoTexto,
    $adminHtml,
    $config['mail_from'],
    $email,
    $bannerPath,
    $bannerCid
);

// 2) Respuesta automática con IA, si hay API key configurada.
$aiReply = ask_openai(
    $config['openai_api_key'],
    $config['openai_model'],
    $knowledgeBase,
    $nombre,
    $motivoTexto,
    $mensaje
);

$automaticText = $aiReply ?: '¡Recibimos tu consulta! Gracias por comunicarte con nosotros. Recibimos correctamente tu mensaje y te responderemos a la brevedad.';
$automaticHtml = '<div style="background:#f5f7fa;border-left:4px solid #1458b8;padding:20px 22px;font-size:15px;line-height:1.7;color:#35445a;">'
    . nl2br(htmlspecialchars($automaticText, ENT_QUOTES, 'UTF-8'))
    . '</div>'
    . '<p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#7a8798;">Si necesitás ampliar la consulta, podés responder directamente a este correo.</p>';

$userHtml = build_email_html(
    $aiReply ? 'Hola ' . $nombre . ', tenemos una respuesta para vos.' : '¡Recibimos tu consulta!',
    $aiReply ? 'Gracias por comunicarte con nosotros. Esta respuesta fue generada a partir de la información institucional disponible.' : 'Gracias por comunicarte con nosotros. Recibimos correctamente tu mensaje y te responderemos a la brevedad.',
    $automaticHtml,
    $bannerCid,
    $config['club_name']
);

$userSent = send_html_mail(
    $email,
    $aiReply ? 'Respuesta a tu consulta · Club Atlético Talleres' : '¡Recibimos tu consulta! · Club Atlético Talleres',
    $userHtml,
    $config['mail_from'],
    $config['admin_email'],
    $bannerPath,
    $bannerCid
);

if (!$adminSent && !$userSent) {
    json_response(false, 'No pudimos enviar la consulta en este momento. Revisá la configuración de correo del servidor.', 500);
}

json_response(true, $aiReply
    ? 'Consulta enviada. También se envió una respuesta automática al email indicado.'
    : '¡Consulta recibida! Te enviamos un correo de confirmación.');
