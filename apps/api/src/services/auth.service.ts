import type { AuthUser, CreateUserInput, LoginInput, StoredUserRecord } from "@umurava/shared";

import { HttpError } from "../lib/http-error.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import type { Repository } from "../repositories/types.js";

const toAuthUser = (user: StoredUserRecord): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  roleId: user.roleId,
  location: user.location,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async (
  repository: Repository,
  input: CreateUserInput
): Promise<AuthUser> => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await repository.getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const user = await repository.createUser({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(input.password),
    roleId: input.roleId,
    location: input.location.trim(),
  });

  return toAuthUser(user);
};

export const authenticateUser = async (
  repository: Repository,
  input: LoginInput
): Promise<AuthUser> => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await repository.getUserByEmail(normalizedEmail);

  if (!user) {
    throw new HttpError(401, "Incorrect email or password.");
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new HttpError(401, "Incorrect email or password.");
  }

  return toAuthUser(user);
};
