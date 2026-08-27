<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\Module;
use App\Models\Task;
use App\Models\Enrollment;
use App\Models\TaskCompletion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Admin & Student Users
        $admin = User::firstOrCreate([
            'email' => 'admin@cyberloy.com',
        ], [
            'name' => 'System Administrator',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $student = User::firstOrCreate([
            'email' => 'student@cyberloy.com',
        ], [
            'name' => 'Alex Johnson',
            'password' => Hash::make('password123'),
            'role' => 'user',
        ]);

        // 2. Create Demo Courses
        $course1 = Course::firstOrCreate([
            'slug' => 'cybersecurity-fundamentals',
        ], [
            'title' => 'Cybersecurity Fundamentals & Threat Analysis',
            'description' => 'Master core security concepts, network defense, threat intelligence, and vulnerability assessments.',
            'level' => 'Beginner',
            'is_published' => true,
        ]);

        $course2 = Course::firstOrCreate([
            'slug' => 'web-app-pentesting',
        ], [
            'title' => 'Web Application Penetration Testing',
            'description' => 'Hands-on web security testing covering OWASP Top 10, SQL injection, XSS, and exploit analysis.',
            'level' => 'Intermediate',
            'is_published' => true,
        ]);

        // 3. Create Modules
        $m1 = Module::firstOrCreate([
            'course_id' => $course1->id,
            'title' => 'Module 1: Introduction to Information Security',
        ], ['order' => 1]);

        $m2 = Module::firstOrCreate([
            'course_id' => $course1->id,
            'title' => 'Module 2: Network Defense Architecture',
        ], ['order' => 2]);

        $m3 = Module::firstOrCreate([
            'course_id' => $course2->id,
            'title' => 'Module 1: OWASP Security Vulnerabilities',
        ], ['order' => 1]);

        // 4. Create Tasks
        $t1 = Task::firstOrCreate([
            'module_id' => $m1->id,
            'title' => 'Task 1.1: Complete Confidentiality, Integrity & Availability Quiz',
        ], [
            'description' => 'Review the CIA triad and score 80%+ on the fundamentals assessment.',
            'order' => 1,
        ]);

        $t2 = Task::firstOrCreate([
            'module_id' => $m1->id,
            'title' => 'Task 1.2: Identify Common Attack Vectors',
        ], [
            'description' => 'Analyze sample phishing and malware threat scenarios.',
            'order' => 2,
        ]);

        $t3 = Task::firstOrCreate([
            'module_id' => $m2->id,
            'title' => 'Task 2.1: Configure Firewall Policies & IDS/IPS Rules',
        ], [
            'description' => 'Set up basic rules for blocking suspicious ports.',
            'order' => 1,
        ]);

        $t4 = Task::firstOrCreate([
            'module_id' => $m2->id,
            'title' => 'Task 2.2: Perform Port Scanning with Nmap',
        ], [
            'description' => 'Scan target sandbox IP to catalog open ports and active services.',
            'order' => 2,
        ]);

        // 5. Enroll Demo Student
        Enrollment::firstOrCreate([
            'user_id' => $student->id,
            'course_id' => $course1->id,
        ], [
            'status' => 'enrolled',
        ]);

        // 6. Set initial task completion for student (50%)
        TaskCompletion::firstOrCreate([
            'user_id' => $student->id,
            'task_id' => $t1->id,
        ]);
        TaskCompletion::firstOrCreate([
            'user_id' => $student->id,
            'task_id' => $t2->id,
        ]);
    }
}
