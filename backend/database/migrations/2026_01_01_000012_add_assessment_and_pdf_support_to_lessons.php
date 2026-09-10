<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('pdf_url')->nullable()->after('youtube_url');
            $table->enum('assessment_type', ['none', 'mcq', 'written'])->default('none')->after('pdf_url');
            $table->longText('assessment_config')->nullable()->after('assessment_type');
        });

        Schema::create('lesson_assessment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->json('answers')->nullable();
            $table->integer('score')->nullable();
            $table->enum('status', ['submitted', 'reviewed'])->default('submitted');
            $table->text('teacher_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_assessment_submissions');

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['pdf_url', 'assessment_type', 'assessment_config']);
        });
    }
};
