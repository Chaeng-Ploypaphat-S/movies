// The entry point for all HTTP traffic in the app. Every request comes in here,
// passes through the middleware, and gets dispatched to the right handler based
// on the URL and HTTP method.

package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func (app *application) routes() http.Handler {
	mux := chi.NewRouter()

	// Register global middleware
	mux.Use(middleware.Recoverer) // Catches any panic and handle gracefully
	mux.Use(app.enableCORS)       // Cross-Origin Resource Sharing

	mux.Get("/", app.Home)

	mux.Post("/authenticate", app.authenticate)

	mux.Get("/refresh", app.refreshToken)

	mux.Get("/logout", app.logout)

	mux.Get("/movies", app.AllMovies)
	mux.Get("/movies/{id}", app.GetMovie)

	// Admin mode only (required authorization)
	mux.Route("/admin", func(mux chi.Router) {
		mux.Use(app.authRequired)
		mux.Get("/movies", app.MovieCetalog)
		mux.Get("/movies/{id}", app.MovieForEdit)
	})

	return mux
}
