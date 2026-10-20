<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Announcements
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('content');
            $table->enum('type', ['global', 'course', 'urgent'])->default('course');
            $table->boolean('is_published')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // Lesson Notes (personal)
        Schema::create('lesson_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->integer('timestamp_seconds')->nullable();
            $table->text('note');
            $table->timestamps();
            $table->index(['user_id', 'lesson_id']);
        });

        // Course Reviews
        Schema::create('course_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('title')->nullable();
            $table->text('review')->nullable();
            $table->boolean('is_approved')->default(true);
            $table->timestamps();
            $table->unique(['user_id', 'course_id']);
        });

        // Question Bank
        Schema::create('question_banks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Questions
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_bank_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained()->cascadeOnDelete();
            $table->enum('type', ['mcq', 'true_false', 'multi_select', 'short_answer'])->default('mcq');
            $table->text('question');
            $table->json('options')->nullable();
            $table->json('correct_answer');
            $table->text('explanation')->nullable();
            $table->unsignedTinyInteger('points')->default(1);
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->timestamps();
        });

        // Quizzes
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('course_sections')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('time_limit_minutes')->nullable();
            $table->unsignedInteger('max_attempts')->default(3);
            $table->unsignedTinyInteger('passing_score')->default(70);
            $table->boolean('randomize_questions')->default(false);
            $table->boolean('show_results_immediately')->default(true);
            $table->boolean('is_published')->default(true);
            $table->integer('sort_order')->default(1);
            $table->timestamps();
        });

        // Quiz Questions Pivot
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->integer('sort_order')->default(1);
            $table->timestamps();
            $table->unique(['quiz_id', 'question_id']);
        });

        // Quiz Attempts
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('attempt_number')->default(1);
            $table->json('answers')->nullable();
            $table->unsignedInteger('score')->nullable();
            $table->unsignedInteger('total_points')->nullable();
            $table->boolean('passed')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->enum('status', ['in_progress', 'completed', 'timed_out'])->default('in_progress');
            $table->timestamps();
        });

        // Lesson-level discussions
        Schema::table('course_discussions', function (Blueprint $table) {
            $table->foreignId('lesson_id')->nullable()->after('course_id')->constrained()->cascadeOnDelete();
        });

        // Assessment file uploads
        Schema::table('lesson_assessment_submissions', function (Blueprint $table) {
            $table->json('file_urls')->nullable()->after('answers');
            $table->text('submission_text')->nullable()->after('file_urls');
        });

        // Coupons
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 10, 2);
            $table->decimal('min_amount', 10, 2)->nullable();
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Coupon usage
        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->cascadeOnDelete();
            $table->decimal('discount_amount', 10, 2);
            $table->timestamps();
        });

        // Enhance courses
        Schema::table('courses', function (Blueprint $table) {
            $table->integer('estimated_hours')->nullable()->after('duration');
            $table->boolean('certificate_auto_issue')->default(true)->after('status');
            $table->decimal('discount_price', 10, 2)->nullable()->after('price');
        });

        // Add auto_issue to certificates
        Schema::table('certificates', function (Blueprint $table) {
            $table->boolean('auto_issued')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn('auto_issued');
        });
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['estimated_hours', 'certificate_auto_issue', 'discount_price']);
        });
        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupons');
        Schema::table('lesson_assessment_submissions', function (Blueprint $table) {
            $table->dropColumn(['file_urls', 'submission_text']);
        });
        Schema::table('course_discussions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lesson_id');
        });
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quizzes');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('question_banks');
        Schema::dropIfExists('course_reviews');
        Schema::dropIfExists('lesson_notes');
        Schema::dropIfExists('announcements');
    }
};
