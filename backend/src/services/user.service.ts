import { createUser } from "../repositories/user.repository";

export async function createUserService(username: string) {
  if (!username || username.trim() === "") {
    throw new Error("Username is required");
  }

  return await createUser(username);
}
