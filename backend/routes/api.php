<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\VideoProgressController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ProjectTaskController;
use App\Http\Controllers\Api\EmergencySupportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication & Course Catalog
Route::post('/login', [AuthController::class, 'login']);
Route::post('/refresh', [AuthController::class, 'refresh']);
Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{id}', [CourseController::class, 'show']);

// Public Certificate Verification Endpoint
Route::get('/certificates/verify/{code}', [CertificateController::class, 'verify']);
Route::get('/certificates/{code}', [CertificateController::class, 'show']);

Route::get('/login-unauthorized', function () {
    return response()->json(['message' => 'Unauthenticated access. Token required.'], 401);
})->name('login');

// Protected Routes (Students & Admins) — JWT guard
Route::middleware('auth:api')->group(function () {
    // Current User & Logout
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Course Enrollment & Payment
    Route::post('/courses/{id}/enroll', [CourseController::class, 'enroll']);
    Route::post('/courses/{id}/pay', [CourseController::class, 'pay']);

    // Learning Classroom & Video Playback Tracking
    Route::get('/learn/{courseId}/{lessonId}', [CourseController::class, 'getLesson']);
    Route::post('/learn/{courseId}/{lessonId}/assessment-submit', [CourseController::class, 'submitAssessment']);
    Route::post('/video-progress', [VideoProgressController::class, 'recordProgress']);

    // Student Project & Task Management
    Route::get('/project-plans', [ProjectTaskController::class, 'indexStudent']);
    Route::get('/project-plans/{id}', [ProjectTaskController::class, 'showPlanStudent']);
    Route::post('/project-plans/{planId}/tasks/{taskId}/progress', [ProjectTaskController::class, 'updateStudentProgress']);

    // Student Certificates & Notifications
    Route::get('/certificates/my-certificates', [CertificateController::class, 'myCertificates']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Admin Routes
    Route::middleware('admin')->group(function () {
        // Admin User Management
        Route::post('/admin/users', [AuthController::class, 'register']);

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

        // Admin Project Plans & Task Builder Management
        Route::get('/admin/users', [ProjectTaskController::class, 'getUsersList']);
        Route::get('/admin/project-plans', [ProjectTaskController::class, 'indexAdmin']);

        Route::get('/admin/project-plans/{id}', [ProjectTaskController::class, 'showPlanAdmin']);
        Route::post('/admin/project-plans', [ProjectTaskController::class, 'storePlan']);
        Route::put('/admin/project-plans/{id}', [ProjectTaskController::class, 'updatePlan']);
        Route::delete('/admin/project-plans/{id}', [ProjectTaskController::class, 'deletePlan']);
        Route::post('/admin/project-plans/{planId}/tasks', [ProjectTaskController::class, 'storeTask']);
        Route::put('/admin/project-tasks/{taskId}', [ProjectTaskController::class, 'updateTask']);
        Route::delete('/admin/project-tasks/{taskId}', [ProjectTaskController::class, 'deleteTask']);
        Route::post('/admin/project-plans/{planId}/assign', [ProjectTaskController::class, 'assignUsers']);
        Route::post('/admin/project-plans/{planId}/users/{userId}/progress', [ProjectTaskController::class, 'adminUpdateUserProgress']);

        // Certificate Issuance
        Route::post('/admin/issue-certificate', [AdminController::class, 'issueCertificate']);

        // Emergency Support Ticket Management
        Route::get('/admin/emergency-support', [EmergencySupportController::class, 'index']);
        Route::put('/admin/emergency-support/{id}/status', [EmergencySupportController::class, 'updateStatus']);
    });
});

