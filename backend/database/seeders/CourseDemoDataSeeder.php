<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\VideoWatchProgress;
use App\Models\Certificate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CourseDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure Admin and Student exist
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

        // 2. Create or Update Primary Demo Course
        $course = Course::updateOrCreate([
            'slug' => 'cybersecurity-fundamentals',
        ], [
            'title' => 'Cybersecurity Fundamentals & Threat Analysis Masterclass',
            'description' => 'Comprehensive enterprise cybersecurity curriculum covering information security architecture, threat intelligence, packet analysis, incident triage, and ISO 27001 compliance governance.',
            'level' => 'Beginner',
            'category' => 'Cybersecurity & ISMS',
            'duration' => '6 Weeks',
            'price' => 49.00,
            'currency' => 'USD',
            'instructor_name' => 'Dr. Marcus Vance (CISO)',
            'progression_mode' => 'sequential',
            'status' => 'published',
            'is_published' => true,
        ]);

        // 3. Create Sections and Lessons with YouTube videos, PDF guides, and interactive Assessments
        
        // --- Section 1 ---
        $sec1 = CourseSection::updateOrCreate([
            'course_id' => $course->id,
            'title' => 'Section 1: Information Security & CIA Architecture',
        ], [
            'description' => 'Core concepts of information protection, threat modeling, and defense-in-depth principles.',
            'sort_order' => 1,
        ]);

        $l1_1 = Lesson::updateOrCreate([
            'section_id' => $sec1->id,
            'title' => 'Lesson 1: Introduction to Information Security Landscape',
        ], [
            'description' => 'Overview of global cyber threat vectors, attacker motivations, and modern perimeter defense strategies.',
            'content' => 'In this foundational lesson, we explore the modern threat landscape, including advanced persistent threats (APTs), ransomware ecosystems, and the defense-in-depth layered security architecture.',
            'youtube_url' => 'https://www.youtube.com/watch?v=inWWhr5tnEA',
            'youtube_video_id' => 'inWWhr5tnEA',
            'pdf_url' => 'https://www.cisa.gov/sites/default/files/publications/Cybersecurity_Basics_Quick_Guide.pdf',
            'assessment_type' => 'none',
            'assessment_config' => null,
            'duration_seconds' => 720,
            'sort_order' => 1,
            'is_required' => true,
            'completion_type' => 'video',
            'required_watch_percentage' => 100,
        ]);

        $l1_2 = Lesson::updateOrCreate([
            'section_id' => $sec1->id,
            'title' => 'Lesson 2: The CIA Triad & Threat Modeling Frameworks',
        ], [
            'description' => 'Deep dive into Confidentiality, Integrity, and Availability controls with STRIDE threat modeling.',
            'content' => 'Understand how to balance security controls against operational friction. Learn STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) modeling.',
            'youtube_url' => 'https://www.youtube.com/watch?v=sdpxddDzXfE',
            'youtube_video_id' => 'sdpxddDzXfE',
            'pdf_url' => 'https://csrc.nist.gov/files/pubs/sp/800/53/r5/upd1/final/docs/sp800-53r5-control-catalog.pdf',
            'assessment_type' => 'mcq',
            'assessment_config' => [
                'passing_score' => 75,
                'questions' => [
                    [
                        'id' => 1,
                        'question' => 'Which element of the CIA triad is primarily compromised during a Ransomware encryption event?',
                        'options' => [
                            'Confidentiality',
                            'Availability',
                            'Integrity',
                            'Non-Repudiation'
                        ],
                        'correct_answer' => 1, // Availability
                        'explanation' => 'Ransomware denies authorized users access to their data and systems, directly impacting Availability.'
                    ],
                    [
                        'id' => 2,
                        'question' => 'In STRIDE threat modeling, what does the "T" stand for?',
                        'options' => [
                            'Threat Detection',
                            'Timing Attack',
                            'Tampering with Data',
                            'Traceability'
                        ],
                        'correct_answer' => 2, // Tampering with Data
                        'explanation' => 'STRIDE: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.'
                    ],
                    [
                        'id' => 3,
                        'question' => 'What is the primary objective of defense-in-depth architecture?',
                        'options' => [
                            'Rely on a single impenetrable firewall',
                            'Provide multiple layered defense mechanisms so failure of one does not compromise the whole',
                            'Eliminate the need for user training',
                            'Encrypt only external database connections'
                        ],
                        'correct_answer' => 1,
                        'explanation' => 'Defense-in-depth uses layered physical, technical, and administrative controls.'
                    ]
                ]
            ],
            'duration_seconds' => 900,
            'sort_order' => 2,
            'is_required' => true,
            'completion_type' => 'video',
            'required_watch_percentage' => 100,
        ]);

        // --- Section 2 ---
        $sec2 = CourseSection::updateOrCreate([
            'course_id' => $course->id,
            'title' => 'Section 2: Network Packet Inspection & SIEM Triage',
        ], [
            'description' => 'Hands-on network traffic analysis, packet header dissection, and firewall policy configuration.',
            'sort_order' => 2,
        ]);

        $l2_1 = Lesson::updateOrCreate([
            'section_id' => $sec2->id,
            'title' => 'Lesson 3: Network Traffic Analysis with Wireshark',
        ], [
            'description' => 'Capturing and analyzing TCP/IP 3-way handshakes, DNS exfiltration, and anomalous packet behavior.',
            'content' => 'Hands-on walkthrough using Wireshark to inspect packet payloads, filter by protocol (HTTP, DNS, TCP), and detect port scanning signatures.',
            'youtube_url' => 'https://www.youtube.com/watch?v=lb1Dw0elw0Q',
            'youtube_video_id' => 'lb1Dw0elw0Q',
            'pdf_url' => 'https://www.wireshark.org/docs/wsug_html_chunked/wsug_html_chunked.pdf',
            'assessment_type' => 'written',
            'assessment_config' => [
                'prompt' => 'Explain the flags involved in a standard TCP three-way handshake (SYN, SYN-ACK, ACK) and describe how an attacker can abuse this process to execute a SYN Flood Denial-of-Service attack.',
                'rubric' => '1. Identifies SYN, SYN-ACK, ACK sequence. 2. Explains incomplete half-open connections exhausting socket buffers.',
                'min_characters' => 120,
            ],
            'duration_seconds' => 1080,
            'sort_order' => 1,
            'is_required' => true,
            'completion_type' => 'video',
            'required_watch_percentage' => 100,
        ]);

        $l2_2 = Lesson::updateOrCreate([
            'section_id' => $sec2->id,
            'title' => 'Lesson 4: Firewall Access Control Lists & IDS Rule Tuning',
        ], [
            'description' => 'Configuring stateful firewall rules and Suricata/Snort detection signatures for malicious telemetry.',
            'content' => 'Explore ingress and egress firewall filtering, zero-trust network segmentation, and writing Snort rules to detect suspicious payloads.',
            'youtube_url' => 'https://www.youtube.com/watch?v=q6KqVb3bYvY',
            'youtube_video_id' => 'q6KqVb3bYvY',
            'pdf_url' => 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-41r1.pdf',
            'assessment_type' => 'mcq',
            'assessment_config' => [
                'passing_score' => 80,
                'questions' => [
                    [
                        'id' => 1,
                        'question' => 'Which port is typically monitored for unencrypted HTTP traffic that should be redirected to HTTPS?',
                        'options' => ['Port 443', 'Port 80', 'Port 22', 'Port 8080'],
                        'correct_answer' => 1, // Port 80
                        'explanation' => 'Port 80 is plain HTTP, whereas Port 443 is encrypted HTTPS.'
                    ],
                    [
                        'id' => 2,
                        'question' => 'What is the primary difference between an IDS (Intrusion Detection System) and an IPS (Intrusion Prevention System)?',
                        'options' => [
                            'IDS only blocks traffic, IPS only alerts',
                            'IDS monitors and alerts on suspicious traffic, while IPS actively intercepts and drops malicious packets in-line',
                            'IDS runs only in the cloud, IPS runs on hardware',
                            'IDS does not use signature rules'
                        ],
                        'correct_answer' => 1,
                        'explanation' => 'An IPS sits in-line with network traffic and can automatically drop malicious packets.'
                    ]
                ]
            ],
            'duration_seconds' => 840,
            'sort_order' => 2,
            'is_required' => true,
            'completion_type' => 'video',
            'required_watch_percentage' => 100,
        ]);

        // --- Section 3 ---
        $sec3 = CourseSection::updateOrCreate([
            'course_id' => $course->id,
            'title' => 'Section 3: ISO 27001 ISMS Implementation & Incident Response',
        ], [
            'description' => 'ISO 27001:2022 governance, Annex A control compliance, and incident containment lifecycles.',
            'sort_order' => 3,
        ]);

        $l3_1 = Lesson::updateOrCreate([
            'section_id' => $sec3->id,
            'title' => 'Lesson 5: ISO 27001 Annex A Controls & Statement of Applicability',
        ], [
            'description' => 'Implementing the 4 control themes: Organizational (37), People (8), Physical (14), and Technological (34).',
            'content' => 'Review the ISO/IEC 27001:2022 standard structure, how to craft a Statement of Applicability (SoA), and conducting internal ISMS audit cycles.',
            'youtube_url' => 'https://www.youtube.com/watch?v=0hK2xY_q3Yc',
            'youtube_video_id' => '0hK2xY_q3Yc',
            'pdf_url' => 'https://www.iso.org/files/live/sites/isoorg/files/store/en/PUB100450.pdf',
            'assessment_type' => 'none',
            'assessment_config' => null,
            'duration_seconds' => 1200,
            'sort_order' => 1,
            'is_required' => true,
            'completion_type' => 'video',
            'required_watch_percentage' => 100,
        ]);

        $l3_2 = Lesson::updateOrCreate([
            'section_id' => $sec3->id,
            'title' => 'Lesson 6: Capstone Comprehensive Assessment & Audit Prep',
        ], [
            'description' => 'Final cybersecurity and ISO 27001 assessment required for official digital certificate graduation.',
            'content' => 'Complete the multi-scenario assessment testing your readiness to evaluate risks, implement controls, and execute incident containment procedures.',
            'youtube_url' => 'https://www.youtube.com/watch?v=Z5eT_X5G0v0',
            'youtube_video_id' => 'Z5eT_X5G0v0',
            'pdf_url' => 'https://csrc.nist.gov/files/pubs/sp/800/61/r2/final/docs/sp800-61r2.pdf',
            'assessment_type' => 'mcq',
            'assessment_config' => [
                'passing_score' => 80,
                'questions' => [
                    [
                        'id' => 1,
                        'question' => 'How many total controls are specified in the updated ISO/IEC 27001:2022 Annex A?',
                        'options' => ['114 Controls', '93 Controls', '133 Controls', '72 Controls'],
                        'correct_answer' => 1, // 93 Controls in 2022 revision
                        'explanation' => 'ISO 27001:2022 streamlined Annex A into 93 controls grouped into 4 themes (Organizational, People, Physical, Technological).'
                    ],
                    [
                        'id' => 2,
                        'question' => 'During an active data breach containment phase, what is the recommended first priority?',
                        'options' => [
                            'Immediately delete all system logs to hide vulnerabilities',
                            'Isolate affected endpoints from the corporate network while preserving volatile memory artifacts for forensics',
                            'Reboot all domain controllers simultaneously',
                            'Notify all public media outlets prior to assessing breach scope'
                        ],
                        'correct_answer' => 1,
                        'explanation' => 'Network isolation stops lateral movement while preserving volatile RAM artifacts.'
                    ],
                    [
                        'id' => 3,
                        'question' => 'What is the role of the Statement of Applicability (SoA) in an ISO 27001 audit?',
                        'options' => [
                            'It lists every employee payroll record',
                            'It documents which Annex A controls have been selected, with justification for inclusions and exclusions',
                            'It is only required for organizations with over 5,000 users',
                            'It replaces the need for a risk assessment'
                        ],
                        'correct_answer' => 1,
                        'explanation' => 'The SoA is a mandatory document detailing selected Annex A controls and reasons for inclusion/exclusion.'
                    ]
                ]
            ],
            'duration_seconds' => 960,
            'sort_order' => 2,
            'is_required' => true,
            'completion_type' => 'video',
            'required_watch_percentage' => 100,
        ]);

        // 4. Enroll Student in the Course and Create Completed Progress & Initial Certificate
        $enrollment = Enrollment::updateOrCreate([
            'user_id' => $student->id,
            'course_id' => $course->id,
        ], [
            'status' => 'completed',
            'payment_status' => 'paid',
            'completed_at' => now()->subDays(2),
        ]);

        // Set all lessons as completed for the student
        $allLessons = [$l1_1, $l1_2, $l2_1, $l2_2, $l3_1, $l3_2];
        foreach ($allLessons as $les) {
            LessonProgress::updateOrCreate([
                'user_id' => $student->id,
                'lesson_id' => $les->id,
            ], [
                'course_id' => $course->id,
                'section_id' => $les->section_id,
                'status' => 'completed',
                'progress_percentage' => 100,
                'watched_seconds' => $les->duration_seconds,
                'started_at' => now()->subDays(5),
                'completed_at' => now()->subDays(2),
            ]);

            VideoWatchProgress::updateOrCreate([
                'user_id' => $student->id,
                'lesson_id' => $les->id,
            ], [
                'video_id' => $les->youtube_video_id,
                'duration' => $les->duration_seconds,
                'current_position' => $les->duration_seconds,
                'watched_seconds' => $les->duration_seconds,
                'watch_percentage' => 100,
                'completed' => true,
                'completed_at' => now()->subDays(2),
                'watched_intervals' => [
                    [0, $les->duration_seconds]
                ],
            ]);
        }

        // 5. Create Initial Verified Demo Certificate for the student
        $certCode = 'CERT-2026-CYBER-8842';
        $verCode = 'VER-CYBER-9912';

        Certificate::updateOrCreate([
            'user_id' => $student->id,
            'course_id' => $course->id,
        ], [
            'certificate_code' => $certCode,
            'verification_code' => $verCode,
            'issued_by' => $admin->id,
            'issued_at' => now()->subDays(2),
            'completion_date' => now()->subDays(2),
            'status' => 'issued',
        ]);
    }
}
