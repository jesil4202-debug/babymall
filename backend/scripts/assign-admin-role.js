#!/usr/bin/env node

/**
 * Admin Role Assignment Script
 * 
 * Usage: node scripts/assign-admin-role.js <email> [--remove]
 * 
 * Examples:
 *   node scripts/assign-admin-role.js babymall175@gmail.com
 *   node scripts/assign-admin-role.js babymall175@gmail.com --remove
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];
const removeRole = process.argv.includes('--remove');

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/assign-admin-role.js <email> [--remove]');
  process.exit(1);
}

async function assignAdminRole() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const normalizedEmail = email.toLowerCase().trim();
    const newRole = removeRole ? 'user' : 'admin';
    const action = removeRole ? 'REMOVE' : 'ASSIGN';

    console.log(`\n🔍 Looking for user: ${normalizedEmail}`);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error(`❌ User not found: ${normalizedEmail}`);
      process.exit(1);
    }

    console.log(`\n📋 Current User Details:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);

    if (user.role === newRole) {
      console.log(`\n⚠️  User already has role '${newRole}'`);
      process.exit(0);
    }

    user.role = newRole;
    await user.save();

    console.log(`\n✅ ${action} Admin Role Successful!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   New Role: ${user.role}`);
    console.log(`   Status: Updated in database`);

    // Test the authorization
    console.log(`\n🧪 Authorization Check:`);
    console.log(`   Can access admin panel: ${newRole === 'admin' ? '✅ Yes' : '❌ No'}`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

assignAdminRole();
