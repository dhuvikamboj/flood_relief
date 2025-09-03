<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReliefRequest extends FormRequest
{
    public function authorize()
    {
        // allow unauthenticated submissions for now; adapt if you restrict to auth later
        return true;
    }

    public function rules()
    {
        return [
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
            'priority' => 'required|string|in:Low,Medium,High',
            'requestType' => 'required|string|in:Food,Water,Shelter,Medical,Animal,Other',
            'details' => 'required|string',
            'coords.lat' => 'nullable|numeric',
            'coords.lng' => 'nullable|numeric',
            'photos.*' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:5120',
            // allow common video mime types and increase limit to ~50MB
            'videos.*' => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/3gpp,video/3gpp2,video/webm|max:50000',
        ];
    }

    public function attributes()
    {
        return [
            'requestType' => 'request type',
        ];
    }
}
