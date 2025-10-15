import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./Dashboard.css";

function Dashboard() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      setUser(session.user);
      fetchWorkspaces(session.user.id);
    }

    checkUser();
  }, []);

  async function fetchWorkspaces(userId) {
    try {
      setLoading(true);

      // Fetch workspaces for the current user
      const { data, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setWorkspaces(data || []);
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      window.location.href = "/login";
    }
  }

  async function handleDeleteWorkspace(id) {
    if (!window.confirm("Are you sure you want to delete this workspace?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Remove from local state
      setWorkspaces(workspaces.filter(w => w.id !== id));
    } catch (err) {
      console.error("Error deleting workspace:", err);
      alert(`Failed to delete: ${err.message}`);
    }
  }

  if (loading) return <div className="container"><p>Loading workspaces...</p></div>;
  if (error) return <div className="container"><p style={{ color: "red" }}>Error: {error}</p></div>;

  return (
    <div className="container">
      <div className="header">
        <h2 className="heading">📸 Your Workspaces</h2>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      {workspaces.length === 0 ? (
        <div className="empty-state">
          <p>No workspaces found.</p>
          <p className="subtitle">Install the browser extension and capture your first workspace!</p>
        </div>
      ) : (
        <div className="grid">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="card">
              <h3>{workspace.name || "Untitled Workspace"}</h3>
              <p className="description">{workspace.description || "No description"}</p>
              <div className="card-meta">
                <small>Created: {new Date(workspace.created_at).toLocaleDateString()}</small>
                {workspace.last_accessed_at && (
                  <small>Last accessed: {new Date(workspace.last_accessed_at).toLocaleDateString()}</small>
                )}
              </div>
              <div className="card-actions">
                <button className="btn-primary">Open</button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteWorkspace(workspace.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;