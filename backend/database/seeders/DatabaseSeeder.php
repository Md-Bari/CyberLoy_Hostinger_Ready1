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
            'email_verified_at' => now(),
        ]);

        $student = User::firstOrCreate([
            'email' => 'student@cyberloy.com',
        ], [
            'name' => 'Alex Johnson',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'email_verified_at' => now(),
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

        $course3 = Course::firstOrCreate([
            'slug' => 'ai-security-governance',
        ], [
            'title' => 'AI Security Governance & Responsible AI Controls',
            'description' => 'Design governance programmes for AI adoption, model risk management, secure deployment practices, and AI policy enforcement.',
            'level' => 'Advanced',
            'instructor_name' => 'CyberLoy AI Governance Team',
            'category' => 'AI Security',
            'duration' => '6 Weeks',
            'prerequisites' => 'Basic cybersecurity knowledge and familiarity with enterprise controls or cloud security practices.',
            'learning_objectives' => 'Assess AI risk, define governance controls, verify model lifecycle security, configure safeguards, and measure maturity.',
            'progression_mode' => 'sequential',
            'status' => 'published',
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

        Enrollment::firstOrCreate([
            'user_id' => $student->id,
            'course_id' => $course3->id,
        ], [
            'status' => 'enrolled',
        ]);

        $aiSections = [
            [
                'title' => 'Section 1: Foundations of AI Governance',
                'description' => 'Establish the governance principles, risk lens, and enterprise accountability model needed for AI adoption.',
                'lessons' => [
                    [
                        'title' => 'Lesson 1: Why AI governance is a business control',
                        'description' => 'Understand the executive accountability, risk appetite, and trust requirements that make AI governance essential.',
                        'content' => 'AI governance is not just an IT concern. It is a business control that balances innovation with compliance, reputational risk, operational resilience, and the long-term trust required for AI adoption.',
                        'duration_seconds' => 540,
                        'completion_type' => 'content',
                        'youtube_video_id' => 'inWWhr5tnEA',
                    ],
                    [
                        'title' => 'Lesson 2: Risk framing for GenAI and model-driven workflows',
                        'description' => 'Map AI risk categories, threat scenarios, and stakeholder ownership across the enterprise.',
                        'content' => 'AI risk is different from traditional cyber risk because it combines data quality, model integrity, automation bias, third-party exposure, and human decision influence. Governance must define who owns risk decisions and how they are evidenced.',
                        'duration_seconds' => 600,
                        'completion_type' => 'content',
                        'youtube_video_id' => 'bPVaOlJ6ln0',
                    ],
                ],
            ],
            [
                'title' => 'Section 2: Policy and Model Lifecycle Controls',
                'description' => 'Translate governance intent into practical policies, review checkpoints, and secure AI lifecycle management.',
                'lessons' => [
                    [
                        'title' => 'Lesson 3: Policy design for approved AI use',
                        'description' => 'Create AI acceptable-use rules, oversight roles, and escalation paths for governed experimentation.',
                        'content' => 'An effective policy defines what can be used, by whom, under which conditions, and with which controls. This creates a clear lane for safe pilot programmes.',
                        'duration_seconds' => 660,
                        'completion_type' => 'content',
                        'youtube_video_id' => '2_lswM1S264',
                    ],
                    [
                        'title' => 'Lesson 4: Model lifecycle and security-by-design review',
                        'description' => 'Introduce review gates covering data selection, model validation, release approval, and decommissioning.',
                        'content' => 'A governed model lifecycle includes data provenance, risk evaluation, access controls, testing, deployment approval, logging, and retirement criteria.',
                        'duration_seconds' => 720,
                        'completion_type' => 'content',
                        'youtube_video_id' => 'U_P23SqJaDc',
                    ],
                ],
            ],
            [
                'title' => 'Section 3: Monitoring, Assurance, and Culture',
                'description' => 'Measure AI control effectiveness, detect drift or misuse, and embed security culture across the organization.',
                'lessons' => [
                    [
                        'title' => 'Lesson 5: Monitoring AI risk in production',
                        'description' => 'Build operational dashboards, alerts, and exception handling for prompt misuse, drift, and model abuse.',
                        'content' => 'Production assurance requires evidence generation: logging, periodic review, anomaly detection, incident escalation routes, and human oversight for model outputs that influence decisions.',
                        'duration_seconds' => 630,
                        'completion_type' => 'content',
                        'youtube_video_id' => 'jNQXAC9IVRw',
                    ],
                    [
                        'title' => 'Lesson 6: Governance maturity and continuous improvement',
                        'description' => 'Transition from reactive control checks to a mature AI governance operating rhythm.',
                        'content' => 'Maturity comes from repeatability: quarterly reviews, remediation tracking, policy updates, training, and governance reporting that speaks to executive risk appetite.',
                        'duration_seconds' => 710,
                        'completion_type' => 'content',
                        'youtube_video_id' => 'aqz-KE-bpKQ',
                    ],
                ],
            ],
        ];

        foreach ($aiSections as $sectionIndex => $sectionData) {
            $section = \App\Models\CourseSection::firstOrCreate([
                'course_id' => $course3->id,
                'title' => $sectionData['title'],
            ], [
                'description' => $sectionData['description'],
                'sort_order' => $sectionIndex + 1,
            ]);

            foreach ($sectionData['lessons'] as $lessonIndex => $lessonData) {
                \App\Models\Lesson::firstOrCreate([
                    'section_id' => $section->id,
                    'title' => $lessonData['title'],
                ], [
                    'description' => $lessonData['description'],
                    'content' => $lessonData['content'],
                    'youtube_url' => $lessonData['youtube_url'] ?? null,
                    'youtube_video_id' => $lessonData['youtube_video_id'] ?? null,
                    'duration_seconds' => $lessonData['duration_seconds'],
                    'sort_order' => $lessonIndex + 1,
                    'is_required' => true,
                    'completion_type' => $lessonData['completion_type'] ?? 'content',
                    'required_watch_percentage' => 100,
                ]);
            }
        }

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
