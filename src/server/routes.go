package main

import (
	"net/http"

	"01.kood.tech/git/jrms/real-time-forum/src/server/ws_handler"
)

func routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/src/server/", ws_handler.Home)
	// mux.HandleFunc("/src/server/err", err)

	mux.HandleFunc("/src/server/login", login)
	mux.HandleFunc("/src/server/signup", SignUpHandler)
	mux.HandleFunc("/src/server/addPostHandler", addPostHandler)
	mux.HandleFunc("/src/server/addMessageHandler", addMessageHandler)
	mux.HandleFunc("/src/server/addCommentsHandler", addCommentsHandler)
	mux.HandleFunc("/src/server/getUsersHandler", getUsersHandler)
	mux.HandleFunc("/src/server/getPostsHandler", getPostsHandler)
	mux.HandleFunc("/src/server/getMessagesHandler", getMessagesHandler)
	mux.HandleFunc("/src/server/getCommentsHandler", getCommentsHandler)
	mux.HandleFunc("/src/server/checkCookieHandler", checkCookieHandler)
	mux.HandleFunc("/src/server/deleteCookieHandler", deleteCookieHandler)
	mux.HandleFunc("/ws", ws_handler.WsEndPoint)
	mux.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("./src/webapp"))))
	return mux
}
