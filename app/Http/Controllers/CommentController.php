<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\ReliefRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    /**
     * Display a listing of comments for a specific relief request.
     */
    public function index(Request $request, $reliefRequestId): JsonResponse
    {
        $comments = Comment::where('relief_request_id', $reliefRequestId)
            ->with('user:id,name,email')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $comments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'comment' => $comment->comment,
                    'created_at' => $comment->created_at,
                    'user' => [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                        'email' => $comment->user->email,
                    ],
                ];
            }),
        ]);
    }

    /**
     * Store a newly created comment.
     */
    public function store(Request $request, $reliefRequestId): JsonResponse
    {
        $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        // Check if the relief request exists
        $reliefRequest = ReliefRequest::findOrFail($reliefRequestId);

        $comment = Comment::create([
            'relief_request_id' => $reliefRequestId,
            'user_id' => Auth::id(),
            'comment' => $request->comment,
        ]);

        $comment->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $comment->id,
                'comment' => $comment->comment,
                'created_at' => $comment->created_at,
                'user' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                    'email' => $comment->user->email,
                ],
            ],
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
