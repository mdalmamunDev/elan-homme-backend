import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { AuthService } from './auth.service';
import ApiError from '../../errors/ApiError';
import axios from 'axios';
import { User } from '../user/user.model';
import { TUser } from '../user/user.interface';
import { TokenService } from '../token/token.service';
import { config } from '../../config';

// register
const register = catchAsync(async (req, res) => {

  // confirm password
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Password and Confirm Password not matched.'
    );
  }

  const result = await AuthService.createUser(req.body);
  sendResponse(res, {
    code: StatusCodes.CREATED,
    message: 'User created successfully, please verify your email',
    data: result,
  });
});

const redirectToGoogle = catchAsync(async (req, res) => {

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const options: Record<string, string> = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ].join(" ")
  };

  const qs = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${qs}`);

});

const googleCallback = catchAsync(async (req, res) => {

  const { code } = req.query;

  // try {
  // Exchange code for tokens
  const { data } = await axios.post(
    "https://oauth2.googleapis.com/token",
    {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code"
    }
  );

  const { access_token, id_token } = data;

  // Get user info
  const { data: userInfo } = await axios.get(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${access_token}` }
    }
  );


  // "userInfo": {
  //   "sub": "112833644480251334468",
  //   "name": "Md. Al Mamun",
  //   "given_name": "Md. Al",
  //   "family_name": "Mamun",
  //   "picture": "https://lh3.googleusercontent.com/a/ACg8ocJe3PQi2XjJq8H7LS17wJnz1xmKH9wc88LPtAJDDQaZ2PM04So=s96-c",
  //   "email": "mamun.dev.pro@gmail.com",
  //   "email_verified": true
  // }
  const { sub, email, name, picture } = userInfo;

  // Find or Create user
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      profileImage: picture,
      password: null,
      role: 'user',
      status: 'active',
      step: 0,
      isEmailVerified: true,
    });
  }

  // Create JWT
  const userObj = JSON.parse(JSON.stringify(user)) as TUser;
  const { accessToken, refreshToken } = await TokenService.accessAndRefreshToken(userObj);

  // Ensure tokens exist before setting cookies
  if (refreshToken) AuthService.setRefreshTokenCookie(res, refreshToken);

  // Redirect to frontend with token
  res.redirect(`${config.client.url}/auth/login?accessToken=${accessToken}`);
});

const login = catchAsync(async (req, res) => {
  const { email, password, role } = req.body;
  const result = await AuthService.login(email, password, role);

  if (result.verifyEmailToken) {
    return sendResponse(res, {
      code: StatusCodes.FORBIDDEN, // 403
      // @ts-ignore
      message: result.message,
      // @ts-ignore
      data: { verifyEmailToken: result.verifyEmailToken },
    });
  }

  // Ensure tokens exist before setting cookies
  if (result.tokens) AuthService.setRefreshTokenCookie(res, result.tokens.refreshToken);

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in successfully',
    data: {
      ...result,
      tokens: result.tokens, // Handle null case
    },
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email, token, otp } = req.body;
  const result: any = await AuthService.verifyEmail(email, token, otp);

  if (result?.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // set maxAge to a number
      sameSite: 'lax',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Email verified successfully',
    data: result,
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const result = await AuthService.resendOtp(req.body.email);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Otp sent successfully',
    data: result,
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const result = await AuthService.forgotPassword(req.body.email);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password reset email sent successfully',
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Password and Confirm Password not matched.'
    );
  }

  const result = await AuthService.resetPassword(email, password);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password reset successfully',
    data: {
      result,
    },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { currentPassword, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'New password and Confirm password are not matched!'
    );
  }

  const result = await AuthService.changePassword(
    userId,
    currentPassword,
    password
  );
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password changed successfully',
    data: result,
  });
});

const logout = catchAsync(async (req, res) => {
  const user = req.user;
  await AuthService.logout(user.userId);

  res.clearCookie('refreshToken');

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged out successfully',
    data: {},
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = await AuthService.refreshAuth(req.cookies.refreshToken);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in successfully',
    data: {
      accessToken: token,
    },
  });
});

const updateRole = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { newRole } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  if(user.step !== 0) throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot change your role');

  user.role = newRole;
  user.step = 1; // Mark that the user has changed role once
  await user.save();
  
  sendResponse(res, { code: StatusCodes.OK, data: user });
});

export const AuthController = {
  register,
  redirectToGoogle,
  googleCallback,
  login,
  verifyEmail,
  resendOtp,
  logout,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
  updateRole,
};
