<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('source')->default('gpx');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->double('distance_meters')->default(0);
            $table->unsignedInteger('elapsed_time_seconds')->nullable();
            $table->unsignedInteger('moving_time_seconds')->nullable();
            $table->double('average_speed_mps')->nullable();
            $table->double('max_speed_mps')->nullable();
            $table->double('elevation_gain_meters')->default(0);
            $table->double('elevation_loss_meters')->default(0);
            $table->double('minimum_elevation_meters')->nullable();
            $table->double('maximum_elevation_meters')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
