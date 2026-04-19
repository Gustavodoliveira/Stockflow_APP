import { api } from "./api";

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserWithTokenResponse {
  user: UserResponse;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export function login(login: LoginRequest): Promise<CreateUserWithTokenResponse> {
  return api.post("/users/login", login).then((response) => {
    return response.data as CreateUserWithTokenResponse;
  });
}