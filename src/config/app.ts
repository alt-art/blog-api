import { randomBytes } from 'crypto';

export default {
  siteName: process.env.SITE_NAME || 'Site Name',
  sourceCodeUrl: process.env.SOURCE_CODE_URL,
  port: process.env.PORT || 3000,
  emailSecret: randomBytes(256),
  appSecret: randomBytes(256),
  unblockAccountUrl:
    process.env.UNBLOCK_ACCOUNT_URL || 'http://localhost:3000/unblock',
};
