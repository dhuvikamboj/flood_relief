<?php

namespace App\Http\Controllers;

use App\Models\ReliefResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReliefResourceController extends Controller
{
    public function store(Request $req)
    {
        $data = $req->validate([
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:255',
            'resource_type' => 'nullable|string|max:255',
            'details' => 'nullable|string',
            'capacity' => 'nullable|integer|min:0',
            'availability' => 'nullable|string|in:available,limited,unavailable',
            'coords.lat' => 'nullable|numeric|between:-90,90',
            'coords.lng' => 'nullable|numeric|between:-180,180',
            'photos' => 'nullable|array|max:10',
            'photos.*' => 'file|mimes:jpeg,jpg,png,gif|max:5120', // 5MB max
            'videos' => 'nullable|array|max:5',
            'videos.*' => 'file|mimes:mp4,mov,avi|max:20480', // 20MB max
        ]);

        $lat = data_get($data, 'coords.lat');
        $lng = data_get($data, 'coords.lng');

        $photos = [];
        $errors = [];
        if ($req->hasFile('photos')) {
            foreach ($req->file('photos') as $i => $file) {
                if (! $file->isValid()) {
                    $errors["photos.$i"] = [$this->uploadErrorMessage($file->getError())];
                    continue;
                }
                $path = $file->store('relief_uploads/photos', 'public');
                $photos[] = Storage::disk('public')->url($path);
            }
        }

        $videos = [];
        if ($req->hasFile('videos')) {
            foreach ($req->file('videos') as $i => $file) {
                if (! $file->isValid()) {
                    $errors["videos.$i"] = [$this->uploadErrorMessage($file->getError())];
                    continue;
                }
                $path = $file->store('relief_uploads/videos', 'public');
                $videos[] = Storage::disk('public')->url($path);
            }
        }

        if (! empty($errors)) {
            return response()->json(['message' => 'Some files failed to upload', 'errors' => $errors], 422);
        }

        $resource = ReliefResource::create([
            'location' => $data['location'] ?? null,
            'address' => $data['address'] ?? null,
            'contact' => $data['contact'] ?? null,
            'contact_phone' => $data['contact_phone'] ?? null,
            'resource_type' => $data['resource_type'] ?? null,
            'details' => $data['details'] ?? null,
            'capacity' => $data['capacity'] ?? null,
            'availability' => $data['availability'] ?? 'available',
            'lat' => $lat,
            'lng' => $lng,
            'photos' => $photos ?: null,
            'videos' => $videos ?: null,
            'user_id' => $req->user()?->id,
        ]);

        return response()->json(['success' => true, 'data' => $resource], 201);
    }

    protected function uploadErrorMessage($code)
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the form MAX_FILE_SIZE directive.',
            UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded.',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
            default => 'Unknown upload error.',
        };
    }

    public function index(Request $request)
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        $radius = $request->query('radius_km', 5);
        $resourceType = $request->query('resource_type');
        $availability = $request->query('availability');
        $search = $request->query('search');

        if (!$lat || !$lng) {
            return response()->json(['success' => false, 'message' => 'lat and lng are required'], 400);
        }

        // Use subquery to calculate distance and filter, compatible with SQLite
        $subQuery = "SELECT rr.*, u.name as reporter_name, u.email as reporter_email, u.phone as reporter_phone, (6371 * acos(cos(radians(?)) * cos(radians(rr.lat)) * cos(radians(rr.lng) - radians(?)) + sin(radians(?)) * sin(radians(rr.lat)))) as distance_km FROM relief_resources rr LEFT JOIN users u ON rr.user_id = u.id WHERE rr.lat IS NOT NULL AND rr.lng IS NOT NULL";

        $query = \DB::table(\DB::raw("($subQuery) as sub"))
            ->setBindings([$lat, $lng, $lat]);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('location', 'LIKE', "%{$search}%")
                  ->orWhere('address', 'LIKE', "%{$search}%")
                  ->orWhere('contact', 'LIKE', "%{$search}%")
                  ->orWhere('details', 'LIKE', "%{$search}%")
                  ->orWhere('resource_type', 'LIKE', "%{$search}%")
                  ->orWhere('reporter_name', 'LIKE', "%{$search}%")
                  ->orWhere('reporter_email', 'LIKE', "%{$search}%")
                  ->orWhere('reporter_phone', 'LIKE', "%{$search}%");
            });
        }

        // Apply filters
        if ($resourceType && $resourceType !== 'all') {
            $query->where('resource_type', $resourceType);
        }
        if ($availability && $availability !== 'all') {
            $query->where('availability', $availability);
        }

        $resources = $query
            ->where('distance_km', '<=', $radius)
            ->orderBy('distance_km')
            ->get();

        // Add comments to each resource
        $resourcesWithComments = $resources->map(function ($resource) {
            $comments = \DB::table('comments')
                ->join('users', 'comments.user_id', '=', 'users.id')
                ->where('comments.relief_request_id', $resource->id) // reusing comments table
                ->select('comments.id', 'comments.comment', 'comments.created_at', 'users.id as user_id', 'users.name as user_name', 'users.email as user_email')
                ->orderBy('comments.created_at', 'asc')
                ->get()
                ->map(function ($comment) {
                    return [
                        'id' => $comment->id,
                        'comment' => $comment->comment,
                        'created_at' => $comment->created_at,
                        'user' => [
                            'id' => $comment->user_id,
                            'name' => $comment->user_name,
                            'email' => $comment->user_email,
                        ],
                    ];
                });

            $resource->comments = $comments;
            return $resource;
        });

        return response()->json(['success' => true, 'data' => $resourcesWithComments]);
    }

    public function updateAvailability(Request $request, $id)
    {
        $request->validate([
            'availability' => 'required|in:available,limited,unavailable'
        ]);

        $resource = ReliefResource::findOrFail($id);

        // Check if the user owns this resource
        if ($resource->user_id != $request->user()?->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update your own resources'
            ], 403);
        }

        $resource->update(['availability' => $request->availability]);

        return response()->json([
            'success' => true,
            'data' => $resource,
            'message' => 'Availability updated successfully'
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $resource = ReliefResource::findOrFail($id);

        // Check if the user owns this resource
        if ($resource->user_id != $request->user()?->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own resources'
            ], 403);
        }

        $resource->delete();

        return response()->json([
            'success' => true,
            'message' => 'Resource deleted successfully'
        ]);
    }

    public function getAvailabilities()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'available' => 'Available',
                'limited' => 'Limited',
                'unavailable' => 'Unavailable'
            ]
        ]);
    }

    public function getUserResources(Request $request)
    {
        $user = $request->user();

        $resources = ReliefResource::where('user_id', $user->id)
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        // Add comments to each resource (similar to index method)
        $resourcesWithComments = $resources->map(function ($resource) {
            $comments = \DB::table('comments')
                ->join('users', 'comments.user_id', '=', 'users.id')
                ->where('comments.relief_request_id', $resource->id) // reusing comments table
                ->select('comments.id', 'comments.comment', 'comments.created_at', 'users.id as user_id', 'users.name as user_name', 'users.email as user_email')
                ->orderBy('comments.created_at', 'asc')
                ->get()
                ->map(function ($comment) {
                    return [
                        'id' => $comment->id,
                        'comment' => $comment->comment,
                        'created_at' => $comment->created_at,
                        'user' => [
                            'id' => $comment->user_id,
                            'name' => $comment->user_name,
                            'email' => $comment->user_email,
                        ],
                    ];
                });

            $resource->comments = $comments;
            return $resource;
        });

        return response()->json([
            'success' => true,
            'data' => $resourcesWithComments
        ]);
    }
}
