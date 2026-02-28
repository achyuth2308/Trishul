// 🔱 Trishul Client — Matching sample for trishul.schema.js

export default [
    {
        name: "registerUser",
        method: "POST",
        url: "/users/register",
        payload: { email: "string", password: "string", name: "string" },
        response: { id: "string", token: "string" },
        auth: false
    },
    {
        name: "loginUser",
        method: "POST",
        url: "/users/login",
        payload: { email: "string", password: "string" },
        response: { id: "string", token: "string" },
        auth: false
    },
    {
        name: "getProfile",
        method: "GET",
        url: "/users/:id/profile",
        payload: {},
        response: { id: "string", email: "string", name: "string" },
        auth: "jwt"
    },
    {
        name: "updateProfile",
        method: "PUT",
        url: "/users/:id/profile",
        payload: { name: "string", email: "string" },
        response: { id: "string", email: "string", name: "string" },
        auth: "jwt"
    },
    {
        name: "deleteUser",
        method: "DELETE",
        url: "/users/:id",
        payload: {},
        response: { success: "boolean" },
        auth: "role:admin"
    },
    {
        name: "listProducts",
        method: "GET",
        url: "/products",
        payload: {},
        response: { products: "string" },
        auth: false
    },
    {
        name: "createProduct",
        method: "POST",
        url: "/products",
        payload: { name: "string", price: "number", description: "string" },
        response: { id: "string", name: "string", price: "number" },
        auth: "role:admin"
    },
    {
        name: "updateProduct",
        method: "PUT",
        url: "/products/:id",
        payload: { name: "string", price: "number", description: "string" },
        response: { id: "string", name: "string", price: "number" },
        auth: "role:admin"
    },
    {
        name: "deleteProduct",
        method: "DELETE",
        url: "/products/:id",
        payload: {},
        response: { success: "boolean" },
        auth: "role:admin"
    }
];
