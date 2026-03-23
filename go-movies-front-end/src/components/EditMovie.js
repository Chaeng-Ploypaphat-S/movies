import Input from "./form/Input";
import Select from "./form/Select";
import Checkbox from "./form/Checkbox";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import TextArea from "./form/TextArea";

const EditMovie = () => {
    const navigate = useNavigate();
    const { jwtToken } = useOutletContext();

    const [error, setError] = useState(null);
    const [errors, setErrors] = useState([]);

    const mpaaOptions = [
        {id: "G", value: "G"},
        {id: "PG", value: "PG"},
        {id: "PG13", value: "PG13"},
        {id: "R", value: "R"},
        {id: "NC17", value: "NC17"},
        {id: "18A", value: "18A"},
    ]
    const hasError = (key) => {
        return errors.indexOf(key) !== -1;
    }
    const [movie, setMovie] = useState({
        // adding default
        id: 0,
        title: "",
        release_date: "",
        runtime: "",
        mpaa_rating: "",
        description: "",
        genres: [],
        genres_array: [Array(13).fill(false)]
    });

    // get id from the URL
    let {id} = useParams();
    if (id === undefined) {
        id = 0;
    }

    // get from the backend
    useEffect(() => {
        // if not authorized, return to the login page
        if (jwtToken === "") {
            navigate("/login")
        }

        if (id === 0) {
            // set item back to an empty and then add new info
            setMovie({
                id: 0,
                title: "",
                release_date: "",
                runtime: "",
                mpaa_rating: "",
                description: "",
                genres: [],
                genres_array: [Array(13).fill(false)]        
            })

            const headers = new Headers();
            headers.append("Content-Type", "application/json");
            
            // not a protected route, so no authorization needed
            // only request options needed here
            const requestOptions = {
                method: "GET",
                headers: headers,
            }

            fetch(`/genres`, requestOptions)
                .then((response) => response.json())
                .then((data) => {
                    const checks = [];
                    data.forEach(g => {
                        checks.push({
                            id: g.id,
                            checked: false,
                            genre: g.genre,
                        })
                    })
                    setMovie(m => ({
                        ...m,
                        genres: checks,
                        genres_array: [],
                    }))
                })
                .catch(err => {
                    console.log(err)
                })

        } else {
            // edit an existing one
        }


    }, [id, jwtToken, navigate])

    // handle submitting the form
    const handleSubmit = (event) => {
        event.preventDefault();
    }

    const handleChange = () => (event) => {
        let value = event.target.value;
        let name = event.target.name;
        setMovie({
            ...movie,
            [name]: value,
        })
    }
    const handleCheck = (event, position) => {
        console.log("handleCheck called");
        console.log("value in handleCheck", event.target.value);
        console.log("checked is", event.target.checked)
        console.log("position is", position)

        let tmpArr = movie.genres;
        tmpArr[position].checked = !tmpArr[position].checked

        let tmpIDs = movie.genres_array;
        if (!event.target.checked) {
            tmpIDs.splice(tmpIDs.indexOf(event.target.value));
        } else {
            tmpIDs.push(parseInt(event.target.value, 10))
        }

        setMovie({
            ...movie,
            genres_array: tmpIDs,
        })
    }

    return (
        <div>
            <h2>Add/Edit Movie</h2>
            <hr />
            <pre>{JSON.stringify(movie, null, 3)}</pre>
            <form onSubmit={handleSubmit}>
                <input type="hidden" name="id" value={EditMovie.id} id="id"></input>
                <Input 
                    title={"Title"}
                    className={"form-control"}
                    type={"text"}
                    name={"title"}
                    value={movie.title}
                    onChange={handleChange("title")}
                    errorDiv={hasError("title") ? "text-dander" : "d-none"}
                    errorMsg={"Please enter a title"}
                />
                <Input 
                    title={"Release Date"}
                    className={"form-control"}
                    type={"date"}
                    name={"release_date"}
                    value={movie.release_date}
                    onChange={handleChange("release_date")}
                    errorDiv={hasError("release_date") ? "text-dander" : "d-none"}
                    errorMsg={"Please enter a release date"}
                />
                <Input 
                    title={"Rumtime"}
                    className={"form-control"}
                    type={"text"}
                    name={"runtime"}
                    value={movie.runtime}
                    onChange={handleChange("runtime")}
                    errorDiv={hasError("runtime") ? "text-dander" : "d-none"}
                    errorMsg={"Please enter a runtime"}
                />

                <Select
                    title={"MPAA Rating"}
                    name={"mpaa_rating"}
                    options={mpaaOptions}
                    onChange={handleChange("mpaa_rating")}
                    placeHolder={"Choose..."}
                    errorMsg={"Please enter a runtime"}
                    errorDiv={hasError("mpaa_rating") ? "text-dander" : "d-none"}
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
                <h3>Ganres</h3>
                <hr />
                {movie.genres && movie.genres.length > 1 &&
                    <>
                        {Array.from(movie.genres).map((g, index) =>
                            <Checkbox
                                title={g.genre}
                                name={"genre"}
                                key={index}
                                id={"genre-" + index}
                                onChange={(event) => handleCheck(event, index)}
                                value={g.id}
                                checked={movie.genres[index].checked}
                            />
                        )}
                    </>
                }
            </form>
        </div>
    )
}

export default EditMovie;