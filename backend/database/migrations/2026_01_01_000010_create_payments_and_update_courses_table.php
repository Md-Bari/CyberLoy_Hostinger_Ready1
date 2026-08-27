<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->decimal('price', 8, 2)->default(49.00)->after('description');
            $table->string('currency')->default('USD')->after('price');
            $table->boolean('requires_payment')->default(true)->after('currency');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 8, 2);
            $table->string('currency')->default('USD');
            $table->string('payment_method')->default('card');
            $table->string('transaction_id')->unique();
            $table->string('status')->default('completed');
            $table->string('payer_name')->nullable();
            $table->string('payer_email')->nullable();
            $table->string('card_last_four', 4)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->string('payment_status')->default('paid')->after('status');
            $table->foreignId('payment_id')->nullable()->after('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'payment_id']);
        });

        Schema::dropIfExists('payments');

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['price', 'currency', 'requires_payment']);
        });
    }
};
