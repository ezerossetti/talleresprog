<?php
/**
 * Configuración del formulario de consultas de Talleres.
 *
 * En producción se recomienda definir estas variables como variables de entorno:
 * OPENAI_API_KEY, OPENAI_MODEL, ADMIN_EMAIL, MAIL_FROM y SITE_URL.
 */

return [
    'admin_email'   => getenv('ADMIN_EMAIL') ?: 'socios@clubtalleres.com.ar',
    'mail_from'     => getenv('MAIL_FROM') ?: 'socios@clubtalleres.com.ar',
    'site_url'      => rtrim(getenv('SITE_URL') ?: '', '/'),
    'openai_api_key'=> getenv('OPENAI_API_KEY') ?: '',
    'openai_model'  => getenv('OPENAI_MODEL') ?: 'gpt-5-mini',
    'club_name'     => 'Club Atlético Talleres',
];
