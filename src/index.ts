import dotenv from 'dotenv';
import createServer from './utils/server';
import prisma from '../prisma/client';
import { handlePopulateDatabase } from './utils/handlePopulateDatabase';

dotenv.config();

export const app = createServer();
const port = process.env.PORT || 8000;

async function main() {
  app.listen(port, () => {
    console.log(`Server is listening on port http://localhost:${port}`);
  });
}

main()
  .then(async () => {
    await prisma.$connect();
    await handlePopulateDatabase();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
