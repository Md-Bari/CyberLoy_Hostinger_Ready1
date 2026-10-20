    private function autoIssueCertificate(Course $course, $user)
    {
        $existing = \App\Models\Certificate::where('user_id', $user->id)->where('course_id', $course->id)->exists();
        if ($existing) {
            return;
        }

        $code = 'CERT-' . date('Y') . '-' . strtoupper(\Illuminate\Support\Str::random(6)) . '-' . rand(100, 999);
        $verCode = 'VER-' . strtoupper(\Illuminate\Support\Str::random(4)) . '-' . strtoupper(\Illuminate\Support\Str::random(4));

        \App\Models\Certificate::create([
            'certificate_code' => $code,
            'verification_code' => $verCode,
            'user_id' => $user->id,
            'course_id' => $course->id,
            'issued_by' => 1,
            'issued_at' => now(),
            'completion_date' => now(),
            'status' => 'issued',
            'auto_issued' => true,
        ]);

        \App\Models\Notification::create([
            'user_id' => $user->id,
            'title' => 'Official Certificate Issued!',
            'message' => 'Congratulations! Your certificate for "' . $course->title . '" has been automatically issued. Certificate Code: ' . $code,
            'type' => 'certificate_issued',
            'is_read' => false,
        ]);
    }
