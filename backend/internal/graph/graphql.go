package graph

import (
	"backend/internal/models"
	"errors"
	"strings"

	"github.com/graphql-go/graphql"
)

type Graph struct {
	Movies      []*models.Movie
	QueryString string
	Config      graphql.SchemaConfig
	fields      graphql.Fields
	movieType   *graphql.Object
}

func (g *Graph) Query() (*graphql.Result, error) {
	rootQuery := graphql.ObjectConfig{
		Name:   "RootQuery",
		Fields: g.fields,
	}

	schema, err := graphql.NewSchema(graphql.SchemaConfig{
		Query: graphql.NewObject(rootQuery),
	})
	if err != nil {
		return nil, err
	}

	response := graphql.Do(graphql.Params{
		Schema:        schema,
		RequestString: g.QueryString,
	})
	if len(response.Errors) > 0 {
		return nil, errors.New("Error in Graph's query.")
	}

	return response, nil
}

func New(movies []*models.Movie) *Graph {
	// define movie information
	var movieType = graphql.NewObject(
		graphql.ObjectConfig{
			Name: "Movie",
			Fields: graphql.Fields{
				"id":           &graphql.Field{Type: graphql.Int},
				"title":        &graphql.Field{Type: graphql.String},
				"description":  &graphql.Field{Type: graphql.String},
				"release_date": &graphql.Field{Type: graphql.DateTime},
				"runtime":      &graphql.Field{Type: graphql.Int},
				"mpaa_rating":  &graphql.Field{Type: graphql.String},
				"created_at":   &graphql.Field{Type: graphql.DateTime},
				"updated_at":   &graphql.Field{Type: graphql.DateTime},
				"image":        &graphql.Field{Type: graphql.String},
			},
		},
	)

	// define avalable actions
	var fields = graphql.Fields{
		"list": &graphql.Field{
			Type:        graphql.NewList(movieType),
			Description: "Get all movies",
			Resolve: func(params graphql.ResolveParams) (any, error) {
				return movies, nil
			},
		},
		"search": &graphql.Field{
			Type:        graphql.NewList(movieType),
			Description: "Search movies by title",
			Args: graphql.FieldConfigArgument{
				"titleContains": &graphql.ArgumentConfig{
					Type: graphql.String,
				},
			},
			Resolve: func(params graphql.ResolveParams) (any, error) {
				var theList []*models.Movie
				search, ok := params.Args["titleContains"].(string)
				if ok {
					for _, m := range movies {
						t := strings.ToLower(m.Title)
						s := strings.ToLower(search)
						if strings.Contains(t, s) {
							theList = append(theList, m)
						}
					}
				}
				return theList, nil
			},
		},

		"get": &graphql.Field{
			Type:        movieType,
			Description: "Get movie by id",
			Args: graphql.FieldConfigArgument{
				"id": &graphql.ArgumentConfig{
					Type: graphql.Int,
				},
			},
			Resolve: func(p graphql.ResolveParams) (any, error) {
				id, ok := p.Args["id"].(int)
				if ok {
					for _, m := range movies {
						if m.ID == id {
							return m, nil
						}
					}
				}
				return nil, nil
			},
		},
	}

	var g = Graph{
		Movies:    movies,
		fields:    fields,
		movieType: movieType,
	}
	return &g
}
