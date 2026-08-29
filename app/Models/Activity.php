<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'user_id',
    'name',
    'source',
    'started_at',
    'finished_at',
    'distance_meters',
    'elapsed_time_seconds',
    'moving_time_seconds',
    'average_speed_mps',
    'max_speed_mps',
    'elevation_gain_meters',
    'elevation_loss_meters',
    'minimum_elevation_meters',
    'maximum_elevation_meters',
])]
class Activity extends Model
{
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function file(): HasOne
    {
        return $this->hasOne(ActivityFile::class);
    }

    public function trackPoints(): HasMany
    {
        return $this->hasMany(ActivityTrackPoint::class)
            ->orderBy('segment_index')
            ->orderBy('sequence');
    }
}
