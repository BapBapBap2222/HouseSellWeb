import api, { API_ORIGIN, tokenStorage } from "./api";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ForgotPasswordRequestPayload {
  username: string;
  email: string;
}

export interface ResetPasswordConfirmPayload {
  uid: string;
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface LoginUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

export interface UserProfile {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar: string | null;
  address: string | null;
  short_intro: string | null;
  bio: string | null;
  profile_visible: boolean;
  activity_visible: boolean;
  created_at: string;
  is_staff: boolean;
  is_superuser: boolean;
  agent_is_verified: boolean;
  agent_slug: string | null;
  verification_status: "pending" | "approved" | "denied" | null;
  verification_message: string | null;
}

const normalizeMediaUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_ORIGIN}${path}`;
  return `${API_ORIGIN}/${path}`;
};

const normalizeProfile = (data: UserProfile): UserProfile => ({
  ...data,
  avatar: normalizeMediaUrl(data.avatar),
});

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  short_intro?: string;
  bio?: string;
  profile_visible?: boolean;
  activity_visible?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: LoginUser;
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/api/auth/login/", payload);
  tokenStorage.setTokens(data.access, data.refresh);
  return data;
};

export const register = async (payload: RegisterPayload) => {
  const { data } = await api.post("/api/auth/register/", payload);
  return data;
};

export const logout = async () => {
  const refresh = tokenStorage.getRefresh();
  if (refresh) {
    try {
      await api.post("/api/auth/logout/", { refresh });
    } catch {
      // Ignore token expiry during logout.
    }
  }
  tokenStorage.clear();
};

export const getMe = async (): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>("/api/auth/users/me/");
  return normalizeProfile(data);
};

export const updateProfile = async (payload: FormData | UpdateProfilePayload) => {
  const isFormData = payload instanceof FormData;
  const { data } = await api.patch<UserProfile>("/api/auth/users/me/", payload, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return normalizeProfile(data);
};

export const changePassword = async (payload: ChangePasswordPayload) => {
  const { data } = await api.post("/api/auth/users/change-password/", payload);
  return data;
};

export const requestPasswordReset = async (payload: ForgotPasswordRequestPayload) => {
  const { data } = await api.post("/api/auth/password-reset/request/", payload);
  return data as { message: string };
};

export const validatePasswordResetToken = async (uid: string, token: string) => {
  const { data } = await api.get("/api/auth/password-reset/validate/", {
    params: { uid, token },
  });
  return data as { valid: boolean };
};

export const confirmPasswordReset = async (payload: ResetPasswordConfirmPayload) => {
  const { data } = await api.post("/api/auth/password-reset/confirm/", payload);
  return data as { message: string };
};

export const isAuthenticated = (): boolean => {
  return !!tokenStorage.getAccess();
};
