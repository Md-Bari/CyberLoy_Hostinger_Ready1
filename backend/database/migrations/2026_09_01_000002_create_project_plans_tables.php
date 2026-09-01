<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Project Plans Table
        Schema::create('project_plans', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('standard')->default('ISO 27001');
            $table->text('description')->nullable();
            $table->string('company_name')->nullable();
            $table->string('project_owner')->nullable();
            $table->date('start_date')->nullable();
            $table->date('target_date')->nullable();
            $table->integer('weeks_duration')->default(12);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Project Tasks Table
        Schema::create('project_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_plan_id')->constrained('project_plans')->cascadeOnDelete();
            $table->string('phase'); // e.g. Project setup kick-off, Implementation phase, etc.
            $table->string('prefix')->nullable(); // e.g. 1.1, 2.1
            $table->string('title');
            $table->text('details')->nullable();
            $table->text('comments')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 3. Project Assignments Table
        Schema::create('project_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_plan_id')->constrained('project_plans')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('assigned_at')->useCurrent();
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->unique(['project_plan_id', 'user_id']);
        });

        // 4. Project Task Progress Table
        Schema::create('project_task_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_plan_id')->constrained('project_plans')->cascadeOnDelete();
            $table->foreignId('project_task_id')->constrained('project_tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('progress_percentage')->default(0); // 0 - 100
            $table->enum('status', ['not_started', 'in_progress', 'completed'])->default('not_started');
            $table->text('user_comments')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['project_task_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_task_progress');
        Schema::dropIfExists('project_assignments');
        Schema::dropIfExists('project_tasks');
        Schema::dropIfExists('project_plans');
    }
};
