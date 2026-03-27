import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import Checkbox from "./form/Checkbox";
import Input from "./form/Input";
import Select from "./form/Select";
import Swal from "sweetalert2";
import TextArea from "./form/TextArea";

const EditMovie = () => {
    const navigate = useNavigate();
    const { jwtToken } = useOutletContext();

    const [errors, setErrors] = useState([]);

    const mpaaOptions = [
        { id: "G",    value: "G" },
        { id: "PG",   value: "PG" },
        { id: "PG13", value: "PG13" },
        { id: "R",    value: "R" },
        { id: "NC17", value: "NC17" },
        { id: "18A",  value: "18A" },
    ];

    const hasError = (key) => errors.indexOf(key) !== -1;

    const [movie, setMovie] = useState({
        id: 0,
        title: "",
        release_date: "",
        runtime: "",
        mpaa_rating: "",
        description: "",
        genres: [],
        genres_array: [],
    });

    let { id } = useParams();
    if (id === undefined) {
        id = 0;
    }

    useEffect(() => {
        if (jwtToken === "") {
            navigate("/login");
            return;
        }

        if (id === 0) {
            setMovie({
                id: 0,
                title: "",
                release_date: "",
                runtime: "",
                mpaa_rating: "",
                description: "",
                genres: [],
                genres_array: [],
            });

            const requestOptions = {
                method: "GET",
                headers: new Headers({ "Content-Type": "application/json" }),
            };

            fetch(`/genres`, requestOptions)
                .then((response) => response.json())
                .then((data) => {
                    const checks = data.map((g) => ({
                        id: g.id,
                        checked: false,
                        genre: g.genre,
                    }));
                    setMovie((m) => ({
                        ...m,
                        genres: checks,
                        genres_array: [],
                    }));
                })
                .catch((err) => console.log(err));
        } else {
            const headers = new Headers();
            headers.append("Content-Type", "application/json");
            headers.append("Authorization", "Bearer " + jwtToken);

            const requestOptions = {
                method: "GET",
                headers: headers,
            }

            fetch(`/admin/movie/${id}`, requestOptions)
                .then((response) => {
                    if (response.status !== 200) {
                        setErrors("Invalid response code:" + response.status)
                    }
                    return response.json();
                })
                .then((data) => {
                    // debug
                    console.log("data from backend:", data);

                    if (!data.movie) {
                        console.log("movie is undefined, full response:", data);
                        return;
                    }

                    // fix release date
                    data.movie.release_date = new Date(data.movie.release_date).toISOString().split('T')[0];

                    const checks = [];
                    data.genres.forEach(g => {
                        if (data.movie.genres_array.indexOf(g.id) !== -1) {
                            checks.push({ id: g.id, checked: true, genre: g.genre });
                        } else {
                            checks.push({ id: g.id, checked: false, genre: g.genre });
                        }
                    });

                    console.log("New checks: ", checks);
                    setMovie({
                        ...data.movie,
                        genres: checks
                    })
                })
                .catch(err => {
                    console.log(err);
                })
        }
    }, [id, jwtToken, navigate]);

    const handleSubmit = (event) => {
        event.preventDefault();

        let errors = [];
        const required = [
            { field: movie.title,        name: "title" },
            { field: movie.release_date, name: "release_date" },
            { field: movie.runtime,      name: "runtime" },
            { field: movie.description,  name: "description" },
            { field: movie.mpaa_rating,  name: "mpaa_rating" },
        ];

        required.forEach((obj) => {
            if (obj.field === "") errors.push(obj.name);
        });

        if (movie.genres_array.length === 0) {
            Swal.fire({
                title: "Error!",
                text: "You must choose at least one genre",
                icon: "error",
                confirmButtonText: "OK",
            });
            errors.push("genres");
        }

        setErrors(errors);
        if (errors.length > 0) return false;

        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("Authorization", "Bearer " + jwtToken);

        const method = movie.id > 0 ? "PATCH" : "PUT";

        const requestBody = {
            ...movie,
            release_date: new Date(movie.release_date).toISOString(),
            runtime: parseInt(movie.runtime, 10),
        };

        const requestOptions = {
            body: JSON.stringify(requestBody),
            method: method,
            headers: headers,
            credentials: "include",
        };

        fetch(`/admin/movie/${movie.id}`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    console.log(data.error);
                } else {
                    navigate("/manage-catalogue");
                }
            })
            .catch((err) => console.log(err));
    };

    const handleChange = () => (event) => {
        const { name, value } = event.target;
        setMovie({ ...movie, [name]: value });
    };

    const handleCheck = (event, position) => {
        let tmpArr = movie.genres;
        tmpArr[position].checked = !tmpArr[position].checked;

        let tmpIDs = movie.genres_array;
        if (!event.target.checked) {
            tmpIDs.splice(tmpIDs.indexOf(parseInt(event.target.value, 10)), 1);
        } else {
            tmpIDs.push(parseInt(event.target.value, 10));
        }

        setMovie({ ...movie, genres_array: tmpIDs });
    };

    // split genres into two columns
    if (movie.genres.length === 0) {
        return <div>Error: problem with movie data</div>
    }

    const half = Math.ceil(movie.genres.length / 2);
    const leftGenres  = movie.genres.slice(0, half);
    const rightGenres = movie.genres.slice(half);

    return (
        <div>
            <h2>Add/Edit Movie</h2>
            <hr />
            <form onSubmit={handleSubmit}>
                <input type="hidden" name="id" value={movie.id} id="id" />

                <Input
                    title={"Title"}
                    className={"form-control"}
                    type={"text"}
                    name={"title"}
                    value={movie.title}
                    onChange={handleChange("title")}
                    errorDiv={hasError("title") ? "text-danger" : "d-none"}
                    errorMsg={"Please enter a title"}
                />
                <Input
                    title={"Release Date"}
                    className={"form-control"}
                    type={"date"}
                    name={"release_date"}
                    value={movie.release_date}
                    onChange={handleChange("release_date")}
                    errorDiv={hasError("release_date") ? "text-danger" : "d-none"}
                    errorMsg={"Please enter a release date"}
                />
                <Input
                    title={"Runtime"}
                    className={"form-control"}
                    type={"text"}
                    name={"runtime"}
                    value={movie.runtime}
                    onChange={handleChange("runtime")}
                    errorDiv={hasError("runtime") ? "text-danger" : "d-none"}
                    errorMsg={"Please enter a runtime"}
                />
                <Select
                    title={"MPAA Rating"}
                    name={"mpaa_rating"}
                    value={movie.mpaa_rating}
                    options={mpaaOptions}
                    onChange={handleChange("mpaa_rating")}
                    placeHolder={"Choose..."}
                    errorMsg={"Please choose an MPAA rating"}
                    errorDiv={hasError("mpaa_rating") ? "text-danger" : "d-none"}
                />
                <TextArea
                    title="Description"
                    name={"description"}
                    value={movie.description}
                    rows={"3"}
                    onChange={handleChange("description")}
                    errorMsg={"Please enter a description"}
                    errorDiv={hasError("description") ? "text-danger" : "d-none"}
                />

                <hr />
                <h3>Genres</h3>
                <hr />

                {movie.genres && movie.genres.length > 0 && (
                    <div className="row">
                        <div className="col-md-6">
                            {leftGenres.map((g, index) => (
                                <Checkbox
                                    title={g.genre}
                                    name={"genre"}
                                    key={index}
                                    id={"genre-" + index}
                                    onChange={(event) => handleCheck(event, index)}
                                    value={g.id}
                                    checked={movie.genres[index].checked}
                                />
                            ))}
                        </div>
                        <div className="col-md-6">
                            {rightGenres.map((g, index) => {
                                const realIndex = index + half;
                                return (
                                    <Checkbox
                                        title={g.genre}
                                        name={"genre"}
                                        key={realIndex}
                                        id={"genre-" + realIndex}
                                        onChange={(event) => handleCheck(event, realIndex)}
                                        value={g.id}
                                        checked={movie.genres[realIndex].checked}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                <hr />
                <button className="btn btn-primary">Save</button>
                <hr />
            </form>
        </div>
    );
};

export default EditMovie;