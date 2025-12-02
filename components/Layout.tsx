
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    DashboardIcon, FolderIcon, LogoutIcon, MenuIcon, ChevronDownIcon, CogIcon,
    ChartBarIcon, DocumentReportIcon, ListIcon, CashIcon, ReceiptTaxIcon,
    BanknotesIcon, DocumentDuplicateIcon, CalendarIcon, ShoppingCartIcon,
    ArchiveBoxIcon, ChartPieIcon, UserGroupIcon, ClipboardDocumentListIcon,
    UsersIcon, ArchiveBoxArrowDownIcon, TrashIcon, UserCircleIcon, GlobeAltIcon,
    DocumentIcon, ShipIcon, TagIcon, CubeIcon, MapIcon, DocumentTextIcon,
    UserIcon
} from './icons';
import logo from '../assets/logo.jpg';

// --- Header Component ---
const Header: React.FC<{ onMenuClick: () => void; }> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getInitials = (name?: string): string => {
        if (!name || name.trim() === '') return '?';
        const names = name.trim().split(/\s+/);
        const firstInitial = names[0].charAt(0);
        const lastInitial = names.length > 1 ? names[names.length - 1].charAt(0) : '';
        return (firstInitial + lastInitial).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-40 px-6 py-3 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300">
            <div className="flex items-center">
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors mr-4 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    title="Basculer le menu"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
                {/* Breadcrumbs or Page Title could go here */}
            </div>

            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="flex items-center space-x-3 group p-1.5 rounded-full hover:bg-slate-100/50 transition-all duration-200 border border-transparent hover:border-slate-200"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm select-none shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                        {getInitials(user?.fullName)}
                    </div>
                    <div className="hidden md:flex flex-col items-start mr-1">
                        <span className="font-semibold text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{user?.fullName || 'Utilisateur'}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user?.role || 'Admin'}</span>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl shadow-slate-200/50 py-2 z-50 border border-white/20 ring-1 ring-black/5 animate-scale-up origin-top-right" role="menu">
                        <div className="px-4 py-3 border-b border-slate-100 mb-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{user?.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                setDropdownOpen(false);
                            }}
                            className="w-full text-left flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                            role="menuitem"
                        >
                            <LogoutIcon className="w-4 h-4" />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};


// --- Sidebar Menu Components ---

interface NavItemProps {
    to: string;
    label: string;
    icon: React.ReactNode;
    isSubItem?: boolean;
    isCollapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon, isSubItem = false, isCollapsed = false }) => {
    const baseClasses = `flex items-center transition-all duration-200 relative group overflow-hidden ${isCollapsed ? 'justify-center' : ''}`;
    const layoutClasses = isSubItem
        ? (isCollapsed ? 'py-2.5 px-2 text-sm rounded-lg mx-2' : 'py-2.5 pl-10 pr-3 text-sm rounded-lg mx-3')
        : (isCollapsed ? 'p-3 text-base rounded-xl mx-2' : 'px-4 py-3 text-sm font-medium rounded-xl mx-3');

    return (
        <NavLink
            to={to}
            className={({ isActive }) => `
                ${baseClasses} ${layoutClasses} 
                ${isActive
                    ? (isSubItem
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20')
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}
            `}
        >
            {({ isActive }) => (
                <>
                    <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} ${isSubItem ? 'scale-90' : ''}`}>
                        {icon}
                    </span>

                    {!isCollapsed && (
                        <span className={`ml-3 flex-grow truncate ${isActive ? 'text-white' : ''}`}>
                            {label}
                        </span>
                    )}

                    {!isCollapsed && isActive && !isSubItem && (
                        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/30 shadow-inner"></div>
                    )}
                </>
            )}
        </NavLink>
    );
};


interface CollapsibleMenuProps {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    paths: string[];
    isSubMenu?: boolean;
    isCollapsed?: boolean;
}

const CollapsibleMenu: React.FC<CollapsibleMenuProps> = ({ label, icon, children, paths, isSubMenu = false, isCollapsed = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isParentActive = paths.some(path => location.pathname.startsWith(path));
    const [isOpen, setIsOpen] = useState(isParentActive);

    useEffect(() => {
        if (isParentActive) setIsOpen(true);
    }, [isParentActive, location.pathname]);

    const buttonBaseClasses = "flex items-center justify-between w-full transition-colors group";
    const buttonLayoutClasses = isSubMenu
        ? 'py-2 pl-3 pr-2 text-sm rounded-md'
        : (isCollapsed ? 'p-3 mx-2 rounded-xl justify-center' : 'px-4 py-3 mx-3 rounded-xl');

    const handleClick = () => {
        // Always toggle the submenu open/close state
        setIsOpen(!isOpen);
    };

    return (
        <li className="mb-1">
            <button
                onClick={handleClick}
                className={`
                    ${buttonBaseClasses} ${buttonLayoutClasses} 
                    ${isParentActive
                        ? 'text-white bg-white/5'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}
                `}
                aria-expanded={isOpen}
                title={isCollapsed ? label : undefined}
            >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <span className={`flex-shrink-0 transition-colors ${isParentActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`}>
                        {icon}
                    </span>
                    {!isCollapsed && <span className={`ml-3 font-medium text-sm ${isParentActive ? 'text-white' : ''}`}>{label}</span>}
                </div>
                {!isCollapsed && (
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isParentActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                )}
            </button>
            {/* Show submenu items when expanded (both in collapsed and normal mode) */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <ul className="mt-1 space-y-1">
                    {children}
                </ul>
            </div>
        </li>
    );
};

// --- Main Sidebar Component ---
const Sidebar: React.FC<{ isOpen: boolean; isCollapsed: boolean; }> = ({ isOpen, isCollapsed }) => {
    const iconSubMenuProps = { className: "w-4 h-4" };

    return (
        <aside className={`
            fixed md:relative inset-y-0 left-0 z-50
            ${isCollapsed ? 'w-20' : 'w-72'} 
            bg-slate-900
            transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 
            transition-all duration-300 ease-in-out 
            flex flex-col
            border-r border-slate-800/50
            shadow-2xl shadow-slate-900/20
        `}>
            {/* Logo Area */}
            <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} shrink-0 bg-slate-900/50 backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 rounded-full"></div>
                        <img src={logo} alt="Smart Fret" className={`${isCollapsed ? 'w-10 h-10' : 'w-9 h-9'} relative object-contain rounded-lg shadow-lg bg-white/5 p-0.5`} />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-lg tracking-tight leading-none">Smart Fret</span>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">Tableau de bord</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <ul className="space-y-1">
                    <div className={`px-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
                        Principal
                    </div>
                    <li><NavItem to="/dashboard" icon={<DashboardIcon />} label="Tableau de bord" isCollapsed={isCollapsed} /></li>

                    <div className={`px-6 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
                        Gestion
                    </div>
                    <CollapsibleMenu label="Dossiers" icon={<FolderIcon />} paths={["/dossiers"]} isCollapsed={isCollapsed}>
                        <li><NavItem to="/dossiers" icon={<ListIcon {...iconSubMenuProps} />} label="Liste des dossiers" isSubItem isCollapsed={isCollapsed} /></li>
                    </CollapsibleMenu>

                    {/* Section Traitement */}
                    <CollapsibleMenu
                        label="Les Etats"
                        icon={<DocumentReportIcon />}
                        paths={[
                            "/traitement/reglements",
                            "/traitement/couts-revient",
                            "/traitement/commissions",
                            "/traitement/declarations",
                            "/traitement/d3",
                            "/traitement/declarations-mensuelles",
                            "/traitement/commandes",
                            "/traitement/couts-revient-anciens",
                            "/traitement/stat-conteneurs-pays-produit",
                            "/traitement/stat-conteneurs-armateur",
                            "/traitement/liste-conteneurs-bl",
                            "/traitement/stat-dossiers-transitaires",
                            "/traitement/archivage",
                            "/traitement/suppression"
                        ]}
                        isCollapsed={isCollapsed}
                    >
                        <li><NavItem to="/traitement/reglements" label="Etat des règlements" icon={<CashIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/couts-revient" label="Etat des coûts de revient" icon={<ReceiptTaxIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/commissions" label="Commissions bancaires" icon={<BanknotesIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/declarations" label="Etat des déclarations" icon={<DocumentTextIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/d3" label="Etat des D3" icon={<DocumentDuplicateIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/declarations-mensuelles" label="Déclarations mensuelles" icon={<CalendarIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/commandes" label="Etat des commandes" icon={<ShoppingCartIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/couts-revient-anciens" label="Coûts de revient - anciens" icon={<ArchiveBoxIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/stat-conteneurs-pays-produit" label="Stat conteneurs pays/produit" icon={<ChartPieIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/stat-conteneurs-armateur" label="Stat conteneurs armateur" icon={<UserGroupIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/liste-conteneurs-bl" label="Liste conteneurs avec BL" icon={<ClipboardDocumentListIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/stat-dossiers-transitaires" label="Stat dossiers transitaires" icon={<UsersIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/archivage" label="Archivage fichiers" icon={<ArchiveBoxArrowDownIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/suppression" label="Suppression dossiers" icon={<TrashIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                    </CollapsibleMenu>

                    <div className={`px-6 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
                        Configuration
                    </div>
                    <CollapsibleMenu
                        label="Paramètres"
                        icon={<CogIcon />}
                        paths={[
                            "/parametres/armateurs",
                            "/parametres/origines",
                            "/parametres/types-dossier",
                            "/parametres/navires",
                            "/parametres/categories-produit",
                            "/parametres/produits",
                            "/parametres/utilisateurs"
                        ]}
                        isCollapsed={isCollapsed}
                    >
                        <li><NavItem to="/parametres/utilisateurs" label="Utilisateurs" icon={<UserIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/parametres/armateurs" label="Armateurs" icon={<UserGroupIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/parametres/origines" label="Origines" icon={<GlobeAltIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/parametres/types-dossier" label="Types de dossiers" icon={<DocumentIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/parametres/navires" label="Navires" icon={<ShipIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/parametres/categories-produit" label="Catégories de produits" icon={<TagIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/parametres/produits" label="Produits" icon={<CubeIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                    </CollapsibleMenu>

                    <CollapsibleMenu
                        label="Statistiques"
                        icon={<ChartBarIcon />}
                        paths={[
                            "/traitement/stat-conteneurs-pays-produit",
                            "/traitement/stat-conteneurs-armateur",
                            "/traitement/liste-conteneurs-bl"
                        ]}
                        isCollapsed={isCollapsed}
                    >
                        <li><NavItem to="/traitement/stat-conteneurs-pays-produit" label="Stat conteneurs pays/produit" icon={<MapIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/stat-conteneurs-armateur" label="Stat conteneurs armateur" icon={<UserGroupIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                        <li><NavItem to="/traitement/liste-conteneurs-bl" label="Liste conteneurs avec BL" icon={<ClipboardDocumentListIcon {...iconSubMenuProps} />} isSubItem isCollapsed={isCollapsed} /></li>
                    </CollapsibleMenu>
                </ul>
            </nav>

            {/* Footer Sidebar */}
            <div className={`p-4 border-t border-slate-800/50 bg-slate-900/50 ${isCollapsed ? 'hidden' : 'block'}`}>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700/50 shadow-inner">
                    <p className="text-xs text-slate-400 text-center">
                        &copy; 2025 Smart Fret<br />
                        <span className="opacity-50">v1.0.0</span>
                    </p>
                </div>
            </div>
        </aside>
    );
};

// --- Main Layout Component ---
const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isFormPage = /^\/dossiers\/(new|[^/]+\/edit)$/.test(location.pathname);
    const [isSidebarOpen, setSidebarOpen] = useState(!isFormPage && window.innerWidth > 768);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isInitialCheck, setIsInitialCheck] = useState(true);

    // Gestion du chargement initial
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitialCheck(false);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Redirection si non authentifié
    useEffect(() => {
        if (!loading && !isAuthenticated && !isInitialCheck) {
            navigate('/login', {
                state: { from: location.pathname },
                replace: true
            });
        }
    }, [isAuthenticated, loading, navigate, location.pathname, isInitialCheck]);

    // Gestion de la sidebar sur les écrans larges
    useEffect(() => {
        if (isFormPage && window.innerWidth > 768) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isFormPage]);

    // Écran de chargement pendant la vérification de l'authentification
    if (loading || isInitialCheck) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="mt-4 text-center text-slate-500 font-medium text-sm">Chargement...</div>
                </div>
            </div>
        );
    }

    // Ne rien afficher si l'utilisateur n'est pas authentifié (la redirection est gérée par l'effet)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans">
            <Sidebar isOpen={isSidebarOpen} isCollapsed={isCollapsed} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header onMenuClick={() => {
                    if (window.innerWidth > 768) {
                        setIsCollapsed(prev => !prev);
                    } else {
                        setSidebarOpen(prev => !prev);
                    }
                }} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {/* Utilisation d'Outlet pour les routes imbriquées */}
                        {children || <Outlet />}
                    </div>
                </main>
            </div>
            {isSidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden cursor-pointer transition-opacity duration-300"
                    aria-label="Fermer le menu"
                ></div>
            )}
        </div>
    );
};

export default Layout;
