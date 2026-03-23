package repository

import (
	"backend/internal/models"
	"database/sql"
)

type DatabaseRepo interface {
	Connection() *sql.DB

	AllGenres() ([]*models.Genre, error)
	AllMovies() ([]*models.Movie, error)

	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(userID int) (*models.User, error)

	OneMovie(id int) (*models.Movie, error)
	OneMovieForEdit(id int) (*models.Movie, []*models.Genre, error)

	InsertMovie(movie models.Movie) (int, error)
}
