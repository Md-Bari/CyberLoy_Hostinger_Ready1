<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureInstructor
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'instructor'], true)) {
            return response()->json(['message' => 'Instructor access required.'], 403);
        }

        return $next($request);
    }
}
