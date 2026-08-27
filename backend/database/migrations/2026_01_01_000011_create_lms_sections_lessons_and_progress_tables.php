<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Enhance courses table
        Schema::table('courses', function (Blueprint $table) {
            $table->string('instructor_name')->nullable()->default('CyberLoy Security Team')->after('level');
            $table->string('category')->nullable()->default('Cybersecurity')->after('instructor_name');
            $table->string('duration')->nullable()->default('4 Weeks')->after('category');
            $table->text('prerequisites')->nullable()->after('duration');
            $table->text('learning_objectives')->nullable()->after('prerequisites');
            $table->enum('progression_mode', ['sequential', 'open'])->default('sequential')->after('learning_objectives');
            $table->enum('status', ['draft', 'published', 'unpublished', 'archived'])->default('published')->after('progression_mode');
        });

        // 2. Create course_sections table (hierarchy layer 2)
        Schema::create('course_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(1);
            $table->timestamps();
        });

        // 3. Create lessons table (hierarchy layer 3)
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('course_sections')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->longText('content')->nullable();
            $table->string('youtube_url')->nullable();
            $table->string('youtube_video_id')->nullable();
            $table->integer('duration_seconds')->default(600); // 10 minutes default
            $table->integer('sort_order')->default(1);
            $table->boolean('is_required')->default(true);
            $table->enum('completion_type', ['video', 'content', 'manual'])->default('video');
            $table->integer('required_watch_percentage')->default(100);
            $table->timestamps();
        });

        // 4. Create lesson_progress table
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('section_id')->constrained('course_sections')->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->enum('status', ['not_started', 'in_progress', 'completed'])->default('not_started');
            $table->integer('progress_percentage')->default(0);
            $table->integer('watched_seconds')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_accessed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
            $table->index(['user_id', 'course_id']);
        });

        // 5. Create video_watch_progress table (anti-skip heartbeat interval validation)
        Schema::create('video_watch_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->string('video_id')->nullable();
            $table->integer('current_position')->default(0);
            $table->integer('duration')->default(0);
            $table->integer('watch_percentage')->default(0);
            $table->json('watched_intervals')->nullable(); // [[0, 30], [30, 90]]
            $table->timestamp('last_heartbeat')->nullable();
            $table->boolean('completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
        });

        // 6. Enhance certificates table
        Schema::table('certificates', function (Blueprint $table) {
            $table->string('verification_code')->nullable()->unique()->after('certificate_code');
            $table->date('completion_date')->nullable()->after('verification_code');
            $table->string('certificate_url')->nullable()->after('completion_date');
            $table->enum('status', ['pending', 'issued', 'revoked'])->default('issued')->after('certificate_url');
        });

        // 7. Create audit_logs table
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('target_type')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        // Seed initial sections and lessons for existing courses with verified YouTube cybersecurity videos
        $courses = DB::table('courses')->get();
        foreach ($courses as $c) {
            // Section 1
            $s1 = DB::table('course_sections')->insertGetId([
                'course_id' => $c->id,
                'title' => 'Section 1: Foundations & Core Architecture',
                'description' => 'Introduction to key cybersecurity principles, threat modelling, and attack surface defense.',
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('lessons')->insert([
                [
                    'section_id' => $s1,
                    'title' => 'Lesson 1: Introduction to Cyber Defense Architecture',
                    'description' => 'Master the CIA triad, defense-in-depth principles, and modern enterprise network security topologies.',
                    'content' => 'In this lesson, we break down core security controls, Zero Trust architectural pillars, and network micro-segmentation.',
                    'youtube_url' => 'https://www.youtube.com/watch?v=inWWhr5tnEA',
                    'youtube_video_id' => 'inWWhr5tnEA',
                    'duration_seconds' => 720,
                    'sort_order' => 1,
                    'is_required' => true,
                    'completion_type' => 'video',
                    'required_watch_percentage' => 100,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'section_id' => $s1,
                    'title' => 'Lesson 2: Threat Intelligence & Vulnerability Scanning',
                    'description' => 'Learn how to detect indicators of compromise (IoCs), scan endpoints, and map risk matrices.',
                    'content' => 'Comprehensive walkthrough on identifying attack vectors, analyzing CVE scores, and prioritizing remediation.',
                    'youtube_url' => 'https://www.youtube.com/watch?v=bPVaOlJ6ln0',
                    'youtube_video_id' => 'bPVaOlJ6ln0',
                    'duration_seconds' => 650,
                    'sort_order' => 2,
                    'is_required' => true,
                    'completion_type' => 'video',
                    'required_watch_percentage' => 100,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            // Section 2
            $s2 = DB::table('course_sections')->insertGetId([
                'course_id' => $c->id,
                'title' => 'Section 2: Offensive Security & Web App Pentesting',
                'description' => 'Hands-on practical exploitation, OWASP Top 10 vulnerabilities, and remediation engineering.',
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('lessons')->insert([
                [
                    'section_id' => $s2,
                    'title' => 'Lesson 3: OWASP Top 10 Exploitation & SQL Injection Labs',
                    'description' => 'Analyze SQL injection flaws, Cross-Site Scripting (XSS), and Broken Access Control mechanisms.',
                    'content' => 'Deep dive into web request inspection, payload construction, and defensive input sanitization.',
                    'youtube_url' => 'https://www.youtube.com/watch?v=2_lswM1S264',
                    'youtube_video_id' => '2_lswM1S264',
                    'duration_seconds' => 840,
                    'sort_order' => 1,
                    'is_required' => true,
                    'completion_type' => 'video',
                    'required_watch_percentage' => 100,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'section_id' => $s2,
                    'title' => 'Lesson 4: Incident Response & Security Operations',
                    'description' => 'Incident containment strategies, forensic log analysis, SIEM alerting, and recovery execution.',
                    'content' => 'Understand SIEM log pipelines, triage automated alerts, and execute incident containment procedures.',
                    'youtube_url' => 'https://www.youtube.com/watch?v=U_P23SqJaDc',
                    'youtube_video_id' => 'U_P23SqJaDc',
                    'duration_seconds' => 900,
                    'sort_order' => 2,
                    'is_required' => true,
                    'completion_type' => 'video',
                    'required_watch_percentage' => 100,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('video_watch_progress');
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('course_sections');

        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['verification_code', 'completion_date', 'certificate_url', 'status']);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'instructor_name',
                'category',
                'duration',
                'prerequisites',
                'learning_objectives',
                'progression_mode',
                'status',
            ]);
        });
    }
};
