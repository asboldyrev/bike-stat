<?php

use App\Application\Activities\RecalculateActivityStatistics;
use App\Models\Activity;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('activities:recalculate {activity?}', function (?string $activity = null) {
    $recalculator = app(RecalculateActivityStatistics::class);

    $query = Activity::query()->with('file')->orderBy('id');

    if ($activity !== null) {
        $query->whereKey((int) $activity);
    }

    $count = 0;

    $query->each(function (Activity $model) use ($recalculator, &$count): void {
        $recalculator->recalculate($model);
        $this->line(sprintf(
            'Recalculated activity %d: %.2f km, max %.1f km/h',
            $model->id,
            $model->distance_meters / 1000,
            ($model->max_speed_mps ?? 0) * 3.6,
        ));
        $count++;
    });

    if ($activity !== null && $count === 0) {
        $this->error('Activity not found.');

        return 1;
    }

    $this->info(sprintf('Recalculated %d activit%s.', $count, $count === 1 ? 'y' : 'ies'));

    return 0;
})->purpose('Recalculate stored activity statistics from original GPX files');
