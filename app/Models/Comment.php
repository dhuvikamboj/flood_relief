<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    protected $fillable = [
        'relief_request_id',
        'user_id',
        'comment',
    ];

    public function reliefRequest(): BelongsTo
    {
        return $this->belongsTo(ReliefRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
