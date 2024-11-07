import prisma from '../../prisma/client';
import { NotFoundError } from '../utils/NotFoundErrorClass';

export const getUserById = async (id: string) => {
  // const user = await db
  //   .selectFrom('Users')
  //   .selectAll()
  //   .where('id', '=', id)
  //   .execute();

  // if (user.length === 0) {
  //   throw new NotFoundError('User not found');
  // }

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

export async function getAllUsers() {
  try {
    // return await db.selectFrom('Users').selectAll().execute();
    return await prisma.user.findMany();
  } catch (e) {
    console.log(e);
  }
}

export const createUser = async (name: string, password: string) => {
  console.log(name, password);
};
