<?php

namespace App\Application\Activities;

use RuntimeException;

final class DuplicateActivityException extends RuntimeException
{
    public function __construct(public readonly int $activityId)
    {
        parent::__construct('This GPX file has already been imported.');
    }
}
