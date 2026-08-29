<?php

namespace App\Http\Controllers\Api\Activities;

use App\Application\Activities\DuplicateActivityException;
use App\Application\Activities\ImportGpxActivity;
use App\Http\Controllers\Controller;
use App\Infrastructure\Gpx\InvalidGpxException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

final class ImportActivityController extends Controller
{
    public function __invoke(Request $request, ImportGpxActivity $importer): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ], [
            'file.uploaded' => 'The GPX file could not be uploaded. Check the server PHP upload_max_filesize and post_max_size limits.',
            'file.max' => 'The GPX file must not be larger than 10 MiB.',
        ]);

        /** @var UploadedFile $file */
        $file = $validated['file'];

        if (strtolower($file->getClientOriginalExtension()) !== 'gpx') {
            return response()->json([
                'message' => 'The file must have a .gpx extension.',
            ], 422);
        }

        $xml = file_get_contents($file->getRealPath());

        if ($xml === false) {
            return response()->json([
                'message' => 'Unable to read uploaded GPX file.',
            ], 422);
        }

        try {
            $activity = $importer->import(
                user: $request->user(),
                xml: $xml,
                originalName: $file->getClientOriginalName(),
                mimeType: $file->getClientMimeType(),
            );
        } catch (DuplicateActivityException $exception) {
            return response()->json([
                'message' => 'This GPX file has already been imported.',
                'activity_id' => $exception->activityId,
            ], 409);
        } catch (InvalidGpxException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'activity' => [
                'id' => $activity->id,
                'name' => $activity->name,
                'started_at' => $activity->started_at?->toAtomString(),
                'distance_meters' => $activity->distance_meters,
                'elapsed_time_seconds' => $activity->elapsed_time_seconds,
                'moving_time_seconds' => $activity->moving_time_seconds,
                'average_speed_mps' => $activity->average_speed_mps,
                'max_speed_mps' => $activity->max_speed_mps,
                'elevation_gain_meters' => $activity->elevation_gain_meters,
                'elevation_loss_meters' => $activity->elevation_loss_meters,
            ],
        ], 201);
    }
}
