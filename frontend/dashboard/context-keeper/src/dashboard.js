import React, { useState, useEffect } from "react";

function Dashboard() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token"); // or however you store it

  async function fetchSnapshots() {
    try {
      const response = await fetch("http://localhost:3000/snapshots", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`HTTP ${response.status}: ${message}`);
      }

      const data = await response.json();
      setSnapshots(data);
    } catch (error) {
      console.error("ERROR", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSnapshots();
  }, []);

  if (loading) return <p>Loading snapshots...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📸 Snapshots</h2>

      {snapshots.length === 0 ? (
        <p>No snapshots found.</p>
      ) : (
        <div style={styles.grid}>
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} style={styles.card}>
              <h3>{snapshot.title || "Untitled Snapshot"}</h3>
              <p><strong>ID:</strong> {snapshot.id}</p>
              <p><strong>Created at:</strong> {new Date(snapshot.created_at).toLocaleString()}</p>
              {snapshot.description && <p>{snapshot.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "system-ui, sans-serif",
  },
  heading: {
    marginBottom: "1.5rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1rem",
  },
  card: {
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
  },
};

export default Dashboard;
