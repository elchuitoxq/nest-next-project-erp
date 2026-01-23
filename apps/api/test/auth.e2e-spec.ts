import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth System (e2e)', () => {
  let app: INestApplication;
  const testUser = {
    email: 'test_e2e@erp.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // In a real scenario, we might want to clean up the DB here
    // connection.close()
    await app.close();
  });

  it('/auth/login (POST) - fails with wrong credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'wrong@email.com', password: 'wrong' })
      .expect(401);
  });

  it('/auth/login (POST) - succeeds with seed admin user', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@erp.com', password: 'admin123' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
        console.log(
          'Token received:',
          res.body.access_token.substring(0, 20) + '...',
        );
      });
  });
});
