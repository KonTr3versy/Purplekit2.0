// =============================================================================
// PurpleKit Database Seed Script
// =============================================================================
// Creates a demo organization with realistic sample data for:
// - Development and testing
// - Sales demos
// - New user onboarding
//
// Usage: npx prisma db seed
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// =============================================================================
// CONFIGURATION
// =============================================================================
const BCRYPT_ROUNDS = 12;
const DEMO_PASSWORD = 'demo123!';  // Change in production!

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

function minutesAgo(minutes: number): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date;
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================
async function main() {
  console.log('🌱 Starting database seed...\n');

  // ---------------------------------------------------------------------------
  // 1. CREATE DEMO ORGANIZATION
  // ---------------------------------------------------------------------------
  console.log('📦 Creating demo organization...');
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'acme-security' },
    update: {},
    create: {
      name: 'ACME Security',
      slug: 'acme-security',
      subscriptionTier: 'PRO',
      settings: {
        timezone: 'America/New_York',
        defaultMethodology: 'ATOMIC',
        enableRealTimeUpdates: true,
      },
    },
  });
  console.log(`   ✓ Organization: ${demoOrg.name} (${demoOrg.id})\n`);

  // ---------------------------------------------------------------------------
  // 2. CREATE DEMO USERS
  // ---------------------------------------------------------------------------
  console.log('👥 Creating demo users...');
  const passwordHash = await hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { orgId_email: { orgId: demoOrg.id, email: 'malcolm@acme.com' } },
      update: {},
      create: {
        orgId: demoOrg.id,
        email: 'malcolm@acme.com',
        passwordHash,
        displayName: 'Malcolm Green',
        role: 'RED_LEAD',
        lastLoginAt: hoursAgo(2),
      },
    }),
    prisma.user.upsert({
      where: { orgId_email: { orgId: demoOrg.id, email: 'sarah@acme.com' } },
      update: {},
      create: {
        orgId: demoOrg.id,
        email: 'sarah@acme.com',
        passwordHash,
        displayName: 'Sarah Blue',
        role: 'BLUE_LEAD',
        lastLoginAt: hoursAgo(1),
      },
    }),
    prisma.user.upsert({
      where: { orgId_email: { orgId: demoOrg.id, email: 'mike@acme.com' } },
      update: {},
      create: {
        orgId: demoOrg.id,
        email: 'mike@acme.com',
        passwordHash,
        displayName: 'Mike Thompson',
        role: 'ANALYST',
        lastLoginAt: daysAgo(1),
      },
    }),
    prisma.user.upsert({
      where: { orgId_email: { orgId: demoOrg.id, email: 'admin@acme.com' } },
      update: {},
      create: {
        orgId: demoOrg.id,
        email: 'admin@acme.com',
        passwordHash,
        displayName: 'Admin User',
        role: 'ADMIN',
        lastLoginAt: daysAgo(3),
      },
    }),
  ]);

  const [malcolm, sarah, mike, admin] = users;
  console.log(`   ✓ Created ${users.length} users\n`);

  // ---------------------------------------------------------------------------
  // 3. CREATE ATT&CK TECHNIQUES (Sample subset)
  // ---------------------------------------------------------------------------
  console.log('🎯 Creating ATT&CK techniques...');
  const techniques = [
    // Execution
    { id: 'T1059', name: 'Command and Scripting Interpreter', tactics: ['Execution'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
    { id: 'T1059.001', name: 'PowerShell', tactics: ['Execution'], platforms: ['Windows'], isSubtechnique: true, parentId: 'T1059' },
    { id: 'T1059.003', name: 'Windows Command Shell', tactics: ['Execution'], platforms: ['Windows'], isSubtechnique: true, parentId: 'T1059' },
    { id: 'T1053', name: 'Scheduled Task/Job', tactics: ['Execution', 'Persistence', 'Privilege Escalation'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
    { id: 'T1053.005', name: 'Scheduled Task', tactics: ['Execution', 'Persistence', 'Privilege Escalation'], platforms: ['Windows'], isSubtechnique: true, parentId: 'T1053' },
    
    // Persistence
    { id: 'T1547', name: 'Boot or Logon Autostart Execution', tactics: ['Persistence', 'Privilege Escalation'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
    { id: 'T1547.001', name: 'Registry Run Keys / Startup Folder', tactics: ['Persistence', 'Privilege Escalation'], platforms: ['Windows'], isSubtechnique: true, parentId: 'T1547' },
    
    // Defense Evasion
    { id: 'T1070', name: 'Indicator Removal', tactics: ['Defense Evasion'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
    { id: 'T1070.001', name: 'Clear Windows Event Logs', tactics: ['Defense Evasion'], platforms: ['Windows'], isSubtechnique: true, parentId: 'T1070' },
    
    // Credential Access
    { id: 'T1003', name: 'OS Credential Dumping', tactics: ['Credential Access'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
    { id: 'T1003.001', name: 'LSASS Memory', tactics: ['Credential Access'], platforms: ['Windows'], isSubtechnique: true, parentId: 'T1003' },
    
    // Lateral Movement
    { id: 'T1021', name: 'Remote Services', tactics: ['Lateral Movement'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
    { id: 'T1021.001', name: 'Remote Desktop Protocol', tactics: ['Lateral Movement'], platforms: ['Windows'], isSubtechnique: true, parentId: 'T1021' },
    { id: 'T1570', name: 'Lateral Tool Transfer', tactics: ['Lateral Movement'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
    
    // Privilege Escalation
    { id: 'T1078', name: 'Valid Accounts', tactics: ['Defense Evasion', 'Persistence', 'Privilege Escalation', 'Initial Access'], platforms: ['Windows', 'Linux', 'macOS', 'Cloud'], isSubtechnique: false },
    { id: 'T1078.002', name: 'Domain Accounts', tactics: ['Defense Evasion', 'Persistence', 'Privilege Escalation', 'Initial Access'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: true, parentId: 'T1078' },
    
    // Initial Access
    { id: 'T1566', name: 'Phishing', tactics: ['Initial Access'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
    { id: 'T1566.001', name: 'Spearphishing Attachment', tactics: ['Initial Access'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: true, parentId: 'T1566' },
    
    // Impact
    { id: 'T1486', name: 'Data Encrypted for Impact', tactics: ['Impact'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
    { id: 'T1490', name: 'Inhibit System Recovery', tactics: ['Impact'], platforms: ['Windows', 'Linux', 'macOS'], isSubtechnique: false },
  ];

  for (const tech of techniques) {
    await prisma.attackTechnique.upsert({
      where: { id: tech.id },
      update: {},
      create: {
        id: tech.id,
        name: tech.name,
        description: `${tech.name} technique description. See MITRE ATT&CK for full details.`,
        tactics: tech.tactics,
        platforms: tech.platforms,
        dataSources: ['Process', 'Command', 'File'],
        isSubtechnique: tech.isSubtechnique,
        parentId: tech.parentId || null,
        mitreUrl: `https://attack.mitre.org/techniques/${tech.id.replace('.', '/')}`,
        version: '14.1',
        deprecated: false,
        lastSyncedAt: new Date(),
      },
    });
  }
  console.log(`   ✓ Created ${techniques.length} ATT&CK techniques\n`);

  // ---------------------------------------------------------------------------
  // 4. CREATE DEFENSIVE TOOLS
  // ---------------------------------------------------------------------------
  console.log('🛡️ Creating defensive tools...');
  const defensiveTools = await Promise.all([
    prisma.defensiveTool.upsert({
      where: { orgId_name: { orgId: demoOrg.id, name: 'CrowdStrike Falcon' } },
      update: {},
      create: { orgId: demoOrg.id, name: 'CrowdStrike Falcon', category: 'EDR', vendor: 'CrowdStrike', version: '6.x' },
    }),
    prisma.defensiveTool.upsert({
      where: { orgId_name: { orgId: demoOrg.id, name: 'Microsoft Defender' } },
      update: {},
      create: { orgId: demoOrg.id, name: 'Microsoft Defender', category: 'EDR', vendor: 'Microsoft', version: '4.x' },
    }),
    prisma.defensiveTool.upsert({
      where: { orgId_name: { orgId: demoOrg.id, name: 'Splunk SIEM' } },
      update: {},
      create: { orgId: demoOrg.id, name: 'Splunk SIEM', category: 'SIEM', vendor: 'Splunk', version: '9.x' },
    }),
    prisma.defensiveTool.upsert({
      where: { orgId_name: { orgId: demoOrg.id, name: 'Palo Alto NGFW' } },
      update: {},
      create: { orgId: demoOrg.id, name: 'Palo Alto NGFW', category: 'NGFW', vendor: 'Palo Alto Networks', version: '10.x' },
    }),
  ]);
  console.log(`   ✓ Created ${defensiveTools.length} defensive tools\n`);

  // ---------------------------------------------------------------------------
  // 5. CREATE ENGAGEMENTS
  // ---------------------------------------------------------------------------
  console.log('📁 Creating engagements...');
  
  // Active engagement
  const q1Engagement = await prisma.engagement.create({
    data: {
      orgId: demoOrg.id,
      name: 'Q1 Detection Validation',
      description: 'Quarterly validation of detection capabilities across Windows endpoints, focusing on common attack techniques.',
      methodology: 'ATOMIC',
      status: 'ACTIVE',
      visibilityMode: 'OPEN',
      startedAt: daysAgo(14),
      createdById: malcolm.id,
    },
  });

  // Planning engagement (Scenario)
  const ransomwareEngagement = await prisma.engagement.create({
    data: {
      orgId: demoOrg.id,
      name: 'Ransomware Scenario',
      description: 'End-to-end ransomware attack simulation from initial access through impact.',
      methodology: 'SCENARIO',
      status: 'PLANNING',
      visibilityMode: 'BLIND_BLUE',
      createdById: malcolm.id,
    },
  });

  // Completed engagement
  const lateralEngagement = await prisma.engagement.create({
    data: {
      orgId: demoOrg.id,
      name: 'Lateral Movement Test',
      description: 'Testing detection of lateral movement techniques.',
      methodology: 'ATOMIC',
      status: 'COMPLETE',
      visibilityMode: 'OPEN',
      startedAt: daysAgo(30),
      completedAt: daysAgo(20),
      createdById: malcolm.id,
    },
  });

  console.log(`   ✓ Created 3 engagements\n`);

  // ---------------------------------------------------------------------------
  // 6. CREATE ENGAGEMENT TECHNIQUES & ACTIONS
  // ---------------------------------------------------------------------------
  console.log('🎯 Creating engagement techniques...');

  // Q1 Engagement techniques with various statuses
  const q1Techniques = [
    { techniqueId: 'T1059.001', status: 'COMPLETE', assignedTo: malcolm },
    { techniqueId: 'T1059.003', status: 'VALIDATING', assignedTo: sarah },
    { techniqueId: 'T1053.005', status: 'EXECUTING', assignedTo: malcolm },
    { techniqueId: 'T1070.001', status: 'COMPLETE', assignedTo: malcolm },
    { techniqueId: 'T1078.002', status: 'PLANNED', assignedTo: null },
    { techniqueId: 'T1021.001', status: 'PLANNED', assignedTo: null },
    { techniqueId: 'T1486', status: 'BLOCKED', assignedTo: malcolm },
    { techniqueId: 'T1003.001', status: 'VALIDATING', assignedTo: sarah },
  ];

  const createdTechniques: any[] = [];
  for (let i = 0; i < q1Techniques.length; i++) {
    const t = q1Techniques[i];
    const engTech = await prisma.engagementTechnique.create({
      data: {
        orgId: demoOrg.id,
        engagementId: q1Engagement.id,
        techniqueId: t.techniqueId,
        status: t.status as any,
        orderIndex: i,
        notes: t.status === 'BLOCKED' ? 'Waiting for isolated VM environment' : null,
        assignedToId: t.assignedTo?.id || null,
      },
    });
    createdTechniques.push(engTech);
  }
  console.log(`   ✓ Created ${q1Techniques.length} engagement techniques\n`);

  // ---------------------------------------------------------------------------
  // 7. CREATE ACTIONS & DETECTION VALIDATIONS
  // ---------------------------------------------------------------------------
  console.log('📝 Creating actions and validations...');

  // PowerShell (Complete with validation)
  const powershellTech = createdTechniques.find(t => t.techniqueId === 'T1059.001');
  const powershellAction = await prisma.action.create({
    data: {
      orgId: demoOrg.id,
      engagementTechniqueId: powershellTech.id,
      executedAt: daysAgo(7),
      executedById: malcolm.id,
      command: 'powershell.exe -ExecutionPolicy Bypass -File C:\\temp\\recon.ps1',
      targetHost: 'WORKSTATION-01',
      targetUser: 'ACME\\jsmith',
      notes: 'Basic reconnaissance script execution',
      evidenceFiles: JSON.stringify([{ key: 'evidence/ps-001.png', filename: 'powershell_execution.png', size: 245000 }]),
    },
  });

  await prisma.detectionValidation.create({
    data: {
      orgId: demoOrg.id,
      actionId: powershellAction.id,
      outcomes: ['LOGGED', 'ALERTED'],
      alertPriority: 'HIGH',
      defensiveToolId: defensiveTools[0].id,  // CrowdStrike
      detectionRuleId: 'CS-POWERSHELL-001',
      siemQuery: 'index=windows EventCode=4104 | search powershell bypass',
      alertId: 'ALERT-2026-001234',
      validatedById: sarah.id,
      validatedAt: daysAgo(6),
    },
  });

  await prisma.timingMetrics.create({
    data: {
      orgId: demoOrg.id,
      actionId: powershellAction.id,
      detectionTimestamp: new Date(powershellAction.executedAt.getTime() + 45000),  // 45 seconds
      investigationStart: new Date(powershellAction.executedAt.getTime() + 900000),  // 15 minutes
      containmentTimestamp: new Date(powershellAction.executedAt.getTime() + 3600000),  // 1 hour
      ttdSeconds: 45,
      ttiSeconds: 855,
      ttcSeconds: 2700,
    },
  });

  // Clear Event Logs (Complete - only logged, not alerted)
  const clearLogsTech = createdTechniques.find(t => t.techniqueId === 'T1070.001');
  const clearLogsAction = await prisma.action.create({
    data: {
      orgId: demoOrg.id,
      engagementTechniqueId: clearLogsTech.id,
      executedAt: daysAgo(5),
      executedById: malcolm.id,
      command: 'wevtutil cl Security',
      targetHost: 'WORKSTATION-01',
      notes: 'Attempted to clear security event logs',
    },
  });

  await prisma.detectionValidation.create({
    data: {
      orgId: demoOrg.id,
      actionId: clearLogsAction.id,
      outcomes: ['LOGGED'],
      alertPriority: 'MEDIUM',
      defensiveToolId: defensiveTools[2].id,  // Splunk
      detectionRuleId: 'SPLUNK-EVTLOG-001',
      siemQuery: 'index=windows EventCode=1102',
      validatedById: sarah.id,
      validatedAt: daysAgo(4),
    },
  });

  // CMD Shell (Validating - action done, awaiting validation)
  const cmdTech = createdTechniques.find(t => t.techniqueId === 'T1059.003');
  await prisma.action.create({
    data: {
      orgId: demoOrg.id,
      engagementTechniqueId: cmdTech.id,
      executedAt: hoursAgo(3),
      executedById: malcolm.id,
      command: 'cmd.exe /c whoami & net user & net localgroup administrators',
      targetHost: 'WORKSTATION-01',
      notes: 'Basic enumeration commands',
    },
  });

  // Scheduled Task (Executing - action just logged)
  const schedTaskTech = createdTechniques.find(t => t.techniqueId === 'T1053.005');
  await prisma.action.create({
    data: {
      orgId: demoOrg.id,
      engagementTechniqueId: schedTaskTech.id,
      executedAt: minutesAgo(30),
      executedById: malcolm.id,
      command: 'schtasks /create /tn "SystemUpdate" /tr "C:\\Windows\\Temp\\update.exe" /sc daily /st 02:00',
      targetHost: 'WORKSTATION-02',
      notes: 'Creating persistence via scheduled task',
    },
  });

  console.log(`   ✓ Created actions and validations\n`);

  // ---------------------------------------------------------------------------
  // 8. CREATE FINDINGS
  // ---------------------------------------------------------------------------
  console.log('🔍 Creating findings...');
  
  await prisma.finding.createMany({
    data: [
      {
        orgId: demoOrg.id,
        engagementId: q1Engagement.id,
        title: 'Missing telemetry for scheduled task creation',
        description: 'The SIEM is not ingesting Windows Task Scheduler events (EventID 4698). This creates a gap in detection capabilities for persistence techniques.',
        pillar: 'TECHNOLOGY',
        category: 'TELEMETRY_GAP',
        severity: 'HIGH',
        status: 'OPEN',
        remediationNotes: 'Configure Windows Event Log forwarding for Task Scheduler events. Update Splunk inputs.conf.',
        remediationOwner: 'SIEM Team',
        remediationDue: daysAgo(-14),  // 14 days from now
        createdById: sarah.id,
      },
      {
        orgId: demoOrg.id,
        engagementId: q1Engagement.id,
        title: 'No playbook for lateral movement response',
        description: 'SOC analysts lack a documented procedure for responding to lateral movement alerts. Response times were inconsistent during testing.',
        pillar: 'PROCESS',
        category: 'MISSING_PLAYBOOK',
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        remediationNotes: 'Create playbook covering RDP, SMB, and WinRM lateral movement detection and response.',
        remediationOwner: 'SOC Lead',
        remediationDue: daysAgo(-7),
        createdById: sarah.id,
      },
      {
        orgId: demoOrg.id,
        engagementId: q1Engagement.id,
        title: 'EDR not configured to block PowerShell abuse',
        description: 'CrowdStrike detected the malicious PowerShell execution but did not prevent it. Prevention policies need tuning.',
        pillar: 'TECHNOLOGY',
        category: 'PREVENTION_GAP',
        severity: 'CRITICAL',
        status: 'OPEN',
        remediationNotes: 'Review CrowdStrike prevention policies. Enable PowerShell script blocking for non-admin users.',
        remediationOwner: 'Security Engineering',
        remediationDue: daysAgo(-3),
        externalTicketId: 'JIRA-SEC-1234',
        createdById: sarah.id,
      },
      {
        orgId: demoOrg.id,
        engagementId: q1Engagement.id,
        title: 'SOC analysts need ATT&CK framework training',
        description: 'During incident triage, analysts were unfamiliar with mapping alerts to ATT&CK techniques, reducing context for response decisions.',
        pillar: 'PEOPLE',
        category: 'SKILLS_GAP',
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        remediationNotes: 'Schedule ATT&CK training for SOC team. Consider ATT&CK Defender certification.',
        remediationOwner: 'Training Team',
        remediationDue: daysAgo(-30),
        createdById: mike.id,
      },
      {
        orgId: demoOrg.id,
        engagementId: lateralEngagement.id,
        title: 'SIEM missing Windows Security logs from file servers',
        description: 'File server audit logs were not being forwarded to Splunk, creating blind spots for lateral movement detection.',
        pillar: 'TECHNOLOGY',
        category: 'TELEMETRY_GAP',
        severity: 'HIGH',
        status: 'RESOLVED',
        remediationNotes: 'Deployed Splunk Universal Forwarder to all file servers.',
        remediationOwner: 'SIEM Team',
        resolvedAt: daysAgo(22),
        createdById: sarah.id,
      },
    ],
  });
  console.log(`   ✓ Created 5 findings\n`);

  // ---------------------------------------------------------------------------
  // 9. CREATE FEATURE FLAGS
  // ---------------------------------------------------------------------------
  console.log('🚩 Creating feature flags...');
  
  await prisma.featureFlag.createMany({
    data: [
      // Global flags
      { key: 'attack_chain_visualization', orgId: null, enabled: true, metadata: { description: 'Visual dependency graph for scenario mode' } },
      { key: 'realtime_collaboration', orgId: null, enabled: true, metadata: { description: 'WebSocket-based real-time updates', beta: true } },
      { key: 'automated_attack_sync', orgId: null, enabled: true, metadata: { description: 'Automatic MITRE ATT&CK data sync' } },
      { key: 'advanced_analytics', orgId: null, enabled: false, metadata: { description: 'Enhanced analytics dashboard', beta: true } },
      { key: 'api_webhooks', orgId: null, enabled: false, metadata: { description: 'Webhook notifications for API events', beta: true } },
      
      // Org-specific override
      { key: 'advanced_analytics', orgId: demoOrg.id, enabled: true, metadata: { description: 'Enabled for demo org' } },
    ],
  });
  console.log(`   ✓ Created feature flags\n`);

  // ---------------------------------------------------------------------------
  // 10. CREATE SAMPLE AUDIT LOGS
  // ---------------------------------------------------------------------------
  console.log('📜 Creating audit logs...');
  
  await prisma.auditLog.createMany({
    data: [
      { orgId: demoOrg.id, userId: sarah.id, action: 'UPDATE', resourceType: 'detection_validation', resourceId: powershellAction.id, changes: { outcomes: ['LOGGED', 'ALERTED'] }, ipAddress: '10.0.1.45', timestamp: daysAgo(6) },
      { orgId: demoOrg.id, userId: malcolm.id, action: 'CREATE', resourceType: 'action', resourceId: powershellAction.id, ipAddress: '10.0.1.23', timestamp: daysAgo(7) },
      { orgId: demoOrg.id, userId: malcolm.id, action: 'CREATE', resourceType: 'engagement', resourceId: q1Engagement.id, ipAddress: '10.0.1.23', timestamp: daysAgo(14) },
      { orgId: demoOrg.id, userId: sarah.id, action: 'CREATE', resourceType: 'finding', changes: { title: 'EDR not configured to block PowerShell abuse' }, ipAddress: '10.0.1.45', timestamp: daysAgo(5) },
      { orgId: demoOrg.id, userId: admin.id, action: 'LOGIN', resourceType: 'session', ipAddress: '10.0.1.100', timestamp: daysAgo(3) },
    ],
  });
  console.log(`   ✓ Created audit logs\n`);

  // ---------------------------------------------------------------------------
  // 11. CREATE REPORT JOB (In Progress)
  // ---------------------------------------------------------------------------
  console.log('📄 Creating sample report job...');
  
  await prisma.reportJob.create({
    data: {
      orgId: demoOrg.id,
      engagementId: q1Engagement.id,
      reportType: 'OPERATIONAL',
      format: 'pdf',
      status: 'PROCESSING',
      progress: 65,
      requestedById: sarah.id,
      startedAt: minutesAgo(2),
    },
  });
  console.log(`   ✓ Created report job\n`);

  // ---------------------------------------------------------------------------
  // DONE!
  // ---------------------------------------------------------------------------
  console.log('✅ Seed completed successfully!\n');
  console.log('Demo accounts created:');
  console.log('  📧 malcolm@acme.com (Red Team Lead)');
  console.log('  📧 sarah@acme.com (Blue Team Lead)');
  console.log('  📧 mike@acme.com (Analyst)');
  console.log('  📧 admin@acme.com (Admin)');
  console.log(`  🔐 Password for all: ${DEMO_PASSWORD}\n`);
}

// =============================================================================
// EXECUTE
// =============================================================================
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
