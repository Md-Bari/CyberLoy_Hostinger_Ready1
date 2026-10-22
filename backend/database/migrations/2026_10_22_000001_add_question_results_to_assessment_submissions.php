<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_assessment_submissions', function (Blueprint $table) {
            $table->json('question_results')->nullable()->after('answers');
        });
    }

    public function down(): void
    {
        Schema::table('lesson_assessment_submissions', function (Blueprint $table) {
            $table->dropColumn('question_results');
        });
    }
};
