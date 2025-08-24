import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const saltRounds = 12;
    const currentTimestamp = new Date().toISOString();
    
    const sampleUsers = [
        {
            email: 'john.smith@email.com',
            name: 'John Smith',
            password: await bcrypt.hash('password123', saltRounds),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'sarah.johnson@email.com',
            name: 'Sarah Johnson',
            password: await bcrypt.hash('password123', saltRounds),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'michael.chen@email.com',
            name: 'Michael Chen',
            password: await bcrypt.hash('password123', saltRounds),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'emma.rodriguez@email.com',
            name: 'Emma Rodriguez',
            password: await bcrypt.hash('password123', saltRounds),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'david.kim@email.com',
            name: 'David Kim',
            password: await bcrypt.hash('password123', saltRounds),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});