import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import axios from 'axios';

export interface OAuthUserData {
  email: string;
  firstName: string;
  lastName: string;
  provider: 'google' | 'apple' | 'facebook';
  providerId: string;
  picture?: string;
  emailVerified: boolean;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private googleClient: OAuth2Client | null = null;
  private appleJwksClient: jwksClient.JwksClient | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Google OAuth
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (googleClientId) {
      this.googleClient = new OAuth2Client(googleClientId);
      this.logger.log('Google OAuth initialized');
    }

    // Apple Sign In JWKS client
    this.appleJwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000, // 10 minutes
    });
    this.logger.log('Apple Sign In initialized');
  }

  /**
   * Verify Google Token (ID Token or Access Token) and extract user data
   */
  async verifyGoogleToken(token: string): Promise<OAuthUserData> {
    if (!this.googleClient) {
      throw new UnauthorizedException('Google OAuth não está configurado');
    }

    try {
      // First, try to verify as ID Token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Token Google inválido');
      }

      const { email, given_name, family_name, sub, picture, email_verified } = payload;

      if (!email) {
        throw new UnauthorizedException('Email não fornecido pelo Google');
      }

      this.logger.log(`Google OAuth verified (ID Token): ${email}`);

      return {
        email,
        firstName: given_name || '',
        lastName: family_name || '',
        provider: 'google',
        providerId: sub,
        picture,
        emailVerified: email_verified || false,
      };
    } catch (idTokenError) {
      // If ID token verification fails, try as Access Token
      this.logger.log('ID Token verification failed, trying as Access Token...');
      
      try {
        // Use Google's userinfo endpoint with access token
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { email, given_name, family_name, sub, picture, email_verified } = response.data;

        if (!email) {
          throw new UnauthorizedException('Email não fornecido pelo Google');
        }

        this.logger.log(`Google OAuth verified (Access Token): ${email}`);

        return {
          email,
          firstName: given_name || '',
          lastName: family_name || '',
          provider: 'google',
          providerId: sub,
          picture,
          emailVerified: email_verified || false,
        };
      } catch (accessTokenError) {
        this.logger.error('Google token verification failed:', accessTokenError);
        throw new UnauthorizedException('Token Google inválido ou expirado');
      }
    }
  }

  /**
   * Verify Apple ID Token and extract user data
   */
  async verifyAppleToken(idToken: string, userData?: { firstName?: string; lastName?: string }): Promise<OAuthUserData> {
    try {
      // Decode token header to get kid
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        throw new UnauthorizedException('Token Apple inválido');
      }

      const kid = decoded.header.kid;
      if (!kid) {
        throw new UnauthorizedException('Token Apple inválido: kid ausente');
      }
      
      // Get signing key from Apple
      const key = await this.getAppleSigningKey(kid);
      
      // Verify token
      const payload = jwt.verify(idToken, key, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: this.configService.get<string>('APPLE_CLIENT_ID'),
      }) as jwt.JwtPayload;

      const email = payload.email as string;
      if (!email) {
        throw new UnauthorizedException('Email não fornecido pela Apple');
      }

      this.logger.log(`Apple OAuth verified: ${email}`);

      // Apple only provides name on first login
      return {
        email,
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        provider: 'apple',
        providerId: payload.sub as string,
        emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
      };
    } catch (error) {
      this.logger.error('Apple token verification failed:', error);
      throw new UnauthorizedException('Token Apple inválido ou expirado');
    }
  }

  private getAppleSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.appleJwksClient) {
        reject(new Error('Apple JWKS client not initialized'));
        return;
      }

      this.appleJwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
          return;
        }
        const signingKey = key?.getPublicKey();
        if (!signingKey) {
          reject(new Error('Could not get Apple signing key'));
          return;
        }
        resolve(signingKey);
      });
    });
  }

  /**
   * Verify Facebook Access Token and extract user data
   */
  async verifyFacebookToken(accessToken: string): Promise<OAuthUserData> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

    if (!appId || !appSecret) {
      throw new UnauthorizedException('Facebook OAuth não está configurado');
    }

    try {
      // First, verify the token is valid
      const debugResponse = await axios.get(
        `https://graph.facebook.com/debug_token`,
        {
          params: {
            input_token: accessToken,
            access_token: `${appId}|${appSecret}`,
          },
        }
      );

      const debugData = debugResponse.data.data;
      if (!debugData.is_valid) {
        throw new UnauthorizedException('Token Facebook inválido');
      }

      if (debugData.app_id !== appId) {
        throw new UnauthorizedException('Token não pertence a este app');
      }

      // Get user data
      const userResponse = await axios.get(
        `https://graph.facebook.com/me`,
        {
          params: {
            fields: 'id,email,first_name,last_name,picture',
            access_token: accessToken,
          },
        }
      );

      const userData = userResponse.data;
      
      if (!userData.email) {
        throw new UnauthorizedException('Email não fornecido pelo Facebook. Verifique as permissões.');
      }

      this.logger.log(`Facebook OAuth verified: ${userData.email}`);

      return {
        email: userData.email,
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        provider: 'facebook',
        providerId: userData.id,
        picture: userData.picture?.data?.url,
        emailVerified: true, // Facebook emails are verified
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Facebook API error:', error.response?.data);
      } else {
        this.logger.error('Facebook token verification failed:', error);
      }
      throw new UnauthorizedException('Token Facebook inválido ou expirado');
    }
  }
}
