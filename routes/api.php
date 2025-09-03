<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ReliefRequestController;
use App\Http\Controllers\ReliefResourceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::match(['put','patch'], '/user', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user/requests', [ReliefRequestController::class, 'getUserRequests']);
    Route::get('/user/resources', [ReliefResourceController::class, 'getUserResources']);

    // Relief Requests
    Route::post('/requests', [ReliefRequestController::class, 'store']);
    Route::get('/requests', [ReliefRequestController::class, 'index']);
    Route::patch('/requests/{id}/status', [ReliefRequestController::class, 'updateStatus']);
    Route::delete('/requests/{id}', [ReliefRequestController::class, 'destroy']);
    Route::get('/requests/statuses', [ReliefRequestController::class, 'getStatuses']);

    // Relief Resources
    Route::post('/resources', [ReliefResourceController::class, 'store']);
    Route::get('/resources', [ReliefResourceController::class, 'index']);
    Route::patch('/resources/{id}/availability', [ReliefResourceController::class, 'updateAvailability']);
    Route::delete('/resources/{id}', [ReliefResourceController::class, 'destroy']);
    Route::get('/resources/availabilities', [ReliefResourceController::class, 'getAvailabilities']);

    // Comment routes (for both requests and resources)
    Route::get('/requests/{reliefRequestId}/comments', [CommentController::class, 'index']);
    Route::post('/requests/{reliefRequestId}/comments', [CommentController::class, 'store']);
    Route::get('/resources/{reliefResourceId}/comments', [CommentController::class, 'index']);
    Route::post('/resources/{reliefResourceId}/comments', [CommentController::class, 'store']);
});

