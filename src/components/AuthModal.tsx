"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, User, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'login' | 'register';
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const AuthModal = ({ open, onOpenChange, initialMode = 'login' }: AuthModalProps) => {
  const { login, register, status, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isLoading = status === 'loading';

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      clearError();
    }
  }, [open, mode, clearError]);

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Register mode validations
    if (mode === 'register') {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setErrors({});

      if (mode === 'login') {
        await login({
          email: formData.email,
          password: formData.password
        });
        toast.success('Welcome back! You\'re now logged in.');
      } else {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        toast.success('Account created successfully! You\'re now logged in.');
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific error codes from API
      const errorMessage = error.message || 'An unexpected error occurred';
      
      if (error.code === 'DUPLICATE_EMAIL') {
        setErrors({ email: 'An account with this email already exists' });
      } else if (error.code === 'INVALID_CREDENTIALS') {
        setErrors({ general: 'Invalid email or password' });
      } else if (error.code === 'WEAK_PASSWORD') {
        setErrors({ password: 'Password must be at least 6 characters long' });
      } else if (error.code === 'INVALID_EMAIL_FORMAT') {
        setErrors({ email: 'Please enter a valid email address' });
      } else {
        setErrors({ general: errorMessage });
        toast.error(errorMessage);
      }
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-heading font-bold text-center">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {mode === 'login' 
              ? 'Sign in to access your decision history and community polls'
              : 'Join the community and start making better decisions together'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {errors.general && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{errors.general}</p>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`pl-10 transition-colors ${errors.name ? 'border-destructive focus:border-destructive' : ''}`}
                  disabled={isLoading}
                  autoFocus={mode === 'register'}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive font-medium">{errors.name}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 transition-colors ${errors.email ? 'border-destructive focus:border-destructive' : ''}`}
                disabled={isLoading}
                autoFocus={mode === 'login'}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive font-medium">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'login' ? 'Enter your password' : 'Create a password (min. 6 characters)'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 transition-colors ${errors.password ? 'border-destructive focus:border-destructive' : ''}`}
                disabled={isLoading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive font-medium">{errors.password}</p>
            )}
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`pl-10 pr-10 transition-colors ${errors.confirmPassword ? 'border-destructive focus:border-destructive' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive font-medium">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-2.5 transition-all duration-200 transform hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <Button
              type="button"
              variant="ghost"
              className="text-primary hover:text-primary/80 font-medium p-0 h-auto hover:bg-transparent"
              onClick={switchMode}
              disabled={isLoading}
            >
              {mode === 'login' ? 'Create one now' : 'Sign in instead'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};