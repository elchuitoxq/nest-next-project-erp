import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';

async function bootstrap() {
  console.log('Initializing NestJS Context for Verification...');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const authService = app.get(AuthService);
    console.log('AuthService retrieved.');

    console.log('Testing validateUser with admin credentials...');
    const user = await authService.validateUser('admin@erp.com', 'admin123');

    if (user) {
      console.log(
        '✅ SUCCESS: User found and validated via Database connection.',
      );
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
    } else {
      console.error('❌ FAILED: User not found or invalid credentials.');
      process.exit(1);
    }

    console.log('Testing login...');
    const token = await authService.login(user);
    if (token && token.access_token) {
      console.log('✅ SUCCESS: Token generated.');
    } else {
      console.error('❌ FAILED: Token generation failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
