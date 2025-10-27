import { useState } from 'react'; // <-- 1. Importar useState
import { useAuth } from '../context/AuthContext';
import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'; // <-- 2. Importar ícones
import { Transition } from '@headlessui/react'; // <-- Importar Transition para animação do menu

export const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // <-- 3. Estado para o menu

    const handleLogout = async () => {
        await logout();
    };

    const navLinkClass = ({ isActive }) =>
        `block px-3 py-2 rounded-md text-base sm:text-sm font-medium ${ // Ajuste text-base para mobile
        isActive
            ? 'bg-gray-900 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`;

    // Classe específica para links DENTRO do menu mobile (empilhados)
    const mobileNavLinkClass = ({ isActive }) =>
        `block px-3 py-2 rounded-md text-base font-medium ${isActive
            ? 'bg-gray-900 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Barra de Navegação Principal */}
            <nav className="bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo e Links Desktop */}
                        <div className="flex items-center">
                            <div className="shrink-0">
                                {/* SUGESTÃO: Usar nome do App ou Tenant aqui */}
                                <Link to="/" className="font-bold text-xl text-white">
                                    Meu ERP {/* <--- Mudei aqui */}
                                    {/* Ou talvez user?.schemaName se fizer sentido */}
                                </Link>
                            </div>
                            {/* Links Desktop (continuam escondidos no mobile) */}
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <NavLink to="/" className={navLinkClass}>Produtos</NavLink>
                                    <NavLink to="/customers" className={navLinkClass}>Clientes</NavLink>
                                    {user && user.role === 'admin' && (
                                        <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
                                    )}
                                    {/* Adicione outros links desktop aqui */}
                                </div>
                            </div>
                        </div>

                        {/* Direita: Info Usuário / Logout (Desktop) */}
                        <div className="hidden md:flex items-center"> {/* <-- Esconde no mobile */}
                            <span className="text-gray-400 text-sm mr-4 hidden lg:inline">Olá, {user?.email}</span> {/* Esconde email em telas médias */}
                            <button
                                onClick={handleLogout}
                                className="py-2 px-3 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                            >
                                Sair
                            </button>
                        </div>

                        {/* --- 4. Botão Hambúrguer (Mobile) --- */}
                        <div className="-mr-2 flex md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                type="button"
                                className="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                aria-controls="mobile-menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                <span className="sr-only">Abrir menu principal</span>
                                {isMobileMenuOpen ? (
                                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>

                    </div>
                </div>

                {/* --- 5. Menu Mobile --- */}
                <Transition
                    show={isMobileMenuOpen}
                    enter="transition ease-out duration-100 transform"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-75 transform"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <div className="md:hidden" id="mobile-menu">
                        <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                            {/* Links do Menu Mobile */}
                            <NavLink to="/" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</NavLink>
                            <NavLink to="/customers" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Clientes</NavLink>
                            {user && user.role === 'admin' && (
                                <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Admin</NavLink>
                            )}
                            {/* Adicione outros links mobile aqui */}
                        </div>
                        {/* Informações do Usuário no Menu Mobile */}
                        <div className="border-t border-gray-700 pt-4 pb-3">
                            <div className="flex items-center px-5">
                                <div className="ml-3">
                                    {/* <div className="text-base font-medium leading-none text-white">{user?.name}</div> */} {/* Se tivesse nome */}
                                    <div className="text-sm font-medium leading-none text-gray-400">{user?.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1 px-2">
                                <button
                                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                    className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                                >
                                    Sair
                                </button>
                            </div>
                        </div>
                    </div>
                </Transition>
            </nav>

            {/* Conteúdo da Página */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"> {/* Adicionei px-4 base */}
                {children}
            </main>
        </div>
    );
};
