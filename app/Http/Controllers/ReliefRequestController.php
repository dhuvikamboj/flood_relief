<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReliefRequest;
use App\Models\ReliefRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReliefRequestController extends Controller
{
    public function store(StoreReliefRequest $req)
    {
        $data = $req->validated();

        // normalize keys coming from the frontend
        $requestType = $data['requestType'] ?? ($data['request_type'] ?? null);

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

        $rr = ReliefRequest::create([
            'location' => $data['location'] ?? null,
            'address' => $data['address'] ?? null,
            'contact' => $data['contact'] ?? null,
            'priority' => $data['priority'] ?? null,
            'request_type' => $requestType,
            'details' => $data['details'] ?? null,
            'lat' => $lat,
            'lng' => $lng,
            'photos' => $photos ?: null,
            'videos' => $videos ?: null,
            'user_id' => $req->user()?->id, // Set user_id if authenticated, null otherwise
        ]);

        return response()->json(['success' => true, 'data' => $rr], 201);
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
        $status = $request->query('status');
        $priority = $request->query('priority');
        $requestType = $request->query('request_type');
        $search = $request->query('search');

        if (!$lat || !$lng) {
            return response()->json(['success' => false, 'message' => 'lat and lng are required'], 400);
        }

  
        // Use subquery to calculate distance and filter, compatible with SQLite
        $subQuery = "SELECT rr.*, u.name as reporter_name, u.email as reporter_email, u.phone as reporter_phone, (6371 * acos(cos(radians(?)) * cos(radians(rr.lat)) * cos(radians(rr.lng) - radians(?)) + sin(radians(?)) * sin(radians(rr.lat)))) as distance_km FROM relief_requests rr LEFT JOIN users u ON rr.user_id = u.id WHERE rr.lat IS NOT NULL AND rr.lng IS NOT NULL";

        $query = \DB::table(\DB::raw("($subQuery) as sub"))
            ->setBindings([$lat, $lng, $lat]);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('location', 'LIKE', "%{$search}%")
                  ->orWhere('address', 'LIKE', "%{$search}%")
                  ->orWhere('contact', 'LIKE', "%{$search}%")
                  ->orWhere('details', 'LIKE', "%{$search}%")
                  ->orWhere('request_type', 'LIKE', "%{$search}%")
                  ->orWhere('reporter_name', 'LIKE', "%{$search}%")
                  ->orWhere('reporter_email', 'LIKE', "%{$search}%")
                  ->orWhere('reporter_phone', 'LIKE', "%{$search}%");
            });
        }

        // Apply filters
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($priority && $priority !== 'all') {
            $query->where('priority', $priority);
        }
        if ($requestType && $requestType !== 'all') {
            $query->where('request_type', $requestType);
        }

        $requests = $query
            ->where('distance_km', '<=', $radius)
            ->orderBy('distance_km')
            ->get();

        // Add comments to each request
        $requestsWithComments = $requests->map(function ($request) {
            $comments = \DB::table('comments')
                ->join('users', 'comments.user_id', '=', 'users.id')
                ->where('comments.relief_request_id', $request->id)
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

            $request->comments = $comments;
            return $request;
        });

        return response()->json(['success' => true, 'data' => $requestsWithComments]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,in-progress,completed,cancelled'
        ]);

        $reliefRequest = ReliefRequest::findOrFail($id);

        // Check if the user owns this request
        if ($reliefRequest->user_id != $request->user()?->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update your own requests'
            ], 403);
        }

        $reliefRequest->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'data' => $reliefRequest,
            'message' => 'Status updated successfully'
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $reliefRequest = ReliefRequest::findOrFail($id);

        // Check if the user owns this request
        if ($reliefRequest->user_id != $request->user()?->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own requests'
            ], 403);
        }

        $reliefRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Request deleted successfully'
        ]);
    }

    public function getStatuses()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'pending' => 'Pending',
                'in-progress' => 'In Progress',
                'completed' => 'Completed',
                'cancelled' => 'Cancelled'
            ]
        ]);
    }

    public function getUserRequests(Request $request)
    {
        $user = $request->user();

        $requests = ReliefRequest::where('user_id', $user->id)
            ->with('user:id,name,email') // Include user details
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }
}
