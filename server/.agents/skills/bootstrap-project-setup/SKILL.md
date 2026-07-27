---
name: bootstrap-project-setup
description: Set up the foundation of the RoomRent backend — main.ts (ValidationPipe, CORS, Swagger, helmet, compression), env validation config, global PrismaModule, standardized HttpExceptionFilter. MUST use this skill BEFORE building any other module if these pieces (PrismaService, common/filters, config/) don't exist yet in the repo — every other skill (add-nest-module, add-prisma-model, build-room-search-api) assumes this foundation is already in place.
---

# Bootstrapping the project foundation

Getting this wrong once breaks the whole project — every later module depends on `PrismaService`, `HttpExceptionFilter`, and already-validated config. Check first: if `src/prisma/prisma.service.ts` already exists, skip this skill and only bootstrap whatever piece is still missing.

## 1. Config — validate env at startup

`src/config/env.validation.ts`
```ts
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("20m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  FRONTEND_URL: z.string().url(),
  REDIS_URL: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${result.error.toString()}`);
  }
  return result.data;
}
```

`src/app.module.ts` — load config through a global `ConfigModule` with validation:
```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    // ...other domain modules registered here
  ],
})
export class AppModule {}
```

> Uses `zod` (add it with `npm i zod` if not present). If the project chooses Joi instead of zod, keep the existing Joi convention — don't mix two validation libraries.

## 2. PrismaModule — global, single shared instance

Two Prisma 7 requirements that are easy to miss and will crash the app at startup if skipped:

1. **`generator client` needs `moduleFormat = "cjs"`** in `prisma/schema.prisma` — this project has no `"type": "module"` in `package.json` (standard NestJS/CommonJS setup), but Prisma 7's `prisma-client` generator defaults to ESM output (uses `import.meta.url`). Without `moduleFormat = "cjs"`, `nest build` compiles the generated client into broken code and Node throws `exports is not defined in ES module scope` at runtime.
2. **A driver adapter is mandatory** — Prisma 7 removed the implicit URL-based connection. `PrismaClient` must be constructed with an `adapter` (e.g. `@prisma/adapter-pg` + `pg` for PostgreSQL), or it throws `PrismaClientInitializationError: PrismaClient was instantiated without any options` immediately on startup. `@prisma/client` (the runtime package, not just the `prisma` CLI) must also be installed — the generated client's internals import from it.

`prisma/schema.prisma`
```prisma
generator client {
  provider        = "prisma-client"
  output          = "../generated/prisma"
  moduleFormat    = "cjs"
}
```

```bash
npm i @prisma/client @prisma/adapter-pg pg
npm i -D prisma @types/pg
```

`src/prisma/prisma.service.ts`
```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }

  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

`src/prisma/prisma.module.ts`
```ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## 3. HttpExceptionFilter — never leak raw DB errors

`src/common/filters/http-exception.filter.ts`
```ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException
      ? exception.getResponse()
      : "Something went wrong, please try again later.";

    if (!isHttpException) {
      // log details on the server, never push the stack trace to the client
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      statusCode: status,
      message: typeof message === "string" ? message : (message as { message?: unknown }).message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## 4. main.ts — ValidationPipe, CORS, Swagger, helmet, compression

```ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // required because the refresh token lives in an httpOnly cookie
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("RoomRent API")
    .setDescription("API for the room rental platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> `cookie-parser` is needed for the refresh token httpOnly cookie (see the `auth-jwt-refresh-otp` skill) — add it with `npm i cookie-parser && npm i -D @types/cookie-parser` if not already present.

## Do NOT
- Leave `ValidationPipe` missing `whitelist`/`forbidNonWhitelisted` — this is the only layer blocking unexpected fields since there's no RLS at the DB.
- Use `origin: "*"` while `credentials: true` — the browser will reject the cookie, and this is also a CSRF hole.
- Let Prisma/DB errors bubble straight to the response — they must always pass through `HttpExceptionFilter`.

## Checklist
- [ ] `ConfigModule` is global, validated with a schema (zod/Joi), app fails fast if required env vars are missing
- [ ] `PrismaModule` is `@Global()`, only one shared `PrismaService` across the app
- [ ] `HttpExceptionFilter` registered globally, never leaks stack traces/SQL
- [ ] `main.ts` has `ValidationPipe` (whitelist + forbidNonWhitelisted + transform), CORS whitelisting `FRONTEND_URL` + `credentials: true`, helmet, compression, cookie-parser
- [ ] Swagger set up at `/docs`, with `addBearerAuth()`
