<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('lms.frontend_url'), '/')
            . '/reset-password?token=' . urlencode($this->token)
            . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage())
            ->subject('Reset your LMS password')
            ->line('We received a request to reset your password.')
            ->action('Reset password', $url)
            ->line('This link expires in ' . config('auth.passwords.users.expire') . ' minutes.')
            ->line('If you did not request this, you can ignore this email.');
    }
}
