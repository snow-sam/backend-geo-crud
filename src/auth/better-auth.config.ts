import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import { Pool } from 'pg';

export const auth = betterAuth({
  database: new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: false,
  }),
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.FRONTEND_URL || '',
  },
  },

  schema: 'auth',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  user: {
    deleteUser: {
      enabled: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationNameMinLength: 3,
    }),
  ],
  basePath: '/auth',
  trustedOrigins: [
    process.env.FRONTEND_URL || '',
    'http://localhost:3000',
    '*://*',
  ],
});
