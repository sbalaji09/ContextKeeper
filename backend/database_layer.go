package main

import (
	"fmt"
)

func (handler *DatabaseHandler) AddPlant(
	user_id string,
	plant_name string,
	scientific_name string,
	species string,
	image_url string,
	plant_pet_name string,
	plant_health int,
) (int, error) {
	insertQuery := `
		WITH plant_count AS (
			SELECT COUNT(*) AS count FROM plants WHERE user_id = $1
		),
		insert_if_under_limit AS (
			INSERT INTO plants (user_id, plant_name, scientific_name, species, image_url, plant_pet_name, plant_health)
			SELECT $1, $2, $3, $4, $5, $6, $7
			FROM plant_count
			WHERE plant_count.count < 5
			RETURNING plant_id  -- Assumes 'id' is your PK column
		)
		SELECT plant_id FROM insert_if_under_limit;
	`

	var plantID int // Change type to int if your 'id' is integer
	err := handler.Db.QueryRow(insertQuery, user_id, plant_name, scientific_name, species, image_url, plant_pet_name, plant_health).Scan(&plantID)
	if err != nil {
		fmt.Println("ERROR inserting plant:", err)
		return 0, err
	}

	return plantID, nil
}
