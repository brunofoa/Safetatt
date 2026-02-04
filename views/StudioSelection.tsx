
import React, { useEffect, useState } from 'react';
import { User, Studio } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { studioService } from '../services/studioService';
import FloatingHeader from '../components/FloatingHeader';

interface StudioSelectionProps {
  user: User;
  onSelectStudio: (studio: Studio) => void;
  onEnterAdmin?: () => void;
}

const MOCK_STUDIOS: Studio[] = []; // Disabled mock


const getRoleLabel = (role: string) => {
  switch (role) {
    case 'MASTER': return 'MASTER';
    case 'ARTIST': return 'TATUADOR';
    case 'CLIENT': return 'CLIENTE';
    default: return role;
  }
};

const StudioSelection: React.FC<StudioSelectionProps> = ({ user, onSelectStudio, onEnterAdmin }) => {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>(''); // Real user name from profile

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;
      console.log('Fetching data for user:', session.user.id);

      try {
        // 1. Check Admin (Direct Query)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_platform_admin, full_name') // Fetch name too just in case
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        } else {
          // Set the real user name from profile
          if (profile?.full_name) {
            setUserName(profile.full_name);
          }
          if (profile?.is_platform_admin) {
            console.log('User is admin');
            setIsAdmin(true);
          } else {
            console.log('User is NOT admin', profile);
          }
        }

        // 2. Fetch Studios (Manual Two-Step to avoid inner join RLS weirdness)
        const { data: members, error: memberError } = await supabase
          .from('studio_members')
          .select('studio_id, role')
          .eq('profile_id', session.user.id);

        if (memberError) {
          console.error('Member fetch error:', memberError);
          setLoading(false);
          return;
        }

        if (members && members.length > 0) {
          const studioIds = members.map(m => m.studio_id);
          const { data: studiosData, error: studiosError } = await supabase
            .from('studios')
            .select('id, name, logo_url, contact_email, owner_id') // Ensure fields exist
            .in('id', studioIds);

          if (studiosError) {
            console.error('Studios fetch error:', studiosError);
          } else {
            // Merge data
            const finalStudios = studiosData?.map(s => {
              const member = members.find(m => m.studio_id === s.id);
              return {
                id: s.id,
                name: s.name,
                logo: s.logo_url,
                role: member?.role || 'CLIENT', // Fallback
                owner: 'Studio',
                memberCount: 0
              } as Studio;
            }) || [];
            setStudios(finalStudios);
          }
        } else {
          console.log('No memberships found');
          setStudios([]);
        }

      } catch (err) {
        console.error('Unexpected error in fetchData:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // Use real name from profile, fallback to user prop name
  const displayName = userName || user.name || 'Usuário';

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <FloatingHeader user={user} onToggleMenu={() => { }} />

      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Bem-vindo de volta, {displayName.split(' ')[0]}</h1>
          <p className="text-slate-500 dark:text-slate-400">Selecione qual estúdio você gostaria de gerenciar ou visualizar hoje.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Admin Card */}
          {isAdmin && onEnterAdmin && (
            <div
              className="group relative bg-zinc-900 border border-[#92FFAD]/30 p-8 rounded-3xl hover:shadow-xl hover:shadow-[#92FFAD]/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={onEnterAdmin}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#92FFAD] to-[#5CDFF0] flex items-center justify-center shadow-lg shadow-[#92FFAD]/20">
                  <span className="material-icons text-black text-3xl">admin_panel_settings</span>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-[#5CDFF0]/10 text-[#5CDFF0]">
                  ADMIN
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1 text-white">SaaS Admin</h3>
              <p className="text-zinc-400 text-sm mb-6">Área Administrativa Global</p>

              <div className="flex items-center justify-end mt-auto">
                <button className="bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                  Acessar <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="col-span-full text-center py-10 text-gray-500">
              <span className="material-icons animate-spin text-3xl mb-2">sync</span>
              <p>Carregando estúdios...</p>
            </div>
          ) : studios.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500">
              <p>Nenhum estúdio encontrado. Clique abaixo para criar o seu!</p>
            </div>
          ) : (
            studios.map((studio) => (
              <div
                key={studio.id}
                className="group relative bg-white dark:bg-zinc-900 border border-[#333333] p-8 rounded-3xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => onSelectStudio(studio)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                    {studio.logo ? (
                      <img alt={studio.name} className="object-cover w-full h-full opacity-80 group-hover:scale-110 transition-transform duration-500" src={studio.logo} />
                    ) : (
                      <span className="text-xl font-bold text-gray-400">{studio.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${studio.role === 'MASTER' ? 'bg-primary text-black' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>
                    {getRoleLabel(studio.role)}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1">{studio.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{studio.owner}</p>

                <div className="flex items-center justify-end mt-auto">
                  <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-primary hover:text-black dark:hover:bg-primary dark:hover:text-black transition-colors flex items-center gap-2">
                    Entrar <span className="material-icons text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            )))}


        </div>
      </main>
    </div>
  );
};

export default StudioSelection;
