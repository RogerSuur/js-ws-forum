package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"os"
	"sort"
	"time"
)

var (
	m   = make(map[string]string)
	arr = []string{}
)

func sampledata(db *sql.DB) {
	insertSampleUsers(db)
	insertSamplePosts(db)
	insertSampleMessages(db)
	insertSampleComments(db)
}

func insertSamplePosts(db *sql.DB) {
	jsonFile, err := os.Open("./src/webapp/static/postsData.json")
	if err != nil {
		fmt.Println(err)
	}

	defer jsonFile.Close()

	byteValue, _ := io.ReadAll(jsonFile)

	var posts Data

	json.Unmarshal(byteValue, &posts)

	sort.Slice(posts.Status.Post, func(i, j int) bool {
		layout := time.RFC3339
		a := posts.Status.Post[i].Timestamp
		b := posts.Status.Post[j].Timestamp
		t1, err := time.Parse(layout, a)
		t2, err2 := time.Parse(layout, b)
		if err != nil || err2 != nil {
			fmt.Println(err, err2)
		}
		return t1.Before(t2)
	})

	statement, err := db.Prepare("INSERT OR IGNORE INTO posts (post_author, title, content, timestamp, category, comments) VALUES (?,?,?,?,?,?)")
	if err != nil {
		log.Fatal(err.Error())
	}

	for _, v := range posts.Status.Post {
		statement.Exec(rand.Intn(7)+1, v.Title, v.Content, v.Timestamp, v.Category, v.Comments)
	}

	fmt.Println("Sampleposts inserted successfully!")
}

func insertSampleUsers(db *sql.DB) {
	statement, err := db.Prepare("INSERT OR IGNORE INTO users (username, email, password, first_name, last_name, age, gender) VALUES (?,?,?,?,?,?,?)")
	if err != nil {
		log.Fatal(err.Error())
	}

	m = map[string]string{
		"Mark":   "Mark@gmail.com",
		"Kate":   "Kate@gmail.com",
		"John":   "John@gmail.com",
		"Susan":  "Susan@gmail.com",
		"Vic666": "Vic666@gmail.com",
		"Mike":   "Mike@gmail.com",
		"Jack":   "Jack@gmail.com",
	}

	count := 0
	for k, v := range m {
		arr = append(arr, k, v)
		hash, err := HashPassword("1234")
		if err != nil {
			log.Fatal(err.Error())
		}
		statement.Exec(arr[count], arr[count+1], hash, "", "", "", "")
		count += 2
	}

	fmt.Println("Sampleusers inserted successfully!")
}

func insertSampleMessages(db *sql.DB) {
	jsonFile, err := os.Open("./src/webapp/static/messagesData.json")
	if err != nil {
		fmt.Println(err)
	}

	defer jsonFile.Close()

	byteValue, _ := io.ReadAll(jsonFile)

	var posts Data

	json.Unmarshal(byteValue, &posts)

	sort.Slice(posts.Status.Message, func(i, j int) bool {
		layout := time.RFC3339
		a := posts.Status.Message[i].Timestamp
		b := posts.Status.Message[j].Timestamp
		t1, err := time.Parse(layout, a)
		t2, err2 := time.Parse(layout, b)
		if err != nil || err2 != nil {
			fmt.Println(err, err2)
		}
		return t1.Before(t2)
	})

	statement, err := db.Prepare("INSERT OR IGNORE INTO messages (content, timestamp, from_id, to_id) VALUES (?,?,?,?)")
	if err != nil {
		log.Fatal(err.Error())
	}

	for _, v := range posts.Status.Message {
		ranInt := rand.Intn(7)
		ranInt2 := rand.Intn(7)
		if ranInt == ranInt2 {
			ranInt += 1
			if ranInt > 6 {
				ranInt = 0
			}
		}
		statement.Exec(v.Content, v.Timestamp, ranInt+1, ranInt2+1)
	}

	fmt.Println("Samplemessages inserted successfully!")
}

func insertSampleComments(db *sql.DB) {
	jsonFile, err := os.Open("./src/webapp/static/commentsData.json")
	if err != nil {
		fmt.Println(err)
	}

	defer jsonFile.Close()

	byteValue, _ := io.ReadAll(jsonFile)

	var posts Data

	json.Unmarshal(byteValue, &posts)

	sort.Slice(posts.Status.Post, func(i, j int) bool {
		layout := time.RFC3339
		a := posts.Status.Post[i].Timestamp
		b := posts.Status.Post[j].Timestamp
		t1, err := time.Parse(layout, a)
		t2, err2 := time.Parse(layout, b)
		if err != nil || err2 != nil {
			fmt.Println(err, err2)
		}
		return t1.Before(t2)
	})

	statement, err := db.Prepare("INSERT OR IGNORE INTO comments ( content, timestamp, user_id, post_id) VALUES (?,?,?,?)")
	if err != nil {
		log.Fatal("error preparing statement,", err.Error())
	}

	for _, v := range posts.Status.Comment {
		postToComment := rand.Intn(27) + 1
		// update comment count for post
		commentUpdateStatement, err := db.Prepare(`UPDATE posts SET comments = comments + 1 WHERE post_id = ?`)
		if err != nil {
			log.Println("Error with updating comment count", err.Error())
			return
		}
		commentUpdateStatement.Exec(postToComment)
		statement.Exec(v.Content, v.Timestamp, rand.Intn(7)+1, postToComment)
	}

	fmt.Println("SampleComments inserted successfully!")
}
