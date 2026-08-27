<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function myCertificates(Request $request)
    {
        $user = $request->user();

        $certificates = Certificate::with(['course:id,title,level,category', 'issuer:id,name'])
            ->where('user_id', $user->id)
            ->where('status', 'issued')
            ->orderBy('issued_at', 'desc')
            ->get();

        return response()->json($certificates);
    }

    public function show(Request $request, $code)
    {
        $certificate = Certificate::with(['user:id,name,email', 'course', 'issuer:id,name'])
            ->where('certificate_code', $code)
            ->orWhere('verification_code', $code)
            ->firstOrFail();

        return response()->json($certificate);
    }

    /**
     * Public Certificate Verification Endpoint (No authentication required)
     */
    public function verify($code)
    {
        $certificate = Certificate::with(['user:id,name', 'course:id,title,level,duration', 'issuer:id,name'])
            ->where('certificate_code', $code)
            ->orWhere('verification_code', $code)
            ->first();

        if (!$certificate) {
            return response()->json([
                'valid' => false,
                'message' => 'Certificate not found. The verification code or ID is invalid.',
            ], 404);
        }

        if ($certificate->status !== 'issued') {
            return response()->json([
                'valid' => false,
                'message' => 'This certificate has not been officially released or has been revoked.',
                'status' => $certificate->status,
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'certificate_id' => $certificate->certificate_code,
            'verification_code' => $certificate->verification_code ?? $certificate->certificate_code,
            'student_name' => $certificate->user ? $certificate->user->name : 'Verified Student',
            'course_title' => $certificate->course ? $certificate->course->title : 'Cybersecurity Program',
            'completion_date' => $certificate->completion_date ? $certificate->completion_date->format('F d, Y') : $certificate->issued_at->format('F d, Y'),
            'issue_date' => $certificate->issued_at->format('F d, Y'),
            'issued_by' => $certificate->issuer ? $certificate->issuer->name : 'CyberLoy LMS Academy',
            'organization' => 'CyberLoy Enterprise Cybersecurity LMS',
            'status' => 'VERIFIED & AUTHENTIC',
        ]);
    }
}
