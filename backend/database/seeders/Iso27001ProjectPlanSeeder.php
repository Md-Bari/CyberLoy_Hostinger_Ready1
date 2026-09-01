<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProjectPlan;
use App\Models\ProjectTask;
use App\Models\User;

class Iso27001ProjectPlanSeeder extends Seeder
{
    public function run()
    {
        $admin = User::where('role', 'admin')->first();

        $plan = ProjectPlan::updateOrCreate(
            ['title' => 'ISO 27001 Compliance Project Plan'],
            [
                'standard' => 'ISO 27001',
                'description' => 'Pro tip ➜ Use this project plan as your main source of guidance during the ISO 27001 certification process. Update task progress as implementation progresses.',
                'company_name' => 'CyberLoy LMS Organization',
                'project_owner' => 'Chief Information Security Officer (CISO)',
                'weeks_duration' => 12,
                'created_by' => $admin ? $admin->id : null,
                'is_active' => true,
            ]
        );

        $tasksData = [
            // Phase 1: Project setup kick-off
            [
                'phase' => 'Project setup kick-off',
                'prefix' => '1.1',
                'title' => 'Kick-off meeting with your team and ISO Security Lead',
                'details' => 'In the kickoff meeting, share essential information about the ISO 27001 process, explain the project plan, and introduce tools to be used.',
                'comments' => 'High priority - Phase 1 start',
                'sort_order' => 1,
            ],
            [
                'phase' => 'Project setup kick-off',
                'prefix' => '1.2',
                'title' => 'Get auditor introduction',
                'details' => 'Learn more about the role of the external auditor and establish contact for the certification audit.',
                'comments' => '',
                'sort_order' => 2,
            ],
            [
                'phase' => 'Project setup kick-off',
                'prefix' => '1.3',
                'title' => 'Schedule stage 1 and 2 audits and sign the certification quote',
                'details' => 'Review the audit stages, agree on target dates, and formalize audit scheduling with accredited certification body.',
                'comments' => '',
                'sort_order' => 3,
            ],

            // Phase 2: Implementation phase
            [
                'phase' => 'Implementation phase',
                'prefix' => '2.1',
                'title' => 'Complete asset inventory',
                'details' => 'Identify and record all information assets (hardware, software, data, physical, human) with ownership and classification.',
                'comments' => 'Mandatory ISMS asset register',
                'sort_order' => 4,
            ],
            [
                'phase' => 'Implementation phase',
                'prefix' => '2.2',
                'title' => 'Complete the security awareness training',
                'details' => 'Ensure all staff members complete required cybersecurity and data privacy awareness training modules.',
                'comments' => '100% staff participation required',
                'sort_order' => 5,
            ],
            [
                'phase' => 'Implementation phase',
                'prefix' => '2.3',
                'title' => 'Complete device security monitoring',
                'details' => 'Deploy endpoint protection (MDM, EDR, anti-malware, disc encryption) across all company devices.',
                'comments' => '',
                'sort_order' => 6,
            ],
            [
                'phase' => 'Implementation phase',
                'prefix' => '2.4',
                'title' => 'Read and write policies',
                'details' => 'Draft and review essential ISMS policies: Information Security Policy, Access Control Policy, Incident Response Plan, Data Retention, etc.',
                'comments' => 'Core documentation requirement',
                'sort_order' => 7,
            ],
            [
                'phase' => 'Implementation phase',
                'prefix' => '2.5',
                'title' => 'Employees to read/accept policies',
                'details' => 'Publish policies and track employee policy acceptance acknowledgments.',
                'comments' => '',
                'sort_order' => 8,
            ],
            [
                'phase' => 'Implementation phase',
                'prefix' => '2.6',
                'title' => 'Complete Risk Assessment',
                'details' => 'Conduct comprehensive Information Security Risk Assessment, identify vulnerabilities/threats, and establish Risk Treatment Plan.',
                'comments' => 'Clause 6.1.2 compliance',
                'sort_order' => 9,
            ],
            [
                'phase' => 'Implementation phase',
                'prefix' => '2.7',
                'title' => 'Complete Vendor Management',
                'details' => 'Evaluate third-party vendor security risks, maintain vendor registry, and review supplier security agreements.',
                'comments' => 'Annex A.5.19 - A.5.22 controls',
                'sort_order' => 10,
            ],
            [
                'phase' => 'Implementation phase',
                'prefix' => '2.8',
                'title' => 'Complete Access Management',
                'details' => 'Enforce RBAC, MFA, password complexity policies, and conduct quarterly user access privilege reviews.',
                'comments' => 'Annex A.5.15 - A.5.18 controls',
                'sort_order' => 11,
            ],

            // Phase 3: Audit readiness phase
            [
                'phase' => 'Audit readiness phase',
                'prefix' => '3.1',
                'title' => 'Identify non-applicable controls in Statement of Applicability (SOA)',
                'details' => 'Review Annex A controls and determine applicability based on risk assessment findings.',
                'comments' => 'Key auditor document',
                'sort_order' => 12,
            ],
            [
                'phase' => 'Audit readiness phase',
                'prefix' => '3.2',
                'title' => 'Write justifications for exclusion on Statement of Applicability (SOA)',
                'details' => 'Provide clear technical and operational rationales for any excluded Annex A controls.',
                'comments' => '',
                'sort_order' => 13,
            ],
            [
                'phase' => 'Audit readiness phase',
                'prefix' => '3.3',
                'title' => 'Complete Management review',
                'details' => 'Conduct executive management review meeting covering ISMS performance, audit results, and continuous improvement actions.',
                'comments' => 'Clause 9.3 compliance',
                'sort_order' => 14,
            ],
            [
                'phase' => 'Audit readiness phase',
                'prefix' => '3.4',
                'title' => 'Conduct an internal audit',
                'details' => 'Perform full internal audit of ISMS clauses 4-10 and Annex A controls. Generate Internal Audit Report.',
                'comments' => 'Clause 9.2 compliance',
                'sort_order' => 15,
            ],

            // Phase 4: Audit phase
            [
                'phase' => 'Audit phase',
                'prefix' => '4.1',
                'title' => 'Complete stage 1 audit',
                'details' => 'Undergo Stage 1 documentation review audit by external accredited certification body.',
                'comments' => 'Milestone',
                'sort_order' => 16,
            ],
            [
                'phase' => 'Audit phase',
                'prefix' => '4.2',
                'title' => 'Remediate findings of stage 1 audit',
                'details' => 'Address any documentation gaps or observations raised by the auditor during Stage 1.',
                'comments' => '',
                'sort_order' => 17,
            ],
            [
                'phase' => 'Audit phase',
                'prefix' => '4.3',
                'title' => 'Complete stage 2 audit',
                'details' => 'Undergo Stage 2 main certification audit examining operational effectiveness of all controls.',
                'comments' => 'Main Audit',
                'sort_order' => 18,
            ],
            [
                'phase' => 'Audit phase',
                'prefix' => '4.4',
                'title' => 'Remediate findings of stage 2 audit',
                'details' => 'Submit Corrective Action Plan for any non-conformities identified during Stage 2.',
                'comments' => '',
                'sort_order' => 19,
            ],
            [
                'phase' => 'Audit phase',
                'prefix' => '4.5',
                'title' => 'Obtain certification + audit report',
                'details' => 'Receive official ISO/IEC 27001 Certificate of Compliance and final Audit Report.',
                'comments' => 'Final Milestone',
                'sort_order' => 20,
            ],

            // Phase 5: Maintenance phase
            [
                'phase' => 'Maintenance phase',
                'prefix' => '5.1',
                'title' => 'Add audit findings to Corrective Action Plan',
                'details' => 'Log all audit observations and opportunities for improvement into the CAP register.',
                'comments' => 'Continuous Improvement',
                'sort_order' => 21,
            ],
            [
                'phase' => 'Maintenance phase',
                'prefix' => '5.2',
                'title' => 'Assign tasks to audit findings',
                'details' => 'Create specific remediation action items for each finding.',
                'comments' => '',
                'sort_order' => 22,
            ],
            [
                'phase' => 'Maintenance phase',
                'prefix' => '5.3',
                'title' => 'Assign owners to finding tasks',
                'details' => 'Assign responsible personnel to execute remediation action items.',
                'comments' => '',
                'sort_order' => 23,
            ],
            [
                'phase' => 'Maintenance phase',
                'prefix' => '5.4',
                'title' => 'Assign deadlines to audit findings',
                'details' => 'Establish target completion dates for all corrective action plan items.',
                'comments' => '',
                'sort_order' => 24,
            ],
            [
                'phase' => 'Maintenance phase',
                'prefix' => '5.5',
                'title' => 'Have an internal meeting to discuss execution of maintenance',
                'details' => 'Conduct regular operational maintenance meetings to ensure ongoing ISMS compliance and surveillance audit readiness.',
                'comments' => 'Annual surveillance prep',
                'sort_order' => 25,
            ],
        ];

        foreach ($tasksData as $t) {
            ProjectTask::updateOrCreate(
                [
                    'project_plan_id' => $plan->id,
                    'prefix' => $t['prefix'],
                ],
                [
                    'phase' => $t['phase'],
                    'title' => $t['title'],
                    'details' => $t['details'],
                    'comments' => $t['comments'],
                    'sort_order' => $t['sort_order'],
                ]
            );
        }
    }
}
