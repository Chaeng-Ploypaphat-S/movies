package main

import (
	"fmt"
	"net/http"
)

type jsonResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Version string `json:"version"`
}

func (app *appliation) Home(w http.ResponseWriter, r *http.Request) {

	payload := jsonResponse{
		Status:  "active",
		Message: "Go Movies Updated",
		Version: "1.0.1",
	}

	_ = app.writeJSON(w, http.StatusOK, payload)
}

func (app *appliation) AllMovies(w http.ResponseWriter, r *http.Request) {
	movies, err := app.DB.AllMovies()
	if err != nil {
		fmt.Println("Cannot get all moviesd")
		return
	}

	_ = app.writeJSON(w, http.StatusOK, movies)
}
