import './App.css';

import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from "react";

import Alert from './components/Alert';

function App() {

  // ── State ──────────────────────────────────────────────
  const [jwtToken, setJwtToken]       = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertClassName, setAlertClassName] = useState("d-none");
  const [isLoading, setIsLoading]     = useState(true);

  // ── Refs ───────────────────────────────────────────────
  const tickIntervalRef = useRef(null);

  // ── Routing ────────────────────────────────────────────
  const navigate = useNavigate();

  // ── Auth Handlers ──────────────────────────────────────
  const logOut = () => {
      fetch(`${process.env.REACT_APP_BACKEND}/logout`, { method: "GET", credentials: "include" })
          .catch((error) => console.log("error logging out", error))
          .finally(() => {
              setJwtToken("");
              toggleRefresh(false);
              navigate("/login");
          });
  };

  const toggleRefresh = useCallback((status) => {
      if (status) {
          tickIntervalRef.current = setInterval(() => {
              fetch(`${process.env.REACT_APP_BACKEND}/refresh`, { method: "GET", credentials: "include" })
                  .then((response) => {
                      if (response.status === 401) return;
                      return response.json();
                  })
                  .then((data) => {
                      if (data && data.access_token) {
                          setJwtToken(data.access_token);
                      }
                  })
                  .catch((error) => console.log("user is not logged in", error));
          }, 600000); // refresh every 10 minutes
      } else {
          clearInterval(tickIntervalRef.current);
          tickIntervalRef.current = null;
      }
  }, []);

  // ── Effects ────────────────────────────────────────────
  useEffect(() => {
      if (jwtToken === "") {
          fetch(`${process.env.REACT_APP_BACKEND}/refresh`, { method: "GET", credentials: "include" })
              .then((response) => {
                  if (response.status === 401) return;
                  return response.json();
              })
              .then((data) => {
                  if (data && data.access_token) {
                      setJwtToken(data.access_token);
                      toggleRefresh(true);
                  }
              })
              .catch((error) => console.log("user is not logged in", error))
              .finally(() => setIsLoading(false));
      } else {
          setIsLoading(false);
      }
  }, [jwtToken, toggleRefresh]);

  // ── Render ─────────────────────────────────────────────
  if (isLoading) {
      return <div className="container mt-5 text-center">Loading...</div>;
  }

  return (
      <div className="container">
          <div className="row">
              <div className="col">
                  <h1>Go watch a movie!</h1>
              </div>
              <div className="col text-end">
                  {jwtToken === "" ? (
                      <Link to="/login">
                          <span className="badge bg-success">Login</span>
                      </Link>
                  ) : (
                      <a href="#!" onClick={logOut}>
                          <span className="badge bg-danger">Log Out</span>
                      </a>
                  )}
              </div>
              <hr className="mb-3" />
          </div>

          <div className="row">
              <div className="col-md-2">
                  <nav>
                      <div className="list-group">
                          <Link to="/" className="list-group-item list-group-item-action">Home</Link>
                          <Link to="/movies" className="list-group-item list-group-item-action">Movies</Link>
                          <Link to="/genres" className="list-group-item list-group-item-action">Genres</Link>

                          {/* Admin only links */}
                          {jwtToken !== "" && (
                              <>
                                  <Link to="/admin/movie/0" className="list-group-item list-group-item-action">Add Movie</Link>
                                  <Link to="/manage-catalogue" className="list-group-item list-group-item-action">Manage Catalogue</Link>
                                  <Link to="/graphql" className="list-group-item list-group-item-action">GraphQL</Link>
                              </>
                          )}
                      </div>
                  </nav>
              </div>

              <div className="col-md-10">
                  <Alert
                      message={alertMessage}
                      className={alertClassName}
                  />
                  <Outlet
                      context={{
                          jwtToken,
                          setJwtToken,
                          setAlertClassName,
                          setAlertMessage,
                          toggleRefresh,
                          isLoading,
                      }}
                  />
              </div>
          </div>
      </div>
  );
}

export default App;
