<?php

namespace Tests\Feature;

use App\Models\ReliefRequest;
use App\Models\ReliefResource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ExpireBehaviorTest extends TestCase
{
    use RefreshDatabase;

    public function test_mark_expired_command_marks_records()
    {
        $user = User::factory()->create();

        // create a request expired yesterday
        $request = ReliefRequest::create([
            'location' => 'Expired Location',
            'priority' => 'Low',
            'details' => 'Old request',
            'lat' => 30.5,
            'lng' => 74.2,
            'user_id' => $user->id,
            'status' => 'pending',
            'expire_at' => now()->subDay()->toDateTimeString(),
        ]);

        // create a resource expired yesterday
        $resource = ReliefResource::create([
            'location' => 'Expired Resource',
            'resource_type' => 'food',
            'details' => 'Old resource',
            'lat' => 30.6,
            'lng' => 74.25,
            'user_id' => $user->id,
            'availability' => 'available',
            'expire_at' => now()->subDay()->toDateTimeString(),
        ]);

        // run the artisan command
        Artisan::call('app:mark-expired');

        // refresh models
        $request->refresh();
        $resource->refresh();

        $this->assertEquals('expired', $request->status);
        $this->assertEquals('unavailable', $resource->availability);
    }
}
