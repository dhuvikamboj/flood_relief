<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReliefRequest extends Model
{
    protected $table = 'relief_requests';

    protected $fillable = [
        'location',
        'address',
        'contact',
        'priority',
        'request_type',
        'details',
        'lat',
        'lng',
        'photos',
        'videos',
        'status',
        'user_id',
    ];

    protected $casts = [
        'photos' => 'array',
        'videos' => 'array',
        'lat' => 'float',
        'lng' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
