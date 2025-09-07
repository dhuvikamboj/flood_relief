<?php

namespace Tests\Feature;

use App\Models\ReliefRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReliefRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_relief_request_with_authentication()
    {
        $user = User::factory()->create();

        $data = [
            'location' => 'Test Location',
            'address' => '123 Test Street',
            'contact' => '123-456-7890',
            'priority' => 'High',
            'requestType' => 'Medical',
            'details' => 'Test relief request details',
            'coords' => [
                'lat' => 30.554685,
                'lng' => 74.230821
            ]
        ];

        $response = $this->actingAs($user, 'sanctum')
                        ->postJson('/api/requests', $data);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'location' => 'Test Location',
                        'user_id' => $user->id
                    ]
                ]);

        $this->assertDatabaseHas('relief_requests', [
            'location' => 'Test Location',
            'user_id' => $user->id
        ]);
    }
}
