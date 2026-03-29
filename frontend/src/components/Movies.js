import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w92";

const Movies = () => {

    // ── State ──────────────────────────────────────────────
    const [movies, setMovies] = useState([]);

    // ── Data Fetching ──────────────────────────────────────
    useEffect(() => {
        fetch(`${process.env.REACT_APP_BACKEND}/movies`, {
            method: "GET",
            headers: new Headers({ "Content-Type": "application/json" }),
        })
            .then((res) => res.json())
            .then((data) => setMovies(data))
            .catch((err) => console.log(err));
    }, []);

    // ── Render ─────────────────────────────────────────────
    return (
        <div>
            <h2>Movies</h2>
            <hr />
            <table className="table table-striped table-hover align-middle">
                <thead>
                    <tr>
                        <th style={{ width: "50px" }}></th>
                        <th>Movie</th>
                        <th>Release Date</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>
                    {movies.map((m) => (
                        <tr key={m.id}>
                            <td>
                                {m.image ? (
                                    <img
                                        src={`${TMDB_IMAGE_BASE}${m.image}`}
                                        alt={m.title}
                                        style={{
                                            width: "40px",
                                            height: "60px",
                                            objectFit: "cover",
                                            borderRadius: "4px",
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: "40px",
                                        height: "60px",
                                        borderRadius: "4px",
                                        backgroundColor: "var(--bg-secondary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.6rem",
                                        color: "var(--text-muted)",
                                    }}>
                                        N/A
                                    </div>
                                )}
                            </td>
                            <td>
                                <Link to={`/movies/${m.id}`}>
                                    {m.title}
                                </Link>
                            </td>
                            <td>{new Date(m.release_date).toLocaleDateString()}</td>
                            <td>{m.mpaa_rating}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Movies;