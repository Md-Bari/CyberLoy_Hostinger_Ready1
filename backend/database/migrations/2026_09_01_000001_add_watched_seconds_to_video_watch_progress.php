<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('video_watch_progress', function (Blueprint $table) {
            $table->integer('watched_seconds')->default(0)->after('watch_percentage');
        });
    }

    public function down(): void
    {
        Schema::table('video_watch_progress', function (Blueprint $table) {
            $table->dropColumn('watched_seconds');
        });
    }
};
