<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReliefResource extends Model
{
    protected $table = 'relief_resources';

    protected $fillable = [
        'location',
        'address',
        'contact',
        'contact_phone',
        'resource_type',
        'details',
        'capacity',
        'availability',
        'lat',
        'lng',
        'photos',
        'videos',
        'user_id',
    ];

    protected $casts = [
        'photos' => 'array',
        'videos' => 'array',
        'lat' => 'float',
        'lng' => 'float',
        'capacity' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class, 'relief_request_id'); // reusing comments table
    }
}
