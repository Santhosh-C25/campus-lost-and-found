const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Claim = require('../src/models/Claim');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Admin account ─────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@campus.edu';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Admin User',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  }

  // ── Demo students ─────────────────────────────────────────────────────────
  const studentsData = [
    { name: 'Alice Johnson', email: 'alice@student.edu', password: 'Student@123', studentId: 'STU001', department: 'Computer Science' },
    { name: 'Bob Smith', email: 'bob@student.edu', password: 'Student@123', studentId: 'STU002', department: 'Electrical Engineering' },
    { name: 'Carol White', email: 'carol@student.edu', password: 'Student@123', studentId: 'STU003', department: 'Business Administration' },
  ];

  const students = [];
  for (const sd of studentsData) {
    let u = await User.findOne({ email: sd.email });
    if (!u) {
      u = await User.create({ ...sd, role: 'student' });
      console.log(`✅ Student created: ${sd.email}`);
    }
    students.push(u);
  }

  // ── Demo items ────────────────────────────────────────────────────────────
  const itemCount = await Item.countDocuments();
  if (itemCount === 0) {
    const itemsData = [
      {
        itemName: 'MacBook Pro 13"',
        description: 'Space grey MacBook Pro with a sticker of a mountain on the lid. Left in the library.',
        reportType: 'Lost',
        category: 'Electronics',
        dateOccurred: new Date('2025-01-15'),
        location: 'Main Library – 2nd Floor',
        reportedBy: students[0]._id,
      },
      {
        itemName: 'Black Leather Wallet',
        description: 'Black leather bifold wallet containing a student ID and some cash. Found near the cafeteria entrance.',
        reportType: 'Found',
        category: 'Accessories',
        dateOccurred: new Date('2025-01-18'),
        location: 'Cafeteria Entrance',
        reportedBy: students[1]._id,
      },
      {
        itemName: 'Blue Backpack',
        description: 'Large navy-blue Jansport backpack with math textbooks inside. Lost after the afternoon lecture.',
        reportType: 'Lost',
        category: 'Bags',
        dateOccurred: new Date('2025-01-20'),
        location: 'Block B – Lecture Hall 3',
        reportedBy: students[2]._id,
      },
      {
        itemName: 'Set of Keys',
        description: 'Found a set of 3 keys with a red keychain near the sports complex.',
        reportType: 'Found',
        category: 'Keys',
        dateOccurred: new Date('2025-01-22'),
        location: 'Sports Complex Parking',
        reportedBy: students[0]._id,
      },
      {
        itemName: 'Engineering Textbook',
        description: 'Fundamentals of Electric Circuits, 6th Edition. Has the name "Bob" written inside the cover.',
        reportType: 'Found',
        category: 'Books',
        dateOccurred: new Date('2025-01-23'),
        location: 'Engineering Block – Room 201',
        reportedBy: students[2]._id,
      },
      {
        itemName: 'AirPods Pro',
        description: 'White AirPods Pro in a white case. Engraved with initials AJ. Left on a bench.',
        reportType: 'Lost',
        category: 'Electronics',
        dateOccurred: new Date('2025-01-25'),
        location: 'Central Garden Bench',
        reportedBy: students[1]._id,
      },
      {
        itemName: 'Student ID Card',
        description: 'Student ID card for a Computer Science student. Found on the floor near the printer.',
        reportType: 'Found',
        category: 'Documents',
        dateOccurred: new Date('2025-01-26'),
        location: 'Admin Block – Ground Floor',
        reportedBy: students[0]._id,
      },
      {
        itemName: 'Red Umbrella',
        description: 'Compact red umbrella with a floral pattern left in classroom 105.',
        reportType: 'Found',
        category: 'Accessories',
        dateOccurred: new Date('2025-01-27'),
        location: 'Block A – Room 105',
        reportedBy: students[1]._id,
      },
    ];

    await Item.insertMany(itemsData);
    console.log(`✅ ${itemsData.length} demo items created`);
  } else {
    console.log(`ℹ️  Items already exist (${itemCount}), skipping`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────');
  console.log(`Admin login:   ${process.env.ADMIN_EMAIL || 'admin@campus.edu'}`);
  console.log(`Admin pass:    ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
  console.log('Student login: alice@student.edu / Student@123');
  console.log('─────────────────────────────────────');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
