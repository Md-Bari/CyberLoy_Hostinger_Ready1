<?php

return [
    'frontend_url' => env('FRONTEND_URL', env('APP_URL')),
    'require_email_verification' => env('AUTH_REQUIRE_EMAIL_VERIFICATION', true),
    'stripe_secret' => env('STRIPE_SECRET'),
    'stripe_webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    'livekit_url' => env('LIVEKIT_URL'),
    'livekit_api_key' => env('LIVEKIT_API_KEY'),
    'livekit_api_secret' => env('LIVEKIT_API_SECRET'),
];
