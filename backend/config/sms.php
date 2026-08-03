<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SMS provider
    |--------------------------------------------------------------------------
    |
    | Supported: none, log, http, twilio
    | - log: writes SMS to laravel.log (for testing)
    | - http: POST JSON to SMS_API_URL (also set in Settings → API)
    | - twilio: use Twilio REST API (TWILIO_* env vars)
    |
    */

    'default' => env('SMS_PROVIDER', 'none'),

    'http' => [
        'url' => env('SMS_API_URL'),
        'key' => env('SMS_API_KEY'),
    ],

    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        'from' => env('TWILIO_FROM_NUMBER'),
    ],

];
