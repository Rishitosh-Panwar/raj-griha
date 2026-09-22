import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const GoogleButton = () => {
  const buttonRef = useRef(null);
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const user = await googleLogin(response.credential);
          toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
          navigate(user.role === 'admin' ? '/admin/dashboard' : '/');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Google sign-in failed');
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline', size: 'large', width: '100%', text: 'continue_with',
    });
  }, [googleLogin, navigate]);

  return <div ref={buttonRef} className="flex justify-center" />;
};

export default GoogleButton;