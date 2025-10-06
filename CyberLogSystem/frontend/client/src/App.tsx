/**
 * CyberLogSystem - Main Application Component
 * 
 * This is the root component of the CyberLogSystem application, a comprehensive
 * cybersecurity monitoring and intrusion prevention platform. It manages:
 * 
 * - User authentication and authorization (JWT-based)
 * - Route protection and navigation
 * - Global state management (user session, theme)
 * - Real-time notifications and alerts
 * - Theme switching (light/dark/system)
 * 
 * The application supports two user roles:
 * - Regular Users: Personal security dashboard, activity monitoring
 * - Administrators: System-wide monitoring, user management, threat analysis
 */

// Import React hooks and state management
import { useState } from "react";

// Import UI components for notifications and tooltips
import { Toaster } from "@/components/ui/toaster"; // Main toast notification system for user feedback
import { Toaster as Sonner } from "@/components/ui/sonner"; // Alternative toast system for different notification types
import { TooltipProvider } from "@/components/ui/tooltip"; // Tooltip context provider for enhanced UX

// Import React Query for server state management and caching
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import React Router components for client-side navigation
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

// Import custom components
import { Navbar } from "@/components/navigation/navbar"; // Main navigation bar with user menu and theme toggle

// Import page components for different application views
import Login from "./pages/Login"; // User authentication page with security features
import Signup from "./pages/Signup"; // User registration page with admin secret mechanism
import UserDashboard from "./pages/UserDashboard"; // Personal security dashboard for regular users
import AdminDashboard from "./pages/AdminDashboard"; // System-wide security monitoring for administrators
import Profile from "./pages/Profile"; // User profile management and security settings
import Settings from "./pages/Settings"; // Application settings and preferences
import Reports from "./pages/Reports"; // Security reports and PDF generation
import NotFound from "./pages/NotFound"; // 404 error page for invalid routes

// Import configuration and context providers
import { API_BASE_URL, SecureTokenStorage } from "./utils/api"; // Backend API base URL configuration and secure storage
import { ThemeProvider } from "@/context/ThemeContext"; // Theme management context (light/dark/system)


// Create React Query client for managing server state, caching, and synchronization
// This handles all API calls, caching responses, and managing loading states
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache data for 10 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    },
  },
});

/**
 * User Interface Definition
 * Defines the structure of user data throughout the application
 * Used for type safety and consistent data handling
 */
interface User {
  email: string; // User's email address (unique identifier for authentication)
  name: string; // User's display name (shown in UI components)
  role: "admin" | "user"; // User's role determining access permissions and available features
  profilePicture?: string; // User's profile picture (base64 string)
}

/**
 * AppContent Component - Main application content with routing
 * 
 * This component handles the main application routing and navigation logic.
 * It's separated from the main App component to use React Router hooks.
 * 
 * Features:
 * - Protected routes based on authentication status
 * - Role-based dashboard routing (admin vs user)
 * - Navigation handlers for different pages
 * - Conditional navbar rendering
 * 
 * @param user - Current authenticated user or null
 * @param onLogout - Function to handle user logout
 * @param onLogin - Function to handle user login
 * @param onSignup - Function to handle user registration
 */
function AppContent({
  user,
  onLogout,
  onLogin,
  onSignup,
}: {
  user: User | null; // Current user state (null if not authenticated)
  onLogout: () => void; // Logout handler that clears user session
  onLogin: (email: string, role: "admin" | "user") => void; // Login handler that sets user session
  onSignup: (email: string, name: string, role?: 'admin' | 'user') => void; // Signup handler for new user registration
}) {
  const navigate = useNavigate(); // React Router navigation hook

  /**
   * Navigation handlers for different application pages
   * These functions provide programmatic navigation from the navbar
   */
  const handleNavigateToProfile = () => {
    navigate("/profile"); // Navigate to user profile page
  };

  const handleNavigateToSettings = () => {
    navigate("/settings"); // Navigate to application settings page
  };

  const handleNavigateToReports = () => {
    navigate("/reports"); // Navigate to reports page
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 
        Main application container with full viewport height
        Uses CSS custom properties for theme-aware background colors
      */}

      {/* 
        Conditional Navigation Bar
        Only shown when user is authenticated to prevent access to navigation
        before login. Includes theme toggle, report downloads, and user menu.
      */}
      {user && (
        <Navbar
          userRole={user.role} // User role determines available menu options and report types
          userName={user.name} // Display name shown in user menu
          userProfilePicture={user.profilePicture} // User profile picture
          onLogout={onLogout} // Logout handler that clears session and redirects
          onNavigateToProfile={handleNavigateToProfile} // Profile page navigation
          onNavigateToSettings={handleNavigateToSettings} // Settings page navigation
          onNavigateToReports={handleNavigateToReports} // Reports page navigation
        />
      )}
      {/* 
        Application Routes Configuration
        Defines all possible navigation paths and their corresponding components.
        Includes route protection based on authentication status and user roles.
      */}
      <Routes>
        {/* 
          Authentication Routes - Only accessible when not logged in
          Automatically redirect authenticated users to dashboard
        */}
        <Route
          path="/login"
          element={
            !user ? (
              <Login onLogin={onLogin} /> // Login form with security features and intrusion detection
            ) : (
              <Navigate to="/dashboard" replace /> // Redirect authenticated users
            )
          }
        />

        <Route
          path="/signup"
          element={
            !user ? (
              <Signup onSignup={onSignup} /> // Registration form with admin secret mechanism
            ) : (
              <Navigate to="/dashboard" replace /> // Redirect authenticated users
            )
          }
        />

        {/* 
          Dashboard Route - Role-based dashboard rendering
          Shows different dashboards based on user role with real-time data
        */}
        <Route
          path="/dashboard"
          element={
            user ? (
              // Role-based dashboard selection
              user.role === "admin" ? (
                <AdminDashboard /> // System-wide security monitoring, user management, threat analysis
              ) : (
                <UserDashboard userName={user.name} userEmail={user.email} /> // Personal security dashboard with activity monitoring
              )
            ) : (
              <Navigate to="/login" /> // Redirect unauthenticated users to login
            )
          }
        />

        {/* 
          Protected Routes - Only accessible when authenticated
          Automatically redirect unauthenticated users to login
        */}
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />} // User profile management and security settings
        />

        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" />} // Application settings and preferences
        />

        <Route
          path="/reports"
          element={user ? <Reports userRole={user.role} /> : <Navigate to="/login" />} // Security reports and PDF generation
        />

        {/* 
          Root Route - Smart redirection based on authentication status
          Authenticated users go to dashboard, others go to login
        */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" /> // Send authenticated users to their dashboard
            ) : (
              <Navigate to="/login" replace /> // Send unauthenticated users to login
            )
          }
        />

        {/* 
          Catch-all Route - 404 error handling
          Handles any undefined routes with a user-friendly error page
        */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

/**
 * Main App Component - Root application component
 * 
 * This is the main component that orchestrates the entire CyberLogSystem application.
 * It manages global state, authentication, and provides context to all child components.
 * 
 * Key Responsibilities:
 * - User authentication state management
 * - Session persistence across browser refreshes
 * - Global context providers (Theme, Query Client, Tooltips)
 * - Toast notification systems
 * - Router configuration
 * 
 * The component uses localStorage to persist user sessions and automatically
 * restores authentication state when the application loads.
 */
const App = () => {
  /**
   * User Authentication State
   * Manages the currently authenticated user with persistent storage.
   * Initializes from localStorage to maintain sessions across browser refreshes.
   */
  const [user, setUser] = useState<User | null>(() => {
    // Attempt to restore user session from secure storage
    try {
      const storedUser = SecureTokenStorage.getUser();
      const storedToken = SecureTokenStorage.getToken();

      // Validate stored session data
      if (storedUser && storedToken) {
        // User found in secure storage
        return storedUser;
      }
    } catch (error) {
      console.warn('Error loading from secure storage:', error);
      // Fallback to localStorage for backward compatibility
      const storedUser = localStorage.getItem("auth_user");
      const storedToken = localStorage.getItem("auth_token");
      if (storedUser && storedToken) {
        try {
          return JSON.parse(storedUser);
        } catch {
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_token");
        }
      }
    }
    return null; // No valid session found
  });

  /**
   * Handle User Login
   * Called when user successfully authenticates through the login form.
   * Creates user session using httpOnly cookies as primary method.
   * 
   * @param email - User's email address
   * @param role - User's role (admin or user)
   */
  const handleLogin = async (email: string, role: "admin" | "user", token?: string, rememberMe: boolean = false) => {
    // Generate display name from email (simple extraction before @ symbol)
    const name = email.split("@")[0].replace(/\./g, " "); // Replace dots with spaces for better readability
    
    // Create user object
    const userData = { email, name, role };
    
    // Update application state
    setUser(userData);
    
    // HttpOnly cookies are set by server, just store user data in memory
    try {
      if (token) {
        await SecureTokenStorage.setToken(token, userData, {
          persistent: rememberMe,
          useCookies: true,
          useMemoryOnly: false
        });
      }
    } catch (error) {
      console.warn('Error with secure storage:', error);
    }
    
    // Log successful login for debugging
    console.log("User logged in successfully (httpOnly cookies):", { email, name, role });
  };

  /**
   * Handle User Signup
   * Called when user successfully registers through the signup form.
   * Creates new user session using httpOnly cookies.
   * 
   * @param email - User's email address
   * @param name - User's chosen display name
   * @param role - User's role (determined server-side)
   */
  const handleSignup = async (email: string, name: string, role: "admin" | "user" = "user", token?: string) => {
    // Create new user with role from server response
    const userData = { email, name, role };
    
    // Update application state
    setUser(userData);
    
    // Use secure token storage with httpOnly cookies
    try {
      if (token) {
        await SecureTokenStorage.setToken(token, userData, {
          persistent: false,      // Don't persist signup tokens by default
          useCookies: true,       // Use httpOnly cookies
          useMemoryOnly: false    // Allow fallback storage methods
        });
      }
    } catch (error) {
      console.warn('Error with secure storage, falling back to localStorage:', error);
      if (token) localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(userData));
    }
    
    // Log successful signup for debugging
    console.log("User signed up successfully (httpOnly cookies):", userData);
  };

  /**
   * Handle User Logout
   * Clears user session from both application state and all storage methods including httpOnly cookies.
   * Effectively logs the user out and redirects to login page.
   */
  const handleLogout = async () => {
    // Clear user from application state
    setUser(null);
    
    // Clear all secure storage including httpOnly cookies
    try {
      await SecureTokenStorage.clearAll(); // Clear all secure storage methods including cookies
    } catch (error) {
      console.warn('Error clearing secure storage, falling back to manual cleanup:', error);
      // Fallback cleanup
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_user");
    }
    
    // Log logout for debugging
    console.log("User logged out successfully (httpOnly cookies cleared)");
  };

  /**
   * Main Application Render
   * Sets up all global providers and context for the application.
   * The order of providers is important for proper functionality.
   */
  return (
    <ThemeProvider>
      {/* Theme management context - handles light/dark/system theme switching */}
      
      <QueryClientProvider client={queryClient}>
        {/* React Query client - manages server state, caching, and API calls */}
        
        <TooltipProvider>
          {/* Tooltip context - enables tooltips throughout the application */}
          
          {/* Toast Notification Systems */}
          <Toaster /> {/* Primary toast system for user feedback */}
          <Sonner /> {/* Secondary toast system for different notification types */}

          {/* Client-side Router */}
          <BrowserRouter>
            {/* 
              React Router - enables client-side navigation without page refreshes
              Handles all routing logic and URL management
            */}
            
            <AppContent
              user={user} // Current user state
              onLogout={handleLogout} // Logout handler
              onLogin={handleLogin} // Login handler
              onSignup={handleSignup} // Signup handler
            />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

// Export the App component as the default export
// This is the entry point for the entire CyberLogSystem application
export default App;
