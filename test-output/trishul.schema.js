// 🔱 Trishul Schema — Sample with User + Product modules

export default [
    {
        module: "user",
        auth: "jwt",
        db: "User",
        endpoints: [
            {
                method: "POST",
                route: "/users/register",
                name: "registerUser",
                input: { email: "string", password: "string", name: "string" },
                output: { id: "string", token: "string" },
                auth: false
            },
            {
                method: "POST",
                route: "/users/login",
                name: "loginUser",
                input: { email: "string", password: "string" },
                output: { id: "string", token: "string" },
                auth: false
            },
            {
                method: "GET",
                route: "/users/:id/profile",
                name: "getProfile",
                input: {},
                output: { id: "string", email: "string", name: "string" },
                auth: "jwt"
            },
            {
                method: "PUT",
                route: "/users/:id/profile",
                name: "updateProfile",
                input: { name: "string", email: "string" },
                output: { id: "string", email: "string", name: "string" },
                auth: "jwt"
            },
            {
                method: "DELETE",
                route: "/users/:id",
                name: "deleteUser",
                input: {},
                output: { success: "boolean" },
                auth: "role:admin"
            }
        ]
    },
    {
        module: "product",
        auth: "role:admin",
        db: "Product",
        endpoints: [
            {
                method: "GET",
                route: "/products",
                name: "listProducts",
                input: {},
                output: { products: "string" },
                auth: false
            },
            {
                method: "POST",
                route: "/products",
                name: "createProduct",
                input: { name: "string", price: "number", description: "string" },
                output: { id: "string", name: "string", price: "number" },
                auth: "role:admin"
            },
            {
                method: "PUT",
                route: "/products/:id",
                name: "updateProduct",
                input: { name: "string", price: "number", description: "string" },
                output: { id: "string", name: "string", price: "number" },
                auth: "role:admin"
            },
            {
                method: "DELETE",
                route: "/products/:id",
                name: "deleteProduct",
                input: {},
                output: { success: "boolean" },
                auth: "role:admin"
            }
        ]
    }
];
