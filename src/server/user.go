package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"01.kood.tech/git/jrms/real-time-forum/src/server/database"
	uuid "github.com/satori/go.uuid"
)

type signupData struct {
	Username  string `json:"username-register"`
	Email     string `json:"email-register"`
	Password  string `json:"password-register"`
	FirstName string `json:"first-name-register"`
	LastName  string `json:"last-name-register"`
	Age       string `json:"age-register"`
	Gender    string `json:"gender-register"`
}

type signinData struct {
	UserID   string `json:"user_id"`
	Username string `json:"username_login"`
	Email    string `json:"email_login"`
	Password string `json:"password_login"`
}

type Post struct {
	User      string `json:"user"`
	PostID    string `json:"postID"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
	Comments  int    `json:"comments"`
	Category  string `json:"category"`
}

type Message struct {
	MessageID string `json:"message_id"`
	Sender    string `json:"from"`
	Receiver  string `json:"to"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
}

type Comment struct {
	CommentID string `json:"commentID"`
	Author    string `json:"user"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
	PostID    string `json:"postID"`
}

func SignUpHandler(w http.ResponseWriter, r *http.Request) {
	// some good error handling, dont know what it does really
	// w.Header().Set("Content-Type", "application/json")
	// defer func() {
	// 	if err := recover(); err != nil {
	// 		log.Println(err)
	// 		w.WriteHeader(500)
	// 		jsonResponse, _ := json.Marshal(map[string]string{
	// 			"message": "internal server error",
	// 		})
	// 		w.Write(jsonResponse)
	// 	}
	// }()

	var data signupData
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&data)
	if err != nil {
		log.Println("Error decoding signup data:", err.Error())
		w.WriteHeader(400)
		return
	}

	hash, err := database.HashPassword(data.Password)
	if err != nil {
		log.Println("Error in hashing password:", err.Error())
		w.WriteHeader(400)
		return
	}

	_, err = database.Statements["addUser"].Exec(data.Username, data.Email, hash, data.FirstName, data.LastName, data.Age, data.Gender)
	if err != nil {
		log.Println("Error in adding user to db:", err.Error())
		jsonResponse := map[string]string{
			"message":     "",
			"requirement": "",
		}
		w.WriteHeader(409)
		if strings.Contains(err.Error(), "users.username") {
			jsonResponse["message"] = "username-register"
			jsonResponse["requirement"] = "Username already taken"
		}
		if strings.Contains(err.Error(), "users.email") {
			jsonResponse["message"] = "email-register"
			jsonResponse["requirement"] = "Email already taken"
		}
		b, _ := json.Marshal(jsonResponse)
		w.Write(b)
		return
	} else {
		user_ID, err := getID(data.Username)
		if err != nil {
			log.Println("Error with getting user ID:", err.Error())
			w.WriteHeader(500)
			return
		}
		UUID, err := createSession(user_ID)
		if err != nil {
			log.Println("Error with creating session:", err.Error())
			w.WriteHeader(500)
			return
		}

		// write tht session to clientside
		w.WriteHeader(200)
		jsonResponse, _ := json.Marshal(map[string]string{
			"UUID":     UUID,
			"username": data.Username,
		})
		w.Write(jsonResponse)
		fmt.Println("Added ", data.Username, " to the database")
	}
}

func login(w http.ResponseWriter, r *http.Request) {
	var data signinData
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&data)
	if err != nil {
		log.Println("Error with decoding signindata:", err.Error())
		w.WriteHeader(400)
		return
	}

	var hashpass signinData

	err = database.Statements["getUser"].QueryRow(data.Username, data.Email).Scan(&hashpass.UserID, &hashpass.Username, &hashpass.Password)
	if err != nil {
		log.Println("Error with querying user data:", err.Error())
		w.WriteHeader(408)
		jsonResponse, _ := json.Marshal(map[string]string{
			"message":     "username_login",
			"requirement": "invalid credentials",
		})
		w.Write(jsonResponse)
		return
	}

	isCorrect := database.CheckPasswordHash(data.Password, hashpass.Password)
	if !isCorrect {
		w.WriteHeader(409)
		jsonResponse, _ := json.Marshal(map[string]string{
			"message":     "password_login",
			"requirement": "Wrong credentials",
		})
		w.Write(jsonResponse)
		return
	}

	UUID, err := createSession(hashpass.UserID)
	if err != nil {
		log.Println("Error with creating session:", err.Error())
		w.WriteHeader(500)
		return
	}

	// write that session to clientside
	w.WriteHeader(200)
	jsonResponse, _ := json.Marshal(map[string]string{
		"UUID":     UUID,
		"username": hashpass.Username,
	})
	w.Write(jsonResponse)
}

func createSession(user_ID string) (UUID string, err error) {
	UUID = uuid.NewV4().String()

	_, err = database.Statements["addSession"].Exec(UUID, user_ID)
	if err != nil {
		return "", err
	}
	return UUID, nil
}

func getUsersHandler(w http.ResponseWriter, r *http.Request) {
	var user string = r.Header.Get("X-Username")
	userID, err := getID(user)
	if err != nil {
		log.Println("Error with getting users ID", err.Error())
		return
	}

	rows, err := database.Statements["getUsers"].Query(userID)
	if err != nil {
		log.Println("Error with getting users from DB:", err.Error())
		return
	}
	defer rows.Close()

	var users database.Data

	// get all messages from the users and then sort the users based on the message to "user"
	for rows.Next() {
		var username string
		err = rows.Scan(&username)
		if err != nil {
			log.Println("Error with scanning usernames:", err.Error())
			w.WriteHeader(400)
			return
		}
		if username != user {
			users.Status.Offline = append(users.Status.Offline, database.Offline{
				Username: username,
				Unread:   false,
			})
		}
	}

	users.Status.Online = []database.Online{} // Needed to keep JSon from going stupid
	b, _ := json.Marshal(users)
	w.Write(b)
}

func checkCookieHandler(w http.ResponseWriter, r *http.Request) {
	userUUID, err := io.ReadAll(r.Body)
	if err != nil {
		log.Println("Error with getting UUID:", err.Error())
		w.WriteHeader(400)
		return
	}
	r.Body.Close()

	var username string
	err = database.Statements["getUserByUUID"].QueryRow(string(userUUID)).Scan(&username)
	if err != nil {
		log.Println("Error with getting user by UUID from db:", err.Error())
		w.WriteHeader(500)
		jsonResponse, _ := json.Marshal(map[string]string{
			"message": "can't find session UUID",
		})
		w.Write(jsonResponse)
		return
	}

	jsonResponse, _ := json.Marshal(map[string]string{
		"user": username,
	})
	w.Write(jsonResponse)
}

func deleteCookieHandler(w http.ResponseWriter, r *http.Request) {
	userUUID, err := io.ReadAll(r.Body)
	if err != nil {
		log.Println("Error with getting user to delete by UUID:", err.Error())
		w.WriteHeader(400)
		return
	}
	r.Body.Close()

	fmt.Println("Deleteing user with uuid:", string(userUUID))

	_, err = database.Statements["deleteSession"].Exec(string(userUUID))
	if err != nil {
		log.Println("Error with deleting session:", err.Error())
		w.WriteHeader(500)
		jsonResponse, _ := json.Marshal(map[string]string{
			"message": "can't find session UUID",
		})
		w.Write(jsonResponse)
		return
	}

	w.WriteHeader(200)
	jsonResponse, _ := json.Marshal(map[string]string{
		"message": "Session deleted",
	})
	w.Write(jsonResponse)
}
