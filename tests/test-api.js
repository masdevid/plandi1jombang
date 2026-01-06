#!/usr/bin/env node

const API_URL = process.env.API_URL || 'http://localhost:3001';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passed = 0;
let failed = 0;
let authToken = null;

console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
console.log(`${colors.blue}SD Plandi API Test Suite${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
console.log(`Testing API at: ${API_URL}\n`);

async function testEndpoint(name, method, endpoint, expectedStatus, data = null, headers = {}) {
  process.stdout.write(`Testing: ${name}... `);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const body = await response.text();
    let jsonBody = null;
    
    try {
      jsonBody = JSON.parse(body);
    } catch (e) {
      // Not JSON
    }
    
    if (response.status === expectedStatus) {
      console.log(`${colors.green}✓ PASSED${colors.reset} (HTTP ${response.status})`);
      passed++;
      return { success: true, data: jsonBody, status: response.status };
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} (Expected ${expectedStatus}, got ${response.status})`);
      if (jsonBody) console.log('Response:', JSON.stringify(jsonBody, null, 2));
      failed++;
      return { success: false, data: jsonBody, status: response.status };
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR${colors.reset} (${error.message})`);
    failed++;
    return { success: false, error: error.message };
  }
}

async function runTests() {
  // Test 1: Health Check
  console.log(`\n${colors.yellow}1. Health Check${colors.reset}`);
  const health = await testEndpoint('GET /health', 'GET', '/health', 200);
  
  if (health.success && health.data) {
    console.log(`  Database: ${health.data.database?.connected ? colors.green + 'Connected' : colors.red + 'Disconnected'}${colors.reset}`);
    if (health.data.database?.tables) {
      console.log(`  Tables: ${health.data.database.tables.length}`);
    }
  }
  
  // Test 2: Students Endpoint
  console.log(`\n${colors.yellow}2. Students Endpoint${colors.reset}`);
  const students = await testEndpoint('GET /students', 'GET', '/students', 200);
  
  if (students.success && Array.isArray(students.data)) {
    const count = students.data.length;
    process.stdout.write(`  Student count: `);
    
    if (count === 161) {
      console.log(`${colors.green}${count} ✓${colors.reset}`);
    } else if (count === 0) {
      console.log(`${colors.yellow}${count} ⚠ (Database needs seeding)${colors.reset}`);
    } else {
      console.log(`${colors.yellow}${count} ⚠ (Expected 161)${colors.reset}`);
    }
    
    if (count > 0) {
      const firstStudent = students.data[0];
      console.log(`  First student: ${firstStudent.name} (${firstStudent.nis})`);
    }
  }
  
  // Test 3: Authentication
  console.log(`\n${colors.yellow}3. Authentication${colors.reset}`);
  const login = await testEndpoint(
    'POST /auth (login)',
    'POST',
    '/auth',
    200,
    {
      action: 'login',
      email: 'admin@sdnplandi1jombang.sch.id',
      password: 'admin123'
    }
  );
  
  if (login.success && login.data?.token) {
    authToken = login.data.token;
    console.log(`  Token: ${authToken.substring(0, 20)}...`);
    console.log(`  User: ${login.data.user?.name} (${login.data.user?.role})`);
    
    // Verify token
    const verify = await testEndpoint(
      'GET /auth (verify token)',
      'GET',
      '/auth',
      200,
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
  }
  
  // Test 4: Admin Endpoint
  console.log(`\n${colors.yellow}4. Admin Endpoint${colors.reset}`);
  if (authToken) {
    const admin = await testEndpoint(
      'GET /admin?resource=dashboard',
      'GET',
      '/admin?resource=dashboard',
      200,
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    
    if (admin.success && admin.data) {
      console.log(`  Total students: ${admin.data.totalStudents}`);
      console.log(`  Pending leave requests: ${admin.data.pendingLeaveRequests}`);
    }
  } else {
    console.log(`  ${colors.yellow}⊘ SKIPPED${colors.reset} (No auth token)`);
  }
  
  // Test 5: Attendance
  console.log(`\n${colors.yellow}5. Attendance Endpoint${colors.reset}`);
  const attendance = await testEndpoint('GET /attendance', 'GET', '/attendance', 200);
  
  if (attendance.success && Array.isArray(attendance.data)) {
    console.log(`  Attendance records: ${attendance.data.length}`);
  }
  
  // Test 6: Leave Requests
  console.log(`\n${colors.yellow}6. Leave Requests Endpoint${colors.reset}`);
  const leave = await testEndpoint('GET /leave-requests', 'GET', '/leave-requests', 200);
  
  if (leave.success && Array.isArray(leave.data)) {
    console.log(`  Leave requests: ${leave.data.length}`);
  }
  
  // Test 7: Intrakurikuler
  console.log(`\n${colors.yellow}7. Intrakurikuler Endpoint${colors.reset}`);
  const intra = await testEndpoint('GET /intrakurikuler', 'GET', '/intrakurikuler', 200);
  
  if (intra.success && Array.isArray(intra.data)) {
    console.log(`  Subjects: ${intra.data.length}`);
    if (intra.data.length > 0) {
      console.log(`  First subject: ${intra.data[0].namaMapel} (${intra.data[0].kodeMapel})`);
    }
  }
  
  // Test 8: Ekstrakurikuler
  console.log(`\n${colors.yellow}8. Ekstrakurikuler Endpoint${colors.reset}`);
  const ekstra = await testEndpoint('GET /ekstrakurikuler', 'GET', '/ekstrakurikuler', 200);
  
  if (ekstra.success && Array.isArray(ekstra.data)) {
    console.log(`  Activities: ${ekstra.data.length}`);
    if (ekstra.data.length > 0) {
      console.log(`  First activity: ${ekstra.data[0].namaEkskul} (${ekstra.data[0].kodeEkskul})`);
    }
  }
  
  // Test 9: Database Management
  console.log(`\n${colors.yellow}9. Database Management${colors.reset}`);
  console.log(`  ${colors.blue}Note: Skipping db-init to avoid resetting data${colors.reset}`);
  console.log(`  ${colors.blue}To manually test: curl -X POST ${API_URL}/db-init${colors.reset}`);
  
  // Test 10: Error Handling
  console.log(`\n${colors.yellow}10. Error Handling${colors.reset}`);
  await testEndpoint('GET /nonexistent (404)', 'GET', '/nonexistent', 404);
  
  // Summary
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}\n`);
  
  if (failed === 0) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some tests failed${colors.reset}`);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
