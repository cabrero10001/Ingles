import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/auth/AuthContext';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let user = auth.user;
      if (isLogin) {
        user = await auth.login(formData.email, formData.password);
      } else {
        user = await auth.register(formData.name, formData.email, formData.password);
      }
      const hasGoal = !!user?.currentGoal;
      navigate(hasGoal ? '/dashboard' : '/onboarding');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2563EB]/5 via-[#10B981]/5 to-[#F59E0B]/5 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center text-white text-xl font-bold">
              L
            </div>
            <h1 className="text-2xl text-[#1A202C]">LinguaPath</h1>
          </div>
          <p className="text-[#6B7280]">
            Aprende el inglés que realmente necesitas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-[#F9FAFB] border-[#E5E7EB]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-[#F9FAFB] border-[#E5E7EB]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="bg-[#F9FAFB] border-[#E5E7EB]"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-white"
            disabled={submitting}
          >
            {submitting ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[#2563EB] hover:underline"
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate' 
              : '¿Ya tienes cuenta? Inicia sesión'
            }
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-[#6B7280] hover:text-[#1A202C]"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
