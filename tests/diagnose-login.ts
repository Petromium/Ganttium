/**
 * Login Flow Diagnostics
 * Tests the actual login process to identify where it fails
 */

import fetch from 'node-fetch';
import * as readline from 'readline';

const PROD_URL = 'https://ganttium-303401483984.us-central1.run.app';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testLogin() {
  console.log('🔐 Testing Login Flow...\n');

  const email = await question('Enter your email: ');
  const password = await question('Enter your password: ');

  console.log('\n1️⃣ Attempting login...');
  try {
    const loginRes = await fetch(`${PROD_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Headers:`, Object.fromEntries(loginRes.headers.entries()));
    
    const loginData = await loginRes.json();
    console.log(`   Response:`, loginData);

    if (loginRes.status === 200) {
      console.log('\n✅ Login successful!');
      
      // Extract cookies
      const cookies = loginRes.headers.get('set-cookie');
      console.log(`   Session cookie:`, cookies);

      if (cookies) {
        console.log('\n2️⃣ Testing authenticated request...');
        const authRes = await fetch(`${PROD_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Cookie': cookies,
          },
        });
        console.log(`   Status: ${authRes.status}`);
        const authData = await authRes.json();
        console.log(`   User data:`, authData);

        if (authRes.status === 200) {
          console.log('\n3️⃣ Testing organizations endpoint...');
          const orgsRes = await fetch(`${PROD_URL}/api/organizations`, {
            method: 'GET',
            headers: {
              'Cookie': cookies,
            },
          });
          console.log(`   Status: ${orgsRes.status}`);
          const orgsData = await orgsRes.json();
          console.log(`   Organizations:`, orgsData);

          if (orgsRes.status === 200 && Array.isArray(orgsData) && orgsData.length > 0) {
            const orgId = orgsData[0].id;
            console.log(`\n4️⃣ Testing projects endpoint for org ${orgId}...`);
            const projectsRes = await fetch(`${PROD_URL}/api/organizations/${orgId}/projects`, {
              method: 'GET',
              headers: {
                'Cookie': cookies,
              },
            });
            console.log(`   Status: ${projectsRes.status}`);
            
            try {
              const projectsData = await projectsRes.json();
              console.log(`   Projects:`, projectsData);
            } catch (e: any) {
              const text = await projectsRes.text();
              console.log(`   Raw response:`, text);
            }
          }
        }
      }
    } else {
      console.log('\n❌ Login failed');
      if (loginRes.status === 500) {
        console.log('\n🔴 500 Error - This indicates a server-side issue:');
        console.log('   - Database connection problem');
        console.log('   - Session table missing or inaccessible');
        console.log('   - Error in login logic or user creation');
        console.log('   - Missing user organization assignment');
      }
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  } finally {
    rl.close();
  }
}

testLogin().catch(console.error);

