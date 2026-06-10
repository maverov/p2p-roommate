// Feature-scoped types for auth domain
export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  user: User;
};
