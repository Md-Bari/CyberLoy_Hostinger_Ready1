<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\VideoProgressController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication & Course Catalog
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{id}', [CourseController::class, 'show']);

// Public Certificate Verification Endpoint
Route::get('/certificates/verify/{code}', [CertificateController::class, 'verify']);
Route::get('/certificates/{code}', [CertificateController::class, 'show']);

Route::get('/login-unauthorized', function () {
    return response()->json(['message' => 'Unauthenticated access. Token required.'], 401);
})->name('login');

// Protected Routes (Students & Admins)
Route::middleware('auth:sanctum')->group(function () {
    // Current User & Logout
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Course Enrollment & Payment
    Route::post('/courses/{id}/enroll', [CourseController::class, 'enroll']);
    Route::post('/courses/{id}/pay', [CourseController::class, 'pay']);

    // Learning Classroom & Video Playback Tracking
    Route::get('/learn/{courseId}/{lessonId}', [CourseController::class, 'getLesson']);
    Route::post('/video-progress', [VideoProgressController::class, 'recordProgress']);

    // Student Certificates & Notifications
    Route::get('/certificates/my-certificates', [CertificateController::class, 'myCertificates']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Admin Routes
    Route::middleware('admin')->group(function () {
        // Admin Dashboard Stats & Analytics
        Route::get('/admin/dashboard', [AdminController::class, 'dashboardStats']);
        Route::get('/admin/payments', [AdminController::class, 'paymentsList']);
        Route::get('/admin/user-activities', [AdminController::class, 'userActivities']);
        Route::get('/admin/students/{id}/progress', [AdminController::class, 'studentProgressDetail']);

        // Course Builder & Content Management
        Route::post('/admin/courses', [AdminController::class, 'createCourse']);
        Route::put('/admin/courses/{id}', [AdminController::class, 'updateCourse']);
        Route::delete('/admin/courses/{id}', [AdminController::class, 'deleteCourse']);
        Route::post('/admin/courses/{courseId}/sections', [AdminController::class, 'addSection']);
        Route::put('/admin/sections/{id}', [AdminController::class, 'updateSection']);
        Route::delete('/admin/sections/{id}', [AdminController::class, 'deleteSection']);
        Route::post('/admin/sections/{sectionId}/lessons', [AdminController::class, 'addLesson']);
        Route::put('/admin/lessons/{id}', [AdminController::class, 'updateLesson']);
        Route::delete('/admin/lessons/{id}', [AdminController::class, 'deleteLesson']);

        // Certificate Issuance
        Route::post('/admin/issue-certificate', [AdminController::class, 'issueCertificate']);
    });
});
