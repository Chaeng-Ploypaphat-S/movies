import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import Ticket from './../images/movie_ticket.png';

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185";

const Home = () => {
    const [movies, setMovies] = useState([]);

    // ── Data Fetching ──────────────────────────────────────
    useEffect(() => {
        fetch(`/movies`, {
            method: "GET",
            headers: new Headers({ "Content-Type": "application/json" }),
        })
            .then((res) => res.json())
            .then((data) => setMovies(data))
            .catch((err) => console.log("failed to fetch movies:", err));
    }, []);

    // ── Render ─────────────────────────────────────────────
    return (
        <div className="text-center">
            <h2>Find a movie to watch tonight!</h2>
            <hr />

            {movies.length === 0 ? (
                // fallback ticket image while loading or if no movies
                <Link to="/movies">
                    <img
                        src={Ticket}
                        alt="movie ticket"
                        style={{ borderRadius: "20px" }}
                    />
                </Link>
            ) : (
                <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3 mt-2">
                    {movies.map((m) => (
                        <div className="col" key={m.id}>
                            <Link to={`/movies/${m.id}`} style={{ textDecoration: "none" }}>
                                <div style={{
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                    backgroundColor: "var(--bg-card)",
                                    height: "100%",
                                }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                                    }}
                                >
                                    {/* Poster */}
                                    {m.image ? (
                                        <img
                                            src={`${TMDB_IMAGE_BASE}${m.image}`}
                                            alt={m.title}
                                            style={{ width: "100%", display: "block" }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: "100%",
                                            paddingTop: "150%",
                                            backgroundColor: "var(--bg-secondary)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            position: "relative",
                                        }}>
                                            <span style={{
                                                position: "absolute",
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -50%)",
                                                color: "var(--text-muted)",
                                                fontSize: "0.75rem",
                                            }}>
                                                No Image
                                            </span>
                                        </div>
                                    )}

                                    {/* Title & details */}
                                    <div style={{ padding: "0.6rem 0.7rem" }}>
                                        <div style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            fontSize: "1rem",
                                            color: "var(--text-primary)",
                                            letterSpacing: "0.03em",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}>
                                            {m.title}
                                        </div>
                                        <div style={{
                                            fontSize: "0.75rem",
                                            color: "var(--text-muted)",
                                            marginTop: "0.2rem",
                                        }}>
                                            {new Date(m.release_date).getFullYear()} &middot; {m.mpaa_rating}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;