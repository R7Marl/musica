export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY ?? '',
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@cola-gym.local',
    password: process.env.ADMIN_PASSWORD ?? 'admin123456',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'cola_gym',
    password: process.env.DB_PASSWORD ?? 'cola_gym',
    database: process.env.DB_DATABASE ?? 'cola_gym',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    dropSchema: process.env.DB_DROP_SCHEMA === 'true',
  },
});
