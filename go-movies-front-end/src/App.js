import './App.css';

import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from "react";

import Alert from './components/Alert';

function App() {
  const [jwtToken, setJwtToken] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertClassName, setAlertClassName] = useState("d-none");

  const [tickInterval, setTickInterval] = useState();

  const navigate = useNavigate();

  const logOut = () => {
    const requestOptions = {
      method: "GET",
      credentials: "include"
    }

    fetch(`/logout`, requestOptions).catch(error => {
      console.log("error logging out", error)
    })
    .finally(() => {
      setJwtToken("")
      toggleRefresh(false);
    })
    navigate("/login")
  }

    const toggleRefresh = useCallback((status) => {
      console.log("clicked");

      if (status) {
        console.log("turning on ticking now ...")
        let i = setInterval(() => {
          const requestOptions = {
            method: "GET",
            credentials: "include",
          };
          fetch("/refresh", requestOptions)
              .then((response) => {
                if (response.status === 401) return;
                return response.json();
              })
              .then((data) => {
                  if (data.access_token) {
                      setJwtToken(data.access_token);
                  }
              })
              .catch((error) => {
                  console.log("user is not logged in", error);
              })
        }, 600000); // runs every 10 min.
        setTickInterval(i);
        console.log("turning off tickInterval", tickInterval);
      } else {
        console.log("turning off ticking now ...")
        console.log("turning off tickInterval", tickInterval)
        setTickInterval(null);
        clearInterval(tickInterval);
      }
    }, [tickInterval])

    useEffect(() => {
      if (jwtToken === "") {
        const requestOptions = {
            method: "GET",
            credentials: "include",
        };

        fetch("/refresh", requestOptions)
            .then((response) => {
              if (response.status === 401) return;
              return response.json();
            })
            .then((data) => {
                if (data.access_token) {
                    setJwtToken(data.access_token);
                    toggleRefresh(true);
                }
            })
            .catch((error) => {
                console.log("user is not logged in", error);
            })
      }
    }, [jwtToken, toggleRefresh, navigate])


    useEffect(() => {
      return () => {
        if (tickInterval) clearInterval(tickInterval);
      };
    }, [tickInterval]);

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
              <span className='badge bg-danger'>Log Out</span>
            </a>
          )}
        </div>
        <hr className="mb-3"></hr>
      </div>
      <div className="row">
        <div className="col-md-2">
          <nav>
            <div className="list-group">
              <Link to="/" className="list-group-item list-group-item-action">Home</Link>
              <Link to="/movies" className="list-group-item list-group-item-action">Movies</Link>
              <Link to="/genres" className="list-group-item list-group-item-action">Genres</Link>
              
              {/* admin mode */}
              {jwtToken !== "" &&
              <>
              <Link to="/admin/movie/0" className="list-group-item list-group-item-action">Add Movie</Link>
              <Link to="/manage-catalogue" className="list-group-item list-group-item-action">Manage Catalogue</Link>
              <Link to="/graphql" className="list-group-item list-group-item-action">GraphQL</Link>
              </>
              }
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
          }}/>
        </div>
      </div>
    </div>
  );
}

export default App;
