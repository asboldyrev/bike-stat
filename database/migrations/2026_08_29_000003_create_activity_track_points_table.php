<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_track_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('segment_index');
            $table->unsignedInteger('sequence');
            $table->timestamp('recorded_at')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->double('elevation_meters')->nullable();
            $table->unsignedSmallInteger('heart_rate')->nullable();
            $table->unsignedSmallInteger('cadence')->nullable();
            $table->double('power_watts')->nullable();
            $table->double('temperature_celsius')->nullable();
            $table->double('source_distance_meters')->nullable();
            $table->double('source_speed_mps')->nullable();
            $table->double('course_degrees')->nullable();
            $table->timestamps();

            $table->unique(['activity_id', 'segment_index', 'sequence'], 'activity_point_order_unique');
            $table->index(['activity_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_track_points');
    }
};
