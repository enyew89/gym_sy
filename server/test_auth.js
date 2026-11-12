async function runTests() {
  console.log('🧪 Starting Authentication & Authorization Tests against http://localhost:5000...\n');

  // Test 1: Shared Login as Admin
  console.log('1️⃣ Testing Admin Login (admin@gympro.com)...');
  let loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gympro.com', password: 'password123' })
  });

  const cookie = loginRes.headers.get('set-cookie');
  const loginData = await loginRes.json();
  console.log('   Status:', loginRes.status);
  console.log('   User role returned:', loginData.user?.role);
  console.log('   Session Cookie received:', !!cookie);

  if (!loginData.success || loginData.user?.role !== 'admin') {
    throw new Error('Admin login failed');
  }

  // Test 2: Admin creates a Trainer account
  console.log('\n2️⃣ Testing Admin creating a Trainer account...');
  const newTrainerEmail = `trainer_${Date.now()}@gympro.com`;
  let createTrainerRes = await fetch('http://localhost:5000/api/admin/create-staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookie.split(';')[0]
    },
    body: JSON.stringify({
      name: 'Bereket Desta',
      email: newTrainerEmail,
      phone: '+251912345678',
      role: 'trainer',
      specialization: 'Calisthenics & Mobility',
      password: 'password123'
    })
  });

  const trainerData = await createTrainerRes.json();
  console.log('   Status:', createTrainerRes.status);
  console.log('   Created staff role:', trainerData.staff?.role);
  console.log('   Message:', trainerData.message);

  if (!trainerData.success || trainerData.staff?.role !== 'trainer') {
    throw new Error('Staff creation failed');
  }

  // Test 3: Public Member Registration with Role Injection attempt
  console.log('\n3️⃣ Testing Public Member Registration (attempting to maliciously send role: "admin")...');
  const newMemberEmail = `member_${Date.now()}@gmail.com`;
  let registerRes = await fetch('http://localhost:5000/api/auth/register-member', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dawit Tadesse',
      email: newMemberEmail,
      phone: '+251933557799',
      role: 'admin', // Attack vector: malicious role injection
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true,
      fitnessGoal: 'Hypertrophy & Strength'
    })
  });

  const registerData = await registerRes.json();
  console.log('   Status:', registerRes.status);
  console.log('   Assigned role:', registerData.user?.role);
  console.log('   Security verification passed? ->', registerData.user?.role === 'member');

  if (registerData.user?.role !== 'member') {
    throw new Error('SECURITY BREACH: Public registration did not enforce member role!');
  }

  // Test 4: Verify Newly Created Trainer Can Log In
  console.log('\n4️⃣ Testing Login of Newly Created Trainer...');
  let trainerLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newTrainerEmail, password: 'password123' })
  });
  const trainerLoginData = await trainerLoginRes.json();
  console.log('   Status:', trainerLoginRes.status);
  console.log('   User role:', trainerLoginData.user?.role);
  console.log('   Trainer specialization:', trainerLoginData.user?.specialization);

  if (!trainerLoginData.success || trainerLoginData.user?.role !== 'trainer') {
    throw new Error('New trainer login failed');
  }

  console.log('\n🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('\n❌ Test Error:', err.message);
});
