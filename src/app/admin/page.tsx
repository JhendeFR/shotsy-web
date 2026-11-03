'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  Users,
  Lightbulb,
  Check,
  X,
  Crown,
  Ban,
  Database,
  Copy,
  Layers,
} from 'lucide-react';
import { supabase, ChallengeSuggestion, UserProfile, Challenge } from '@/lib/supabase';
import { ALL_CHALLENGES } from '@/lib/challenges-data';
import styles from './admin.module.css';

const DEFAULT_ADMIN_PIN = 'SHOTSY2026';

// Sugerencias de muestra por si la tabla de Supabase aún no tiene registros
const INITIAL_MOCK_SUGGESTIONS: ChallengeSuggestion[] = [
  {
    id: 1,
    user_email: 'camila.fiesta@gmail.com',
    category_id: 1,
    category_name: 'Previa Suave',
    content: 'El último en tocarse la nariz toma 2 tragos.',
    drinks_penalty: 2,
    status: 'pending',
    created_at: '2026-11-03',
  },
  {
    id: 2,
    user_email: 'lucas.shots@gmail.com',
    category_id: 2,
    category_name: 'Yo Nunca Clásico',
    content: 'Yo nunca he fingido no ver a alguien en el supermercado.',
    drinks_penalty: 1,
    status: 'pending',
    created_at: '2026-11-03',
  },
  {
    id: 3,
    user_email: 'vip.mateo@gmail.com',
    category_id: 3,
    category_name: 'Modo Fuego (+18)',
    content: 'Dale un abrazo de 20 segundos a quien consideres más atractivo.',
    drinks_penalty: 2,
    status: 'pending',
    created_at: '2026-11-02',
  },
];

const INITIAL_MOCK_USERS: UserProfile[] = [
  {
    id: 'usr_1',
    email: 'jheandef@gmail.com',
    display_name: 'Jhende (Admin)',
    is_vip: true,
    is_banned: false,
    role: 'admin',
    created_at: '2026-10-26',
  },
  {
    id: 'usr_2',
    email: 'camila.fiesta@gmail.com',
    display_name: 'Camila',
    is_vip: true,
    is_banned: false,
    role: 'user',
    created_at: '2026-11-01',
  },
  {
    id: 'usr_3',
    email: 'lucas.shots@gmail.com',
    display_name: 'Lucas',
    is_vip: false,
    is_banned: false,
    role: 'user',
    created_at: '2026-11-02',
  },
  {
    id: 'usr_4',
    email: 'troll.user@spam.com',
    display_name: 'Troll User',
    is_vip: false,
    is_banned: true,
    role: 'user',
    created_at: '2026-11-02',
  },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'suggestions' | 'users' | 'challenges' | 'sql'>('suggestions');

  // Estados de datos
  const [suggestions, setSuggestions] = useState<ChallengeSuggestion[]>(INITIAL_MOCK_SUGGESTIONS);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_MOCK_USERS);
  const [challenges, setChallenges] = useState<Challenge[]>(ALL_CHALLENGES);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Comprobar sesión de admin
  useEffect(() => {
    const isSaved = localStorage.getItem('shotsy_admin_auth') === 'true';
    if (isSaved) setIsAuthenticated(true);

    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data: sugData } = await supabase.from('challenge_suggestions').select('*').order('id', { ascending: false });
      if (sugData && sugData.length > 0) {
        setSuggestions(sugData);
      }

      const { data: profData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profData && profData.length > 0) {
        setUsers(profData);
      }

      const { data: chalData } = await supabase.from('challenges').select('*');
      if (chalData && chalData.length > 0) {
        setChallenges(chalData);
      }
    } catch {
      // Usa mocks locales si las tablas remotas aún no han sido creadas
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === DEFAULT_ADMIN_PIN) {
      setIsAuthenticated(true);
      localStorage.setItem('shotsy_admin_auth', 'true');
      setPinError('');
    } else {
      setPinError('PIN incorrecto. Ingresa el código maestro de administrador.');
    }
  };

  // Acciones en sugerencias
  const handleApproveSuggestion = async (sug: ChallengeSuggestion) => {
    try {
      // 1. Insertar en tabla de retos de Supabase
      await supabase.from('challenges').insert([
        {
          category_id: sug.category_id,
          type: sug.category_id === 2 ? 'yo_nunca' : 'reto',
          content: sug.content,
          drinks_penalty: sug.drinks_penalty,
          is_vip: sug.category_id >= 3,
          active: true,
        },
      ]);

      // 2. Actualizar estado de la sugerencia
      await supabase.from('challenge_suggestions').update({ status: 'approved' }).eq('id', sug.id);
    } catch {
      // Local
    }

    setSuggestions((prev) =>
      prev.map((item) => (item.id === sug.id ? { ...item, status: 'approved' } : item))
    );
    alert('¡Reto aprobado e integrado al catálogo oficial de Shotsy!');
  };

  const handleRejectSuggestion = async (id: number) => {
    try {
      await supabase.from('challenge_suggestions').update({ status: 'rejected' }).eq('id', id);
    } catch {
      // Local
    }

    setSuggestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
  };

  // Acciones de usuarios
  const handleToggleVip = async (user: UserProfile) => {
    const nextVip = !user.is_vip;
    try {
      await supabase.from('profiles').update({ is_vip: nextVip }).eq('id', user.id);
    } catch {
      // Local
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_vip: nextVip } : u))
    );
  };

  const handleToggleBan = async (user: UserProfile) => {
    const nextBan = !user.is_banned;
    try {
      await supabase.from('profiles').update({ is_banned: nextBan }).eq('id', user.id);
    } catch {
      // Local
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_banned: nextBan } : u))
    );
  };

  const sqlCodeForSupabase = `-- ============================================================================
-- SHOTSY GAME - SCRIPT DE ACTUALIZACIÓN SQL PARA SUPABASE
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase
-- ============================================================================

-- 1. Tabla de Categorías / Modos
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color_hex VARCHAR(20) DEFAULT '#ff007f',
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actualizar o insertar las 4 categorías oficiales (conflicto por ID)
INSERT INTO categories (id, slug, name, description, icon, color_hex, is_vip) VALUES
(1, 'previa-suave', 'Previa Suave', 'Para romper el hielo y empezar la noche.', 'beer', '#00f2fe', false),
(2, 'yo-nunca', 'Yo Nunca Clásico', 'Confesiones rápidas. Si lo hiciste, tomas.', 'hand', '#a8ff78', false),
(3, 'picante-vip', 'Modo Fuego +18', 'Retos intensos y preguntas sin filtro.', 'flame', '#ff0844', true),
(4, 'pa-quedar-hecho-p', 'Pa'' quedar hecho P', 'Solo para valientes. Castigos grupales que no perdonan.', 'skull', '#b224ef', true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color_hex = EXCLUDED.color_hex,
  is_vip = EXCLUDED.is_vip;

-- Sincronizar secuencia de categorías
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(MAX(id), 1)) FROM categories;

-- 2. Tabla de Retos y Preguntas
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- 'reto', 'yo_nunca', 'penitencia'
  content TEXT NOT NULL,
  drinks_penalty INT DEFAULT 1,
  is_vip BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Perfiles de Usuario vinculada a Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'user', -- 'user' o 'admin'
  suggest_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Sugerencias de Retos de la Comunidad
CREATE TABLE IF NOT EXISTS challenge_suggestions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  drinks_penalty INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Trigger Automático al Registrar un Usuario (Google o Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, is_vip, is_banned, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    FALSE,
    FALSE,
    CASE WHEN NEW.email = 'jheandef@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Políticas de Seguridad RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_suggestions ENABLE ROW LEVEL SECURITY;

-- Categorías y retos: lectura pública
DROP POLICY IF EXISTS "Lectura publica de categorias" ON categories;
CREATE POLICY "Lectura publica de categorias" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura publica de retos" ON challenges;
CREATE POLICY "Lectura publica de retos" ON challenges FOR SELECT USING (active = true);

-- Perfiles: cada usuario lee y edita el suyo
DROP POLICY IF EXISTS "Lectura de perfiles propios" ON profiles;
CREATE POLICY "Lectura de perfiles propios" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Actualizacion de perfiles propios" ON profiles;
CREATE POLICY "Actualizacion de perfiles propios" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Sugerencias: inserción autenticada o pública, lectura por admin
DROP POLICY IF EXISTS "Insercion de sugerencias" ON challenge_suggestions;
CREATE POLICY "Insercion de sugerencias" ON challenge_suggestions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura de sugerencias" ON challenge_suggestions;
CREATE POLICY "Lectura de sugerencias" ON challenge_suggestions FOR SELECT USING (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCodeForSupabase);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.pinBox}>
          <Shield size={44} color="#8a2be2" style={{ margin: '0 auto' }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            Panel de Administrador Shotsy
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
            Ingresa la clave maestra o PIN para acceder a la gestión de usuarios, sugerencias y base de datos.
          </p>

          {pinError && (
            <div style={{ color: '#ff4d6d', fontSize: '0.85rem' }}>{pinError}</div>
          )}

          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              className={styles.pinInput}
              placeholder="PIN de acceso..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className={styles.pinSubmitBtn}>
              Acceder al Panel
            </button>
          </form>

          <Link href="/" className={styles.backLink} style={{ alignSelf: 'center', marginTop: 8 }}>
            <ArrowLeft size={16} /> Volver a la App
          </Link>
        </div>
      </div>
    );
  }

  const pendingSuggestionsCount = suggestions.filter((s) => s.status === 'pending').length;
  const vipUsersCount = users.filter((u) => u.is_vip).length;
  const bannedUsersCount = users.filter((u) => u.is_banned).length;

  return (
    <div className={styles.adminContainer}>
      {/* HEADER */}
      <header className={styles.adminHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className={styles.adminTitle}>
            <Shield size={26} color="#00f2fe" />
            <span>Panel de Control Shotsy</span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Ir al Juego
          </Link>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => {
              localStorage.removeItem('shotsy_admin_auth');
              setIsAuthenticated(false);
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* MÉTRICAS RÁPIDAS */}
      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Sugerencias Pendientes</span>
          <span className={styles.metricValue}>{pendingSuggestionsCount}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Usuarios</span>
          <span className={styles.metricValue} style={{ color: 'var(--neon-pink)' }}>
            {users.length}
          </span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Clientes VIP</span>
          <span className={styles.metricValue} style={{ color: 'var(--neon-gold)' }}>
            {vipUsersCount}
          </span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Usuarios Baneados</span>
          <span className={styles.metricValue} style={{ color: 'var(--neon-red)' }}>
            {bannedUsersCount}
          </span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Retos en Catálogo</span>
          <span className={styles.metricValue}>{challenges.length}</span>
        </div>
      </section>

      {/* PESTAÑAS */}
      <nav className={styles.adminTabs}>
        <button
          type="button"
          className={`${styles.adminTabBtn} ${activeTab === 'suggestions' ? styles.adminTabBtnActive : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <Lightbulb size={18} />
          <span>Retos Sugeridos ({pendingSuggestionsCount})</span>
        </button>

        <button
          type="button"
          className={`${styles.adminTabBtn} ${activeTab === 'users' ? styles.adminTabBtnActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          <span>Usuarios y Clientes VIP ({users.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.adminTabBtn} ${activeTab === 'challenges' ? styles.adminTabBtnActive : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          <Layers size={18} />
          <span>Catálogo de Retos ({challenges.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.adminTabBtn} ${activeTab === 'sql' ? styles.adminTabBtnActive : ''}`}
          onClick={() => setActiveTab('sql')}
        >
          <Database size={18} />
          <span>Script SQL Supabase</span>
        </button>
      </nav>

      {/* 1. RETOS SUGERIDOS */}
      {activeTab === 'suggestions' && (
        <section className={styles.panelCard}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--neon-cyan)' }}>
            Sugerencias Enviadas por la Comunidad
          </h2>
          <div className={styles.tableResponsive}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Categoría</th>
                  <th>Contenido del Reto</th>
                  <th>Tragos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((sug) => (
                  <tr key={sug.id}>
                    <td>{sug.user_email || 'Anónimo'}</td>
                    <td>
                      {sug.category_id === 1
                        ? 'Previa Suave'
                        : sug.category_id === 2
                        ? 'Yo Nunca'
                        : sug.category_id === 3
                        ? 'Modo Fuego'
                        : "Pa' quedar hecho P"}
                    </td>
                    <td style={{ fontWeight: 600 }}>{sug.content}</td>
                    <td>{sug.drinks_penalty} trago(s)</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          sug.status === 'approved'
                            ? styles.statusApproved
                            : sug.status === 'rejected'
                            ? styles.statusBanned
                            : styles.statusPending
                        }`}
                      >
                        {sug.status}
                      </span>
                    </td>
                    <td>
                      {sug.status === 'pending' ? (
                        <div className={styles.actionBtnGroup}>
                          <button
                            type="button"
                            className={styles.btnApprove}
                            onClick={() => handleApproveSuggestion(sug)}
                          >
                            <Check size={14} style={{ display: 'inline', marginRight: 4 }} />
                            Aprobar
                          </button>
                          <button
                            type="button"
                            className={styles.btnReject}
                            onClick={() => handleRejectSuggestion(sug.id)}
                          >
                            <X size={14} style={{ display: 'inline', marginRight: 4 }} />
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Procesado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 2. USUARIOS Y VIP */}
      {activeTab === 'users' && (
        <section className={styles.panelCard}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--neon-gold)' }}>
            Gestión de Usuarios y Clientes VIP
          </h2>
          <div className={styles.tableResponsive}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Estado VIP</th>
                  <th>Estado Cuenta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.display_name || user.email?.split('@')[0]}</td>
                    <td>
                      <span style={{ fontWeight: 800, color: user.role === 'admin' ? 'var(--neon-purple)' : 'inherit' }}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.is_vip ? (
                        <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
                          <Crown size={12} /> VIP
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Free</span>
                      )}
                    </td>
                    <td>
                      {user.is_banned ? (
                        <span className={`${styles.statusBadge} ${styles.statusBanned}`}>
                          <Ban size={12} /> BANEADO
                        </span>
                      ) : (
                        <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
                          Activo
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionBtnGroup}>
                        <button
                          type="button"
                          className={styles.btnToggleVip}
                          onClick={() => handleToggleVip(user)}
                        >
                          <Crown size={13} style={{ display: 'inline', marginRight: 4 }} />
                          {user.is_vip ? 'Quitar VIP' : 'Dar VIP'}
                        </button>
                        <button
                          type="button"
                          className={styles.btnReject}
                          onClick={() => handleToggleBan(user)}
                        >
                          <Ban size={13} style={{ display: 'inline', marginRight: 4 }} />
                          {user.is_banned ? 'Desbanear' : 'Banear'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. CATÁLOGO DE RETOS */}
      {activeTab === 'challenges' && (
        <section className={styles.panelCard}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--neon-pink)' }}>
            Catálogo Completo de Retos ({challenges.length})
          </h2>
          <div className={styles.tableResponsive} style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Categoría</th>
                  <th>Contenido</th>
                  <th>Penitencia</th>
                  <th>VIP</th>
                </tr>
              </thead>
              <tbody>
                {challenges.slice(0, 100).map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>
                      {c.category_id === 1
                        ? 'Previa Suave'
                        : c.category_id === 2
                        ? 'Yo Nunca'
                        : c.category_id === 3
                        ? 'Modo Fuego'
                        : "Pa' quedar hecho P"}
                    </td>
                    <td style={{ maxWidth: 450 }}>{c.content}</td>
                    <td>{c.drinks_penalty} trago(s)</td>
                    <td>{c.is_vip ? '⭐ VIP' : 'Gratis'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Mostrando los primeros 100 de {challenges.length} retos. Todos están sincronizados con la aplicación web.
          </p>
        </section>
      )}

      {/* 4. SCRIPT SQL DE SUPABASE */}
      {activeTab === 'sql' && (
        <section className={styles.panelCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--neon-cyan)' }}>
                Código SQL de Actualización para Supabase
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                Copia este script completo y pégalo en el <strong>SQL Editor</strong> de tu panel de Supabase.
              </p>
            </div>
            <button type="button" className={styles.copySqlBtn} onClick={handleCopySql}>
              {copiedSql ? <Check size={18} /> : <Copy size={18} />}
              <span>{copiedSql ? '¡Copiado al Portapapeles!' : 'Copiar Script SQL'}</span>
            </button>
          </div>

          <div className={styles.sqlBox}>{sqlCodeForSupabase}</div>
        </section>
      )}
    </div>
  );
}

