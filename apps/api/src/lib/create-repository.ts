import { env } from "../config/env.js";
import { MemoryRepository } from "../repositories/memory-repository.js";
import { MongoRepository } from "../repositories/mongo-repository.js";
import type { Repository } from "../repositories/types.js";

export const createRepository = async (): Promise<Repository> => {
  if (env.MONGODB_URI) {
    try {
      const repository = new MongoRepository(env.MONGODB_URI);
      await repository.connect();
      return repository;
    } catch (error) {
      console.warn(
        "MongoDB connection failed. Falling back to memory repository.",
        error
      );
    }
  }

  return new MemoryRepository();
};
