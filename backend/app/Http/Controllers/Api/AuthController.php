<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

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
            'password' => 'required|string|min:12',
            'role'     => 'nullable|in:user,instructor,admin',
        ]);

        $role = $request->role ?? 'user';

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $role,
        ]);
        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Account created. A verification link has been sent to the user.',
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

        $user = auth('api')->user();
        if (config('lms.require_email_verification') && !$user->hasVerifiedEmail()) {
            auth('api')->logout();

            return response()->json([
                'message' => 'Verify your email address before signing in.',
                'email_verification_required' => true,
            ], 403);
        }

        return $this->respondWithToken($token);
    }

    public function sendPasswordResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If an account exists for that email address, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:12|confirmed',
        ]);

        $status = Password::reset($validated, function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();
        });

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'This password reset link is invalid or expired. Request a new one.',
            ], 422);
        }

        return response()->json(['message' => 'Password reset successfully. You can now sign in.']);
    }

    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);
        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'Invalid email verification link.');
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect()->away(rtrim(config('lms.frontend_url'), '/') . '/email-verified?status=success');
    }

    public function resendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if ($user && !$user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => 'If the account needs verification, a new link has been sent.',
        ]);
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
