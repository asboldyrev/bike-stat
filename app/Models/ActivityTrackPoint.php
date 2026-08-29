<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'activity_id',
    'segment_index',
    'sequence',
    'recorded_at',
    'latitude',
    'longitude',
    'elevation_meters',
    'heart_rate',
    'cadence',
    'power_watts',
    'temperature_celsius',
    'source_distance_meters',
    'source_speed_mps',
    'course_degrees',
])]
class ActivityTrackPoint extends Model
{
    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }
}
