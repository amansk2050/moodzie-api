import * as argon2 from "argon2";
import * as crypto from "crypto";

/**
 * @function
 * Takes password as string and returns hashed password using argon2 algorithm
 * @param password Password to be masked
 * @returns hashed password using argon2 algorithm with argon2id specs
 * @author <a href="https://debiprasadmishra.net">Debi Prasad Mishra</a>
 */
const argon2hash = async (password: string): Promise<string> => {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    hashLength: 32,
    parallelism: 4,
    memoryCost: 65536,
    timeCost: 10,
    salt: crypto.randomBytes(16),
  });

  return hash;
};

/**
 * @function
 * Takes hash and password as string and returns whether the password verifies with argon2 hash
 * @param hash argon2 hash
 * @param password password by user
 * @returns whether password verifies with argon2 hash
 * @author <a href="https://debiprasadmishra.net">Debi Prasad Mishra</a>
 */
const argon2verify = async (
  hash: string,
  password: string,
): Promise<boolean> => {
  console.log("argon2verify -> hash", hash);
  console.log("argon2verify -> password", password);
  const isVeried = await argon2.verify(`${hash}`, password);
  console.log("argon2verify -> isVeried", isVeried);
  return isVeried;
};

export { argon2hash, argon2verify };
