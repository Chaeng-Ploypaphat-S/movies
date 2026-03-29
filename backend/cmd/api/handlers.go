package main

import (
	"backend/internal/graph"
	"backend/internal/models"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v4"
)

// ── Home ───────────────────────────────────────────────────────────────────────

func (app *application) Home(w http.ResponseWriter, r *http.Request) {
	var payload = struct {
		Status  string `json:"status"`
		Message string `json:"message"`
		Version string `json:"version"`
	}{
		Status:  "active",
		Message: "Go Movies Updated",
		Version: "1.0.1",
	}

	_ = app.writeJSON(w, http.StatusOK, payload)
}

// ── Auth ───────────────────────────────────────────────────────────────────────

func (app *application) authenticate(w http.ResponseWriter, r *http.Request) {
	var requestPayload struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := app.readJSON(w, r, &requestPayload)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to parse login credentials from request body: %w", err), http.StatusBadRequest)
		return
	}

	// validate user against database
	user, err := app.DB.GetUserByEmail(requestPayload.Email)
	if err != nil {
		app.errorJSON(w, errors.New("invalid credentials"), http.StatusBadRequest)
		return
	}

	// check password
	valid, err := user.PasswordMatches(requestPayload.Password)
	if err != nil || !valid {
		app.errorJSON(w, errors.New("invalid credentials"), http.StatusBadRequest)
		return
	}

	u := jwtUser{
		ID:        user.ID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
	}

	tokens, err := app.auth.GenerateTokenPair(&u)
	if err != nil {
		app.errorJSON(w, err)
		return
	}

	http.SetCookie(w, app.auth.GetRefreshCookie(tokens.RefreshToken))
	app.writeJSON(w, http.StatusAccepted, tokens)
}

func (app *application) refreshToken(w http.ResponseWriter, r *http.Request) {
	for _, cookie := range r.Cookies() {
		if cookie.Name == app.auth.CookieName {
			claims := &Claims{}
			refreshToken := cookie.Value

			_, err := jwt.ParseWithClaims(refreshToken, claims, func(token *jwt.Token) (interface{}, error) {
				return []byte(app.JWTSecret), nil
			})
			if err != nil {
				app.errorJSON(w, errors.New("unauthorized"), http.StatusUnauthorized)
				return
			}

			userID, err := strconv.Atoi(claims.Subject)
			if err != nil {
				app.errorJSON(w, errors.New("unknown user (an issue with the token claims)"), http.StatusUnauthorized)
				return
			}

			user, err := app.DB.GetUserByID(userID)
			if err != nil {
				app.errorJSON(w, errors.New("unknown user (an issue with the ID)"), http.StatusUnauthorized)
				return
			}

			u := jwtUser{
				ID:        user.ID,
				FirstName: user.FirstName,
				LastName:  user.LastName,
			}

			tokens, err := app.auth.GenerateTokenPair(&u)
			if err != nil {
				app.errorJSON(w, errors.New("error generating tokens"), http.StatusUnauthorized)
				return
			}

			http.SetCookie(w, app.auth.GetRefreshCookie(tokens.RefreshToken))
			app.writeJSON(w, http.StatusOK, tokens)
			return
		}
	}

	app.errorJSON(w, errors.New("unauthorized"), http.StatusUnauthorized)
}

func (app *application) logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, app.auth.GetExpiredRefreshCookie())
	app.writeJSON(w, http.StatusOK, JSONResponse{
		Error:   false,
		Message: "logged out",
	})
}

// ── Movies (Public) ────────────────────────────────────────────────────────────

func (app *application) AllMovies(w http.ResponseWriter, r *http.Request) {
	movies, err := app.DB.AllMovies()
	if err != nil {
		app.errorJSON(w, err)
		return
	}

	_ = app.writeJSON(w, http.StatusOK, movies)
}

func (app *application) AllMoviesByGenre(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	movieID, err := strconv.Atoi(id)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("invalid movie id '%s': %w", id, err), http.StatusBadRequest)
		return
	}

	movies, err := app.DB.AllMovies(movieID)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to fetch movie with id %d from database: %w", movieID, err), http.StatusNotFound)
		return
	}

	_ = app.writeJSON(w, http.StatusOK, movies)
}

func (app *application) GetMovie(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	movieID, err := strconv.Atoi(id)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("invalid movie id '%s': %w", id, err), http.StatusBadRequest)
		return
	}

	movie, err := app.DB.OneMovie(movieID)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to fetch movie with id %d from database: %w", movieID, err), http.StatusNotFound)
		return
	}

	_ = app.writeJSON(w, http.StatusOK, movie)
}

func (app *application) moviesGraphQL(w http.ResponseWriter, r *http.Request) {
	movies, _ := app.DB.AllMovies()

	q, _ := io.ReadAll(r.Body)
	query := string(q)

	g := graph.New(movies)

	g.QueryString = query

	resp, err := g.Query()
	if err != nil {
		app.errorJSON(w, err)
		return
	}
	resp_json, _ := json.MarshalIndent(resp, "", "\t")
	w.Header().Set("Content-Type", "application/json")
	w.Write(resp_json)
}

// ── Genres (Public) ────────────────────────────────────────────────────────────

func (app *application) AllGenres(w http.ResponseWriter, r *http.Request) {
	genres, err := app.DB.AllGenres()
	if err != nil {
		app.errorJSON(w, err)
		return
	}

	_ = app.writeJSON(w, http.StatusOK, genres)
}

// ── Movies (Admin) ─────────────────────────────────────────────────────────────

func (app *application) MovieCatalogue(w http.ResponseWriter, r *http.Request) {
	movies, err := app.DB.AllMovies()
	if err != nil {
		app.errorJSON(w, err)
		return
	}

	_ = app.writeJSON(w, http.StatusOK, movies)
}

func (app *application) MovieForEdit(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	movieID, err := strconv.Atoi(id)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("invalid movie id '%s': %w", id, err), http.StatusBadRequest)
		return
	}

	movie, genres, err := app.DB.OneMovieForEdit(movieID)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to fetch movie with id %d for edit: %w", movieID, err), http.StatusNotFound)
		return
	}

	var payload = struct {
		Movie  *models.Movie   `json:"movie"`
		Genres []*models.Genre `json:"genres"`
	}{
		movie,
		genres,
	}

	_ = app.writeJSON(w, http.StatusOK, payload)
}

func (app *application) InsertMovie(w http.ResponseWriter, r *http.Request) {
	var movie models.Movie

	// log raw request body for debugging
	body, err := io.ReadAll(r.Body)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to read request body: %w", err), http.StatusBadRequest)
		return
	}
	log.Println("InsertMovie raw request body:", string(body))
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	err = app.readJSON(w, r, &movie)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to parse movie payload from request body: %w", err), http.StatusBadRequest)
		return
	}

	movie = app.getPoster(movie)
	movie.CreatedAt = time.Now()
	movie.UpdatedAt = time.Now()

	newID, err := app.DB.InsertMovie(movie)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to insert movie '%s': %w", movie.Title, err))
		return
	}

	err = app.DB.UpdateMovieGenres(newID, movie.GenresArray)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to update genres for movie id %d: %w", newID, err))
		return
	}

	app.writeJSON(w, http.StatusAccepted, JSONResponse{
		Error:   false,
		Message: fmt.Sprintf("movie '%s' inserted with id %d", movie.Title, newID),
	})
}

func (app *application) UpdateMovie(w http.ResponseWriter, r *http.Request) {
	var requestPayload models.Movie

	err := app.readJSON(w, r, &requestPayload)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to parse movie payload from request body: %w", err), http.StatusBadRequest)
		return
	}

	movie, err := app.DB.OneMovie(requestPayload.ID)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to fetch movie with id %d from database: %w", requestPayload.ID, err), http.StatusNotFound)
		return
	}

	// apply updates
	movie.Title = requestPayload.Title
	movie.ReleaseDate = requestPayload.ReleaseDate
	movie.Description = requestPayload.Description
	movie.MPAARating = requestPayload.MPAARating
	movie.RunTime = requestPayload.RunTime
	movie.UpdatedAt = time.Now()

	err = app.DB.UpdateMovie(*movie)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to update movie '%s' in database: %w", movie.Title, err))
		return
	}

	err = app.DB.UpdateMovieGenres(movie.ID, requestPayload.GenresArray)
	if err != nil {
		app.errorJSON(w, fmt.Errorf("failed to update genres for movie '%s': %w", movie.Title, err))
		return
	}

	app.writeJSON(w, http.StatusAccepted, JSONResponse{
		Error:   false,
		Message: fmt.Sprintf("movie '%s' updated successfully", movie.Title),
	})
}

func (app *application) DeleteMovie(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		log.Println("DeleteMovie: failed to retrieve:", err)
		return
	}

	err = app.DB.DeleteMovie(id)
	if err != nil {
		app.errorJSON(w, err)
	}

	resp := JSONResponse{
		Error:   false,
		Message: "movie daleted",
	}

	app.writeJSON(w, http.StatusAccepted, resp)
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// getPoster fetches the movie poster path from The Movie DB API.
// If the API call fails for any reason, the movie is returned unchanged.
func (app *application) getPoster(movie models.Movie) models.Movie {
	type TheMovieDB struct {
		Page    int `json:"page"`
		Results []struct {
			PosterPath string `json:"poster_path"`
		} `json:"results"`
		TotalPages int `json:"total_pages"`
	}

	client := &http.Client{}
	theUrl := fmt.Sprintf("https://api.themoviedb.org/3/search/movie?api_key=%s", app.APIKey)

	req, err := http.NewRequest("GET", theUrl+"&query="+url.QueryEscape(movie.Title), nil)
	if err != nil {
		log.Println("getPoster: failed to build request:", err)
		return movie
	}

	req.Header.Add("Accept", "application/json")
	req.Header.Add("Content-Type", "application/json")

	response, err := client.Do(req)
	if err != nil {
		log.Println("getPoster: failed to call TMDB API:", err)
		return movie
	}
	defer response.Body.Close()

	bodyBytes, err := io.ReadAll(response.Body)
	if err != nil {
		log.Println("getPoster: failed to read TMDB response:", err)
		return movie
	}

	var responseObject TheMovieDB
	json.Unmarshal(bodyBytes, &responseObject)

	if len(responseObject.Results) > 0 {
		movie.Image = responseObject.Results[0].PosterPath
	}

	return movie
}
