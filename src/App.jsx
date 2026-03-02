import { useEffect, useState } from "react";
import Auth from "./Auth";
import TaskManager from "./TaskManager";
import { supabase } from "./supabase-client";
import { LogOut, Loader } from "lucide-react";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => { 
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error fetching session:", error);
          setError(error.message);
        } else if (data?.session) {
          setUser(data.session.user);
          console.log("✓ User logged in:", data.session.user.email);
        } else {
          setUser(null);
          console.log("No active session");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to check authentication status");
      } finally {
        setLoading(false); 
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          console.log("✓ Auth state changed - User logged in:", session.user.email);
        } else {
          setUser(null);
          console.log("Auth state changed - User logged out");
        }
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        setError("Failed to logout. Please try again.");
      } else {
        setUser(null);
        setError(null);
        console.log("✓ User logged out successfully");
      }
    } catch (err) {
      console.error("Unexpected logout error:", err);
      setError("An unexpected error occurred during logout");
    } finally {
      setLoggingOut(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing your workspace...</p>
        </div>
      </div>
    );
  }

  // Error state (only show if no user and there's an error)
  if (error && !user) {
    return (
      <div className="app-error">
        <div className="error-container">
          <h2>⚠️ Authentication Error</h2>
          <p>{error}</p>
          <button 
            className="error-retry-btn"
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Authenticated user - show TaskManager with header
  if (user) {
    return (
      <div className="app-wrapper authenticated">
        {/* Premium Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="app-title">
                <span className="title-emoji">✓</span>
                Task Manager
              </h1>
            </div>

            <div className="header-right">
              <div className="user-info">
                <div className="user-avatar">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <p className="user-email">{user.email}</p>
                  <p className="user-status">Active</p>
                </div>
              </div>

              <button
                className="logout-btn"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign out of your account"
              >
                {loggingOut ? (
                  <>
                    <Loader size={18} className="spinner" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Error notification */}
        {error && (
          <div className="error-notification">
            <div className="error-notification-content">
              <span>{error}</span>
              <button 
                className="error-close"
                onClick={() => setError(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="app-main">
          <TaskManager user={user} />
        </main>
      </div>
    );
  } 

  // Not authenticated - show Auth component
  return (
    <div className="app-wrapper auth-mode">
      <Auth />
    </div>
  );
}

export default App;