package main

import (
	"net/http"
)

type jsonResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Version string `json:"version"`
}

func (app *application) Home(w http.ResponseWriter, r *http.Request) {

	payload := jsonResponse{
		Status:  "active",
		Message: "Go Movies Updated",
		Version: "1.0.1",
	}

	_ = app.writeJSON(w, http.StatusOK, payload)
}

func (app *application) AllMovies(w http.ResponseWriter, r *http.Request) {
	movies, err := app.DB.AllMovies()
	if err != nil {
		app.errorJSON(w, err)
		return
	}

	_ = app.writeJSON(w, http.StatusOK, movies)
}
