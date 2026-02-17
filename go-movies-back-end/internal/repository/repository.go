package repository

import (
	"backend/internal/models"
	"database/sql"
)

type DatabaseRepo interface {
	AllMovies() ([]*models.Movie, error)
	Connection() *sql.DB
	GetUserByEmail(email string) (*models.User, error)
}
