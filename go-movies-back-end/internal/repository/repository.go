package repository

import (
	"backend/internal/models"
	"database/sql"
)

type DatabaseRepo interface {

	// ── Connection ─────────────────────────────────────────
	Connection() *sql.DB

	// ── Users ──────────────────────────────────────────────
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(userID int) (*models.User, error)

	// ── Genres ─────────────────────────────────────────────
	AllGenres() ([]*models.Genre, error)

	// ── Movies (Read) ──────────────────────────────────────
	AllMovies() ([]*models.Movie, error)
	OneMovie(id int) (*models.Movie, error)
	OneMovieForEdit(id int) (*models.Movie, []*models.Genre, error)

	// ── Movies (Write) ─────────────────────────────────────
	DeleteMovie(id int) error
	InsertMovie(movie models.Movie) (int, error)
	UpdateMovie(movie models.Movie) error
	UpdateMovieGenres(id int, genreIDs []int) error
}
