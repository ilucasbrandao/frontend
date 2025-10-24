import { useAuth } from '../context/AuthContext';
import { Link, NavLink } from 'react-router-dom';

export const Layout = ({ children }) => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        // (Opcional: desabilitar o botão enquanto desloga, mas é tão rápido)
        await logout();
        // O 'AuthProvider' vai atualizar o estado, e os 'ProtectedRoutes'
        // vão redirecionar para /login automaticamente.
    };

    const navLinkClass = ({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium ${isActive
            ? 'bg-gray-900 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Barra de Navegação Principal */}
            <nav className="bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo e Links */}
                        <div className="flex items-center">
                            <div className="shrink-0">
                                <span className="font-bold text-xl text-white">ERP {user?.schema}</span>
                            </div>
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <NavLink to="/" className={navLinkClass}>Dashboard</NavLink>
                                    <NavLink to="/customers" className={navLinkClass}>Clientes</NavLink>
                                    {/* !! LINK CONDICIONAL DE ADMIN !! */}
                                    {user && user.role === 'admin' && (
                                        <NavLink to="/admin" className={navLinkClass}>
                                            Admin
                                        </NavLink>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Usuário e Logout */}
                        <div className="flex items-center">
                            <span className="text-gray-400 text-sm mr-4">Olá, {user?.email}</span>
                            <button
                                onClick={handleLogout}
                                className="py-2 px-3 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Conteúdo da Página */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
};