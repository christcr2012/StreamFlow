export class ServiceError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const authService = {
  async requestPasswordReset({ email }: { email: string }) {
    // Placeholder: pretend we sent an email
    return {
      message: `If an account exists for ${email}, a reset link has been sent.`,
    };
  },
  async confirmPasswordReset({
    token,
    password,
  }: {
    token: string;
    password: string;
  }) {
    if (!token || !password)
      throw new ServiceError(400, "BadRequest", "Missing token or password");
    // Placeholder: accept any token/password
    return { message: "Password has been reset successfully." };
  },
  async register({
    name,
    email,
    password,
    tenantInvite,
  }: {
    name: string;
    email: string;
    password: string;
    tenantInvite?: string;
  }) {
    // Placeholder: generate a mock user id
    // Security: Use crypto.randomBytes for cryptographically secure random values
    const crypto = require("crypto");
    const userId = `user_${crypto.randomBytes(4).toString("hex")}`;
    return { userId };
  },
};
