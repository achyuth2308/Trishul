// ✍️ YOUR CANVAS — Write business logic here

import prisma from '../config/db.js';

/**
 * GET /products
 *
 *
 * @returns {Promise<{"products":"string"}>}
 */
export async function listProducts() {
  // TODO: Implement listProducts
  //
  // Prisma model: Product
  // Example: const result = await prisma.product.findUnique({ where: { id } });
  //
  // Expected input:  (none)
  // Expected output: {"products":"string"}
  //
  throw new Error('listProducts not implemented');
}

/**
 * POST /products
 *
 * @param {object} args
 * @param {string} args.name — from request body
 * @param {number} args.price — from request body
 * @param {string} args.description — from request body
 *
 * @returns {Promise<{"id":"string","name":"string","price":"number"}>}
 */
export async function createProduct({ name, price, description }) {
  // TODO: Implement createProduct
  //
  // Prisma model: Product
  // Example: const result = await prisma.product.findUnique({ where: { id } });
  //
  // Expected input:  { name, price, description }
  // Expected output: {"id":"string","name":"string","price":"number"}
  //
  throw new Error('createProduct not implemented');
}

/**
 * PUT /products/:id
 *
 * @param {object} args
 * @param {string} args.id — from URL params
 * @param {string} args.name — from request body
 * @param {number} args.price — from request body
 * @param {string} args.description — from request body
 *
 * @returns {Promise<{"id":"string","name":"string","price":"number"}>}
 */
export async function updateProduct({ id, name, price, description }) {
  // TODO: Implement updateProduct
  //
  // Prisma model: Product
  // Example: const result = await prisma.product.findUnique({ where: { id } });
  //
  // Expected input:  { id, name, price, description }
  // Expected output: {"id":"string","name":"string","price":"number"}
  //
  throw new Error('updateProduct not implemented');
}

/**
 * DELETE /products/:id
 *
 * @param {object} args
 * @param {string} args.id — from URL params
 *
 * @returns {Promise<{"success":"boolean"}>}
 */
export async function deleteProduct({ id }) {
  // TODO: Implement deleteProduct
  //
  // Prisma model: Product
  // Example: const result = await prisma.product.findUnique({ where: { id } });
  //
  // Expected input:  { id }
  // Expected output: {"success":"boolean"}
  //
  throw new Error('deleteProduct not implemented');
}

