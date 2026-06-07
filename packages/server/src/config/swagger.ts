import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Expense API",
      version: "1.0.0",
      description:
        "Personal Expense Tracker API. Supports expense CRUD, category management, user profiles, Telegram bot integration, and reporting.",
    },
    servers: [
      {
        url: "/api",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token obtained from /auth/login or /auth/register",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            displayName: { type: "string" },
            currency: { type: "string", example: "USD" },
            githubId: { type: "string", nullable: true },
            telegramId: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Expense: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            categoryId: { type: "string", format: "uuid", nullable: true },
            amount: { type: "string", example: "25.50" },
            currency: { type: "string", example: "USD" },
            description: { type: "string", nullable: true },
            expenseDate: { type: "string", format: "date" },
            source: { type: "string", enum: ["web", "telegram"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            name: { type: "string" },
            color: { type: "string", example: "#6366f1" },
            icon: { type: "string", example: "🍔", nullable: true },
            isDefault: { type: "boolean" },
            isDeleted: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
