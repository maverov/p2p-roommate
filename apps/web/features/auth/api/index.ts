import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { loginSchema, signupSchema } from '../schemas';

// Example TanStack Query hooks for auth
// Replace with your actual API endpoints

export const useLogin = () =>
  useMutation({
    mutationFn: (credentials: any) => api.post('/auth/login', credentials),
  });

export const useSignup = () =>
  useMutation({
    mutationFn: (data: any) => api.post('/auth/signup', data),
  });

export const useUser = () =>
  useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/auth/me'),
  });
