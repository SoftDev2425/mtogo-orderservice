import prisma from '../../prisma/client';

export const handlePopulateDatabase = async () => {
  // remove from users and from TestTable and add

  await prisma.user.deleteMany();
  await prisma.testTable.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        name: 'Andreas',
        email: 'af@af.dk',
        password: 'password',
      },
      {
        name: 'Owais',
        email: 'ow@ow.dk',
        password: 'password',
      },
    ],
  });
};
