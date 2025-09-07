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
    'expire_at',
        'user_id',
    ];

    protected $casts = [
        'photos' => 'array',
        'videos' => 'array',
        'lat' => 'float',
        'lng' => 'float',
        'capacity' => 'integer',
    'expire_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class, 'relief_request_id'); // reusing comments table
    }

    public function getIsExpiredAttribute()
    {
        if (! $this->expire_at) {
            return false;
        }
        return $this->expire_at->isPast();
    }

    /**
     * Scope to only include not-expired items (expire_at null or in the future).
     */
    public function scopeNotExpired($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expire_at')
              ->orWhere('expire_at', '>', now());
        });
    }

    /**
     * Scope to only include expired items.
     */
    public function scopeExpired($query)
    {
        return $query->whereNotNull('expire_at')->where('expire_at', '<=', now());
    }
}
