import config from '../../config/config';
import logger from '../logger/logger';
import Auth from '../auth/auth.model';
import User from './user.model';
import { InternalUserRole } from './user.constants';

type InternalAdminSeedConfig = {
  name: string;
  email: string;
  password: string;
  role: InternalUserRole;
};

type SeedOptions = {
  requireConfig?: boolean;
};

const getInternalAdminSeedConfig = ({ requireConfig = false }: SeedOptions = {}): InternalAdminSeedConfig | null => {
  const { name, email, password, role } = config.internalAdminSeed;

  if (name && email && password) {
    return {
      name,
      email: email.toLowerCase(),
      password,
      role,
    };
  }

  const hasPartialConfig = Boolean(name || email || password);

  if (hasPartialConfig && requireConfig) {
    throw new Error('Internal admin seed requires INTERNAL_ADMIN_NAME, INTERNAL_ADMIN_EMAIL, and INTERNAL_ADMIN_PASSWORD.');
  }

  if (hasPartialConfig) {
    logger.warn('Skipping internal admin seed because the configuration is incomplete.');
  }

  return null;
};

export const seedInternalAdminUser = async (options: SeedOptions = {}) => {
  const seedConfig = getInternalAdminSeedConfig(options);

  if (!seedConfig) {
    return { seeded: false };
  }

  const { name, email, password, role } = seedConfig;
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      accountType: 'internal',
      role,
      isVerified: true,
      status: 'active',
    });
  } else {
    user.name = name;
    user.email = email;
    user.accountType = 'internal';
    user.role = role;
    user.isVerified = true;
    user.status = 'active';
    await user.save();
  }

  let auth = await Auth.findOne({ email, provider: 'email' });

  if (!auth) {
    auth = await Auth.create({
      user: user.id,
      email,
      password,
      provider: 'email',
    });
  } else {
    auth.user = user.id;
    auth.email = email;

    if (!(await auth.isPasswordMatch(password))) {
      auth.password = password;
    }

    await auth.save();
  }

  logger.info(`Internal admin user is ready for ${email}`);

  return {
    seeded: true,
    userId: user.id,
    email,
    role,
  };
};