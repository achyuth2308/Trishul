// ✍️ YOUR CANVAS — Write business logic here

import prisma from '../config/db.js';

/**
 * POST /users/register
 *
 * @param {object} args
 * @param {string} args.email — from request body
 * @param {string} args.password — from request body
 * @param {string} args.name — from request body
 *
 * @returns {Promise<{"id":"string","token":"string"}>}
 */
export async function registerUser({ email, password, name }) {
  // TODO: Implement registerUser
  //
  // Prisma model: User
  // Example: const result = await prisma.user.findUnique({ where: { id } });
  //
  // Expected input:  { email, password, name }
  // Expected output: {"id":"string","token":"string"}
  //
  throw new Error('registerUser not implemented');
}

/**
 * POST /users/login
 *
 * @param {object} args
 * @param {string} args.email — from request body
 * @param {string} args.password — from request body
 *
 * @returns {Promise<{"id":"string","token":"string"}>}
 */
export async function loginUser({ email, password }) {
  // TODO: Implement loginUser
  //
  // Prisma model: User
  // Example: const result = await prisma.user.findUnique({ where: { id } });
  //
  // Expected input:  { email, password }
  // Expected output: {"id":"string","token":"string"}
  //
  throw new Error('loginUser not implemented');
}

/**
 * GET /users/:id/profile
 *
 * @param {object} args
 * @param {string} args.id — from URL params
 *
 * @returns {Promise<{"id":"string","email":"string","name":"string"}>}
 */
export async function getProfile({ id }) {
  // TODO: Implement getProfile
  //
  // Prisma model: User
  // Example: const result = await prisma.user.findUnique({ where: { id } });
  //
  // Expected input:  { id }
  // Expected output: {"id":"string","email":"string","name":"string"}
  //
  throw new Error('getProfile not implemented');
}

/**
 * PUT /users/:id/profile
 *
 * @param {object} args
 * @param {string} args.id — from URL params
 * @param {string} args.name — from request body
 * @param {string} args.email — from request body
 *
 * @returns {Promise<{"id":"string","email":"string","name":"string"}>}
 */
export async function updateProfile({ id, name, email }) {
  // TODO: Implement updateProfile
  //
  // Prisma model: User
  // Example: const result = await prisma.user.findUnique({ where: { id } });
  //
  // Expected input:  { id, name, email }
  // Expected output: {"id":"string","email":"string","name":"string"}
  //
  throw new Error('updateProfile not implemented');
}

/**
 * DELETE /users/:id
 *
 * @param {object} args
 * @param {string} args.id — from URL params
 *
 * @returns {Promise<{"success":"boolean"}>}
 */
export async function deleteUser({ id }) {
  // TODO: Implement deleteUser
  //
  // Prisma model: User
  // Example: const result = await prisma.user.findUnique({ where: { id } });
  //
  // Expected input:  { id }
  // Expected output: {"success":"boolean"}
  //
  throw new Error('deleteUser not implemented');
}

