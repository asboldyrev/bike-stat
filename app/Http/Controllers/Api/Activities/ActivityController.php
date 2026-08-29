<?php

namespace App\Http\Controllers\Api\Activities;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $activities = Activity::query()
            ->where('user_id', $request->user()->getKey())
            ->latest('started_at')
            ->latest('id')
            ->paginate(20);

        return response()->json([
            'data' => $activities->getCollection()
                ->map(fn (Activity $activity): array => $this->summary($activity))
                ->values(),
            'meta' => [
                'current_page' => $activities->currentPage(),
                'last_page' => $activities->lastPage(),
                'per_page' => $activities->perPage(),
                'total' => $activities->total(),
            ],
        ]);
    }

    public function show(Request $request, int $activity): JsonResponse
    {
        $model = Activity::query()
            ->where('user_id', $request->user()->getKey())
            ->with(['file', 'trackPoints'])
            ->findOrFail($activity);

        return response()->json([
            'activity' => [
                ...$this->summary($model),
                'finished_at' => $model->finished_at?->toAtomString(),
                'minimum_elevation_meters' => $model->minimum_elevation_meters,
                'maximum_elevation_meters' => $model->maximum_elevation_meters,
                'file' => $model->file === null ? null : [
                    'original_name' => $model->file->original_name,
                    'mime_type' => $model->file->mime_type,
                    'size_bytes' => $model->file->size_bytes,
                ],
                'track_points' => $model->trackPoints->map(static fn ($point): array => [
                    'segment_index' => $point->segment_index,
                    'sequence' => $point->sequence,
                    'recorded_at' => $point->recorded_at?->toAtomString(),
                    'latitude' => $point->latitude,
                    'longitude' => $point->longitude,
                    'elevation_meters' => $point->elevation_meters,
                    'heart_rate' => $point->heart_rate,
                    'cadence' => $point->cadence,
                    'power_watts' => $point->power_watts,
                    'temperature_celsius' => $point->temperature_celsius,
                    'source_distance_meters' => $point->source_distance_meters,
                    'source_speed_mps' => $point->source_speed_mps,
                    'course_degrees' => $point->course_degrees,
                ])->values(),
            ],
        ]);
    }

    private function summary(Activity $activity): array
    {
        return [
            'id' => $activity->id,
            'name' => $activity->name,
            'source' => $activity->source,
            'started_at' => $activity->started_at?->toAtomString(),
            'distance_meters' => $activity->distance_meters,
            'elapsed_time_seconds' => $activity->elapsed_time_seconds,
            'moving_time_seconds' => $activity->moving_time_seconds,
            'average_speed_mps' => $activity->average_speed_mps,
            'max_speed_mps' => $activity->max_speed_mps,
            'elevation_gain_meters' => $activity->elevation_gain_meters,
            'elevation_loss_meters' => $activity->elevation_loss_meters,
        ];
    }
}
