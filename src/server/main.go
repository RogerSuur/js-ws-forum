package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"01.kood.tech/git/jrms/real-time-forum/src/server/database"
	"01.kood.tech/git/jrms/real-time-forum/src/server/ws_handler"
)

func main() {
	mux := routes() // redirects a request to a handler.

	generateNew := false
	args := os.Args[1:]

	if len(args) > 0 {
		if args[0] == "-new" {
			generateNew = true
		} else {
			fmt.Println("Error: Incorrect argument.\n\nUsage: go run src/server/*.go -new")
			os.Exit(0)
		}
	}

	database.DatabaseGod(generateNew)
	go ws_handler.ListenToWsChannel()
	log.Println("Starting web server on port 8080")
	server := &http.Server{
		Addr:    "localhost:8080",
		Handler: mux,
	}
	log.Fatal(server.ListenAndServe())
}
