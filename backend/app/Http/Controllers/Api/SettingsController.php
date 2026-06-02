<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();
        abort_unless(Hash::check($data['current_password'], $user->password), 422, 'Current password is incorrect.');

        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'Password updated']);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            'desktop_notifications' => ['required', 'boolean'],
            'dark_mode' => ['required', 'boolean'],
            'ai_suggestions' => ['required', 'boolean'],
        ]);

        $request->user()->update(['preferences' => $data]);

        return response()->json([
            'preferences' => $data,
        ]);
    }
}
