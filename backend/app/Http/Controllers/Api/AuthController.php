<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user and return a JWT token.
     */
    public function register(Request $request)
    {
        $currentUser = auth('api')->user();

        if (!$currentUser || $currentUser->role !== 'admin') {
            return response()->json([
                'message' => 'Only administrators can create new users.',
            ], 403);
        }

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'nullable|in:user,admin',
        ]);

        $role = $request->role === 'admin' ? 'admin' : 'user';

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $role,
        ]);

        return response()->json([
            'message' => $role === 'admin' ? 'Admin account created successfully.' : 'User account created successfully.',
            'user'    => $user,
        ], 201);
    }

    /**
     * Authenticate user and return a JWT token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $credentials = $request->only('email', 'password');

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.',
                'errors'  => ['email' => ['Invalid credentials.']],
            ], 401);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Return the authenticated user.
     */
    public function me(Request $request)
    {
        return response()->json(auth('api')->user());
    }

    /**
     * Invalidate the JWT token (logout).
     */
    public function logout(Request $request)
    {
        auth('api')->logout();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Refresh the JWT token and return a new one.
     */
    public function refresh(Request $request)
    {
        try {
            $newToken = auth('api')->refresh();
            return $this->respondWithToken($newToken);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Token cannot be refreshed. Please login again.'], 401);
        }
    }

    /**
     * Format a token response.
     */
    protected function respondWithToken(string $token)
    {
        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user'       => auth('api')->user(),
        ]);
    }
}
