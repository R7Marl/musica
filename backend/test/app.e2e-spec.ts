import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface AddSongResponse {
  song: {
    youtubeVideoId: string;
  };
  queue: Array<{
    youtubeVideoId: string;
  }>;
}

interface CreateBusinessResponse {
  business: {
    id: string;
    slug: string;
  };
  user: {
    email: string;
  };
  defaultQueue: {
    id: string;
    slug: string;
  };
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let ownerToken: string;
  let clientToken: string;
  let queueId: string;
  let queueSlug: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL ?? 'owner@cola-gym.local',
        password: process.env.ADMIN_PASSWORD ?? 'owner123456',
      })
      .expect(201);

    ownerToken = (loginResponse.body as { accessToken: string }).accessToken;

    const uniqueId = Date.now();
    const clientEmail = `cliente-${uniqueId}@cola-gym.local`;
    const clientPassword = 'cliente123456';

    const businessResponse = await request(app.getHttpServer())
      .post('/owner/businesses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `Gym Test ${uniqueId}`,
        slug: `gym-test-${uniqueId}`,
        userEmail: clientEmail,
        userPassword: clientPassword,
      })
      .expect(201);

    const createdBusiness = businessResponse.body as CreateBusinessResponse;
    queueId = createdBusiness.defaultQueue.id;
    queueSlug = createdBusiness.defaultQueue.slug;

    const clientLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: clientEmail,
        password: clientPassword,
      })
      .expect(201);

    clientToken = (clientLoginResponse.body as { accessToken: string })
      .accessToken;
  });

  it('/colas/:queueSlug (GET)', () => {
    return request(app.getHttpServer())
      .get(`/colas/${queueSlug}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveProperty('playback');
        expect(body).toHaveProperty('queue');
      });
  });

  it('/colas/:queueSlug/canciones (POST)', () => {
    return request(app.getHttpServer())
      .post(`/colas/${queueSlug}/canciones`)
      .send({ youtubeUrl: 'https://www.youtube.com/watch?v=e2e123' })
      .expect(201)
      .expect(({ body }) => {
        const response = body as AddSongResponse;

        expect(response.song.youtubeVideoId).toBe('e2e123');
        expect(response.queue).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ youtubeVideoId: 'e2e123' }),
          ]),
        );
      });
  });

  it('/admin/colas/:queueId (GET) requires a valid client token', async () => {
    await request(app.getHttpServer())
      .get(`/admin/colas/${queueId}`)
      .expect(401);

    await request(app.getHttpServer())
      .get(`/admin/colas/${queueId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveProperty('playback');
        expect(body).toHaveProperty('songs');
      });
  });

  it('/client/queues (POST) lets clients create multiple queues', async () => {
    await request(app.getHttpServer())
      .post('/client/queues')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Musculacion' })
      .expect(201)
      .expect(({ body }) => {
        const response = body as { name: string };

        expect(response.name).toBe('Musculacion');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
