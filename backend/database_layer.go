package main

import (
	"fmt"
)

func (handler *DatabaseHandler) AddWorkspace(tabs []Tab) (int, error) {
	insertQuery := `
		INSERT INTO workspaces (
			tabs,
			created_at
		
		)
	`

	// var plantID int // Change type to int if your 'id' is integer
	// err := handler.Db.QueryRow(insertQuery, user_id, plant_name, scientific_name, species, image_url, plant_pet_name, plant_health).Scan(&plantID)
	// if err != nil {
	// 	fmt.Println("ERROR inserting plant:", err)
	// 	return 0, err
	// }
	fmt.Println(insertQuery)
	return 1, nil
}
