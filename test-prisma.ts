import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

try {
  let p = new PrismaClient({ url: process.env.DATABASE_URL });
  console.log('Success with url');
} catch (e) {
  console.log('Error with url:', e.message);
}

try {
  let p = new PrismaClient();
  console.log('Success empty');
} catch (e) {
  console.log('Error empty:', e.message);
}
