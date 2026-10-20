<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\CouponUsage;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function validate(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'course_id' => 'required|exists:courses,id',
            'amount' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($validated['code']))
            ->where('is_active', true)
            ->first();

        if (!$coupon) {
            return response()->json(['message' => 'Invalid coupon code.'], 422);
        }

        if ($coupon->starts_at && now()->lt($coupon->starts_at)) {
            return response()->json(['message' => 'This coupon is not yet active.'], 422);
        }

        if ($coupon->expires_at && now()->gt($coupon->expires_at)) {
            return response()->json(['message' => 'This coupon has expired.'], 422);
        }

        if ($coupon->max_uses && $coupon->used_count >= $coupon->max_uses) {
            return response()->json(['message' => 'This coupon has reached its usage limit.'], 422);
        }

        if ($coupon->min_amount && $validated['amount'] < $coupon->min_amount) {
            return response()->json(['message' => "Minimum order amount of \${$coupon->min_amount} required."], 422);
        }

        $discount = $coupon->type === 'percentage'
            ? ($validated['amount'] * $coupon->value / 100)
            : $coupon->value;

        $discount = min($discount, $validated['amount']);

        return response()->json([
            'valid' => true,
            'coupon' => $coupon,
            'discount_amount' => round($discount, 2),
            'final_amount' => round($validated['amount'] - $discount, 2),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'code' => 'required|string|unique:coupons,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_amount' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
        ]);

        $coupon = Coupon::create([
            ...$validated,
            'code' => strtoupper($validated['code']),
            'is_active' => true,
        ]);

        return response()->json($coupon, 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(Coupon::latest()->get());
    }
}
