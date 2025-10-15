import React, { useState, useEffect } from "react";
import "./dashboard.css";

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
    <div className="container">
      <h2 className="heading">📸 Snapshots</h2>
  
      {snapshots.length === 0 ? (
        <p>No snapshots found.</p>
      ) : (
        <div className="grid">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="card">
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

export default Dashboard;
