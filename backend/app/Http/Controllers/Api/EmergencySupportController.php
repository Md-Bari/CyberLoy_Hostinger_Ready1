<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmergencySupport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmergencySupportController extends Controller
{
    // Public endpoint: Submit Emergency Support Request
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'contact' => 'required|string|max:100',
            'description' => 'required|string',
        ]);

        // Create Emergency Support Ticket
        $ticket = EmergencySupport::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'contact' => $validated['contact'],
            'description' => $validated['description'],
            'status' => 'pending',
        ]);

        // Attempt sending direct emergency alert email
        try {
            $adminEmail = config('mail.from.address', 'connect@cyberloy.com');
            $subject = "🚨 CRITICAL INCIDENT ALERT: Emergency Support Request #" . $ticket->id;
            
            $content = "URGENT INCIDENT ESCALATION REPORT\n";
            $content .= "====================================\n";
            $content .= "Ticket ID: #" . $ticket->id . "\n";
            $content .= "Client Name: " . $ticket->name . "\n";
            $content .= "Email Address: " . $ticket->email . "\n";
            $content .= "Contact Number: " . $ticket->contact . "\n";
            $content .= "Submitted At: " . $ticket->created_at->format('Y-m-d H:i:s') . "\n\n";
            $content .= "INCIDENT DESCRIPTION:\n";
            $content .= $ticket->description . "\n";
            $content .= "====================================\n";
            $content .= "Please respond to this emergency request immediately in CyberLoy Admin Portal.";

            Mail::raw($content, function ($message) use ($adminEmail, $subject, $ticket) {
                $message->to($adminEmail)
                    ->replyTo($ticket->email, $ticket->name)
                    ->subject($subject);
            });
        } catch (\Exception $e) {
            Log::warning("Emergency support email dispatch warning: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Emergency support request submitted successfully. Our Incident Response Team has been notified immediately!',
            'ticket' => $ticket,
        ], 201);
    }

    // Admin endpoint: List all emergency support tickets
    public function index()
    {
        $tickets = EmergencySupport::orderBy('created_at', 'desc')->get();
        return response()->json($tickets);
    }

    // Admin endpoint: Update ticket status
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,in_progress,resolved',
        ]);

        $ticket = EmergencySupport::findOrFail($id);
        $ticket->status = $request->status;
        $ticket->save();

        return response()->json([
            'message' => 'Ticket status updated successfully.',
            'ticket' => $ticket,
        ]);
    }
}
