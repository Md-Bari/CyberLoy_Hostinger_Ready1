<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->change();
            $table->timestamp('email_verified_at')->nullable()->after('email');
        });
        DB::table('users')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);

        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('instructor_id')->nullable()->after('title')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('checkout_session_id')->nullable()->unique();
        });

        Schema::table('lesson_assessment_submissions', function (Blueprint $table) {
            $table->unsignedInteger('attempt_number')->default(1);
            $table->boolean('passed')->default(false);
        });
        DB::table('lesson_progress')
            ->whereIn('lesson_id', DB::table('lessons')->where('assessment_type', '!=', 'none')->select('id'))
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('lesson_assessment_submissions')
                    ->whereColumn('lesson_assessment_submissions.lesson_id', 'lesson_progress.lesson_id')
                    ->whereColumn('lesson_assessment_submissions.user_id', 'lesson_progress.user_id')
                    ->where('lesson_assessment_submissions.passed', true);
            })
            ->update(['status' => 'in_progress', 'completed_at' => null]);
        DB::table('enrollments')
            ->where('status', 'completed')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('lesson_progress')
                    ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
                    ->join('course_sections', 'course_sections.id', '=', 'lessons.section_id')
                    ->whereColumn('lesson_progress.user_id', 'enrollments.user_id')
                    ->whereColumn('course_sections.course_id', 'enrollments.course_id')
                    ->where('lesson_progress.status', 'in_progress')
                    ->where('lessons.assessment_type', '!=', 'none')
                    ->where(function ($required) {
                        $required->where('lessons.is_required', true)
                            ->orWhereNotExists(function ($nested) {
                                $nested->select(DB::raw(1))
                                    ->from('lessons as required_lessons')
                                    ->join('course_sections as required_sections', 'required_sections.id', '=', 'required_lessons.section_id')
                                    ->whereColumn('required_sections.course_id', 'enrollments.course_id')
                                    ->where('required_lessons.is_required', true);
                            });
                    });
            })
            ->update(['status' => 'enrolled', 'completed_at' => null]);

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('course_discussions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()
                ->constrained('course_discussions')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
            $table->index(['course_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_discussions');
        Schema::dropIfExists('password_reset_tokens');

        Schema::table('lesson_assessment_submissions', function (Blueprint $table) {
            $table->dropColumn(['attempt_number', 'passed']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['checkout_session_id']);
            $table->dropColumn('checkout_session_id');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('instructor_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('email_verified_at');
        });
        DB::table('users')->where('role', 'instructor')->update(['role' => 'user']);
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'user'])->default('user')->change();
        });
    }
};
